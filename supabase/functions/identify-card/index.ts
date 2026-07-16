import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import {
  CARD_FIELD_REQUIRED,
  CARD_FIELD_SCHEMA,
  CARD_TRAIT_INSTRUCTIONS,
  HALL_OF_FAME_INSTRUCTIONS,
  callGemini,
  corsHeaders,
  createUserClient,
  downloadStorageFile,
  jsonResponse,
} from "../_shared/cardIdentification.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createUserClient(authHeader);

    const { frontPath, backPath } = await req.json();
    if (!frontPath || !backPath) {
      throw new Error("Both frontPath and backPath are required.");
    }

    const [frontFile, backFile] = await Promise.all([
      downloadStorageFile(supabaseClient, frontPath),
      downloadStorageFile(supabaseClient, backPath),
    ]);

    const promptText = `
You are an expert sports card appraiser and cataloger. You are given two images:
Image 1 is the FRONT of a sports card.
Image 2 is the BACK of a sports card.

Examine both images meticulously to identify the card.
${CARD_TRAIT_INSTRUCTIONS}
- Check the back of the card to confirm the copyright year, card number (e.g., in a corner or header, prefixed by '#' or letters), and see if there are serial numbers stamped (e.g., '10/99', '250/250').

${HALL_OF_FAME_INSTRUCTIONS}

Return your findings strictly in the requested JSON structure. Do not guess. If a value is unknown, return an empty string or standard defaults.
`.trim();

    const cardMetadata = await callGemini({
      contents: [
        {
          parts: [
            { text: promptText },
            { inlineData: { mimeType: "image/jpeg", data: encodeBase64(frontFile) } },
            { inlineData: { mimeType: "image/jpeg", data: encodeBase64(backFile) } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: CARD_FIELD_SCHEMA,
          required: CARD_FIELD_REQUIRED,
        },
      },
    });

    return jsonResponse({ success: true, data: cardMetadata });
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 400);
  }
});
