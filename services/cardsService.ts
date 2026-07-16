import { CardDetails, CardFields, CardSummary, NewCardInput } from "@/types/card";
import { supabase } from "@/utils/supabase";
import { getStoragePathFromUrl, removeCardImages } from "./storageService";

const SUMMARY_COLUMNS =
  "id, player_name, brand, year, sport, front_image_url, is_rookie, is_hall_of_famer, is_autographed";

export async function listCards(userId: string): Promise<CardSummary[]> {
  const { data, error } = await supabase
    .from("cards")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCard(id: string): Promise<CardDetails> {
  const { data, error } = await supabase.from("cards").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function insertCard(card: NewCardInput): Promise<void> {
  const { error } = await supabase.from("cards").insert(card);
  if (error) throw error;
}

// Images and ownership are fixed once a card is scanned, so only the editable fields are
// written back. RLS restricts the update to the caller's own rows.
export async function updateCard(id: string, fields: CardFields): Promise<void> {
  const { error } = await supabase.from("cards").update(fields).eq("id", id);
  if (error) throw error;
}

// Deletes the DB row and cleans up the associated front/back images from Storage.
export async function deleteCard(card: CardDetails): Promise<void> {
  const paths = [getStoragePathFromUrl(card.front_image_url), getStoragePathFromUrl(card.back_image_url)].filter(
    (path): path is string => !!path
  );
  await removeCardImages(paths);

  const { error } = await supabase.from("cards").delete().eq("id", card.id);
  if (error) throw error;
}
