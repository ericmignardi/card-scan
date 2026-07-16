import { supabase } from "@/utils/supabase";

const BUCKET = "card-images";

// `label` only distinguishes files within a user's folder (e.g. "front", "back",
// "lot", "lot_3"); it carries no meaning beyond making paths readable.
export async function uploadCardImage(userId: string, uri: string, label: string): Promise<string> {
  const path = `${userId}/${Date.now()}_${label}.jpg`;

  // Supabase's React Native guidance uploads raw bytes via arraybuffer rather than
  // FormData, which has known issues with file uploads on RN's fetch polyfill.
  const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, arraybuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) throw error;
  return data.path;
}

export function getCardImagePublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeCardImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.warn("Failed to remove card images:", error.message);
}

// Public URLs look like ".../storage/v1/object/public/card-images/<user_id>/<file>.jpg"
export function getStoragePathFromUrl(url: string): string | null {
  const separator = `/${BUCKET}/`;
  const index = url.indexOf(separator);
  return index === -1 ? null : url.slice(index + separator.length);
}
