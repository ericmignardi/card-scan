-- 1. Create the storage bucket used for scanned card images.
-- Public so the client can render images via getPublicUrl(); writes/deletes are still
-- restricted to the owning user via the RLS policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('card-images', 'card-images', true, 10485760, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for storage.objects, scoped to the "<user_id>/..." path convention
--    used by the app when uploading front/back card photos.
CREATE POLICY "Public read access for card images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'card-images');

CREATE POLICY "Users can upload card images to their own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'card-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own card images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'card-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Tighten profiles read policy: the original migration allowed any authenticated
--    user to read every profile row. Scope it to the owning user, matching the cards policies.
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 4. Explicit grants for API roles (Supabase applies sensible defaults, but keep this
--    explicit so the migration is a complete, self-contained description of access).
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.cards TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT SELECT ON public.profiles TO anon;
