import { AICardResult } from "@/types/card";
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
