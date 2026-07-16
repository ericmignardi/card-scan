import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY environment secret.");
    }

    // 2. Validate User JWT & Initialize Supabase Client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Authenticate the supabase client with the user's JWT to respect Storage RLS policies
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Parse Request Body
    const { frontPath, backPath } = await req.json();
    if (!frontPath || !backPath) {
      throw new Error("Both frontPath and backPath are required.");
    }

    // 4. Download images from Storage
    const [frontFile, backFile] = await Promise.all([
      downloadStorageFile(supabaseClient, frontPath),
      downloadStorageFile(supabaseClient, backPath),
    ]);

    // 5. Convert files to Base64
    const frontBase64 = encodeBase64(frontFile);
    const backBase64 = encodeBase64(backFile);

    // 6. Invoke Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const promptText = `
      You are an expert sports card appraiser and cataloger. You are given two images:
      Image 1 is the FRONT of a sports card.
      Image 2 is the BACK of a sports card.

      Examine both images meticulously to identify the card.
      - Look for the player name, team, brand logo (e.g., Topps, Panini, Bowman, Fleer), and year of release.
      - Check if it is a Rookie Card. Rookie cards on the front typically have a 'RC' logo, 'Rookie Card' banner, 'Rated Rookie' logo (Donruss/Panini), or Bowman '1st Bowman' logo.
      - Check the back of the card to confirm the copyright year, card number (e.g., in a corner or header, prefixed by '#' or letters), and see if there are serial numbers stamped (e.g., '10/99', '250/250').
      - Detect if it is an insert card, an autographed card, or a memorabilia card (patch, jersey piece).

      HALL OF FAME:
      Unlike every other field, 'is_hall_of_famer' is NOT read off the card. Once you have
      identified the player, decide from your own knowledge of that player's career whether
      they have been formally inducted into the major Hall of Fame for their sport:
        Baseball   -> National Baseball Hall of Fame (Cooperstown)
        Basketball -> Naismith Memorial Basketball Hall of Fame
        Football   -> Pro Football Hall of Fame (Canton)
        Hockey     -> Hockey Hall of Fame (Toronto)
        Soccer     -> National Soccer Hall of Fame
      Rules for this field:
      - Set it true ONLY for a player you positively recognize as already inducted.
      - A card may show a player years before induction; judge the player's status today,
        not the status at the time the card was printed. A 1951 Mickey Mantle rookie card is
        a Hall of Famer card.
      - Set it false for active players, for players who are merely eligible, likely, or
        "future first-ballot" candidates, for college/minor-league Halls of Fame, for team
        or franchise-specific rings of honor, and whenever you are unsure.
      - If you cannot confidently identify the player at all, set it false.
      Do not let a strong career record alone convince you; induction is a specific event
      that either happened or did not.

      Return your findings strictly in the requested JSON structure. Do not guess. If a value is unknown, return an empty string or standard defaults.
    `;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: frontBase64,
              },
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: backBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            sport: {
              type: "string",
              enum: ["Baseball", "Basketball", "Football", "Soccer", "Hockey", "Other"],
            },
            player_name: { type: "string" },
            year: { type: "integer" },
            brand: { type: "string" },
            card_number: { type: "string" },
            is_rookie: { type: "boolean" },
            is_hall_of_famer: {
              type: "boolean",
              description:
                "True only if the identified player has already been inducted into the major Hall of Fame for their sport. Judged from knowledge of the player, not from anything printed on the card. False when unsure.",
            },
            is_insert: { type: "boolean" },
            is_autographed: { type: "boolean" },
            is_memorabilia: { type: "boolean" },
            parallel_attributes: {
              type: "object",
              properties: {
                serial_num: { type: "string" },
                color: { type: "string" },
                variation: { type: "string" },
              },
              required: ["serial_num", "color", "variation"],
            },
          },
          required: [
            "sport",
            "player_name",
            "year",
            "brand",
            "card_number",
            "is_rookie",
            "is_hall_of_famer",
            "is_insert",
            "is_autographed",
            "is_memorabilia",
            "parallel_attributes",
          ],
        },
      },
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned error: ${response.status} - ${errorText}`);
    }

    const geminiData = await response.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("No response text returned from Gemini API");
    }

    // Parse the result JSON from Gemini and return it
    const cardMetadata = JSON.parse(resultText);

    return new Response(JSON.stringify({ success: true, data: cardMetadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function downloadStorageFile(supabaseClient: any, path: string): Promise<Uint8Array> {
  const { data, error } = await supabaseClient.storage.from("card-images").download(path);

  if (error) {
    throw new Error(`Failed to download file from Storage (${path}): ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
