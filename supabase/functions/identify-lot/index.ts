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

// Identifies every card in a single photo of a group of cards laid out together (a "lot"
// scan). Only the fronts are photographed, so unlike identify-card there is no back to
// confirm the card number or read serial numbering from — the prompt says so explicitly
// rather than letting the model invent those values.
//
// Each card is returned with a box_2d bounding box so the client can crop it out of the
// original photo and give it its own image.
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

    const { lotPath } = await req.json();
    if (!lotPath) {
      throw new Error("lotPath is required.");
    }

    const lotFile = await downloadStorageFile(supabaseClient, lotPath);

    const promptText = `
You are an expert sports card appraiser and cataloger. You are given ONE image showing
multiple sports cards laid out together in a grid, FRONT side up.

Identify EVERY card visible in the image. Return one entry per card.
${CARD_TRAIT_INSTRUCTIONS}

BOUNDING BOXES:
For each card, return 'box_2d' as [ymin, xmin, ymax, xmax] with coordinates normalized to
0-1000 relative to the full image. The box must tightly enclose that single card and no
other. Return the cards in reading order: left to right, top to bottom.

ONLY THE FRONTS ARE VISIBLE:
There is no back image in this scan, so you cannot confirm the copyright year from the
back, and you cannot read serial numbering that is stamped on the back.
- Only fill 'card_number' if the number is actually printed on the FRONT of that card.
  Otherwise return an empty string. Do not infer or invent it.
- Only fill 'parallel_attributes.serial_num' if the serial is visibly stamped on the
  FRONT. Otherwise return an empty string.
- 'year' should come from the front design/copyright if visible; if you cannot see it,
  use your knowledge of that specific card release only when you are confident, and
  otherwise return 0.

${HALL_OF_FAME_INSTRUCTIONS}

Do not return entries for anything that is not a sports card (table surface, sleeves,
dividers, hands). If the image contains no cards, return an empty array.

Return your findings strictly in the requested JSON structure. Do not guess. If a value is
unknown, return an empty string or standard defaults.
`.trim();

    const result = await callGemini({
      contents: [
        {
          parts: [
            { text: promptText },
            { inlineData: { mimeType: "image/jpeg", data: encodeBase64(lotFile) } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ...CARD_FIELD_SCHEMA,
                  box_2d: {
                    type: "array",
                    description:
                      "Bounding box of this single card as [ymin, xmin, ymax, xmax], normalized 0-1000 relative to the full image.",
                    items: { type: "integer" },
                  },
                },
                required: [...CARD_FIELD_REQUIRED, "box_2d"],
              },
            },
          },
          required: ["cards"],
        },
      },
    });

    // Drop anything whose box is unusable rather than letting the client crop garbage.
    const cards = (result.cards ?? []).filter((card: any) => isUsableBox(card?.box_2d));

    return jsonResponse({ success: true, data: { cards } });
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 400);
  }
});

function isUsableBox(box: unknown): boolean {
  if (!Array.isArray(box) || box.length !== 4) return false;
  if (!box.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000)) return false;

  const [ymin, xmin, ymax, xmax] = box;
  return ymax > ymin && xmax > xmin;
}
