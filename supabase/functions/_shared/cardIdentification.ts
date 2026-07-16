// Shared between the identify-card (single, front+back) and identify-lot (group of fronts)
// functions. Both ask Gemini for the same card traits and must apply the same rules to
// them — Hall of Fame status in particular is easy to get subtly wrong, so its wording
// lives here rather than being copy-pasted into two prompts that could drift apart.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const BUCKET = "card-images";

// Traits read off the card itself, shared by both prompts.
export const CARD_TRAIT_INSTRUCTIONS = `
- Look for the player name, team, brand logo (e.g., Topps, Panini, Bowman, Fleer), and year of release.
- Check if it is a Rookie Card. Rookie cards on the front typically have a 'RC' logo, 'Rookie Card' banner, 'Rated Rookie' logo (Donruss/Panini), or Bowman '1st Bowman' logo.
- Detect if it is an insert card, an autographed card, or a memorabilia card (patch, jersey piece).
`.trim();

// The one trait that is NOT read off the card. Identical wording in both flows.
export const HALL_OF_FAME_INSTRUCTIONS = `
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
`.trim();

// The card-trait properties both response schemas share.
export const CARD_FIELD_SCHEMA = {
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
} as const;

export const CARD_FIELD_REQUIRED = [
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
];

// Authenticates as the calling user rather than with the service role, so Storage RLS
// still applies inside the function.
export function createUserClient(authHeader: string) {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function downloadStorageFile(supabaseClient: any, path: string): Promise<Uint8Array> {
  const { data, error } = await supabaseClient.storage.from(BUCKET).download(path);

  if (error) {
    throw new Error(`Failed to download file from Storage (${path}): ${error.message}`);
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function callGemini(payload: unknown): Promise<any> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY environment secret.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned error: ${response.status} - ${await response.text()}`);
  }

  const geminiData = await response.json();
  const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error("No response text returned from Gemini API");
  }

  return JSON.parse(resultText);
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
