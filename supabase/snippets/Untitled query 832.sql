-- 1. Create the card-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'card-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy: Allow authenticated users to view all card images
CREATE POLICY "Allow authenticated reads" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'card-images'
);

-- 4. Policy: Allow users to delete their own card images
CREATE POLICY "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'card-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);