-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
-- Photographers can upload to their own dossiers
CREATE POLICY "Photographers can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid() IN (
    SELECT photographer_id FROM dossiers
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Anyone with the URL can view photos (clients via secret URL)
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Photographers can delete their own photos
CREATE POLICY "Photographers can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.uid() IN (
    SELECT photographer_id FROM dossiers
    WHERE id::text = (storage.foldername(name))[1]
  )
);
