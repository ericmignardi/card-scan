import { supabase } from "@/utils/supabase";

const BUCKET = "card-images";

export async function uploadCardImage(userId: string, uri: string, side: "front" | "back"): Promise<string> {
  const path = `${userId}/${Date.now()}_${side}.jpg`;

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `${side}.jpg`,
    type: "image/jpeg",
  } as unknown as Blob);

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, formData, {
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
