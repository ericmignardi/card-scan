import { AICardResult, AILotCard } from "@/types/card";
import { supabase } from "@/utils/supabase";

export async function identifyCard(frontPath: string, backPath: string): Promise<AICardResult> {
  const { data, error } = await supabase.functions.invoke("identify-card", {
    body: { frontPath, backPath },
  });

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || "AI could not identify the card.");
  }

  return data.data as AICardResult;
}

// Identifies every card in one photo of a group of cards laid out together. Returns them
// in reading order, each with the bounding box needed to crop it out of that photo.
export async function identifyLot(lotPath: string): Promise<AILotCard[]> {
  const { data, error } = await supabase.functions.invoke("identify-lot", {
    body: { lotPath },
  });

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || "AI could not identify any cards in the photo.");
  }

  return (data.data?.cards ?? []) as AILotCard[];
}
