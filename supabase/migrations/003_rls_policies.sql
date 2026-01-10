-- Enable RLS
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

-- DOSSIERS POLICIES
-- Photographers can view their own dossiers
CREATE POLICY "Photographers can view own dossiers"
ON dossiers FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());

-- Photographers can create dossiers
CREATE POLICY "Photographers can create dossiers"
ON dossiers FOR INSERT
TO authenticated
WITH CHECK (photographer_id = auth.uid());

-- Photographers can update their own dossiers
CREATE POLICY "Photographers can update own dossiers"
ON dossiers FOR UPDATE
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());

-- Photographers can delete their own dossiers
CREATE POLICY "Photographers can delete own dossiers"
ON dossiers FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());

-- PHOTOS POLICIES
-- Photographers can view photos in their dossiers
CREATE POLICY "Photographers can view own photos"
ON photos FOR SELECT
TO authenticated
USING (
  dossier_id IN (
    SELECT id FROM dossiers WHERE photographer_id = auth.uid()
  )
);

-- Public (clients) can view photos
CREATE POLICY "Public can view photos"
ON photos FOR SELECT
TO anon
USING (true);

-- Photographers can insert photos
CREATE POLICY "Photographers can insert photos"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  dossier_id IN (
    SELECT id FROM dossiers WHERE photographer_id = auth.uid()
  )
);

-- Photographers can delete photos
CREATE POLICY "Photographers can delete photos"
ON photos FOR DELETE
TO authenticated
USING (
  dossier_id IN (
    SELECT id FROM dossiers WHERE photographer_id = auth.uid()
  )
);

-- SELECTIONS POLICIES
-- Photographers can view selections in their dossiers
CREATE POLICY "Photographers can view selections"
ON selections FOR SELECT
TO authenticated
USING (
  dossier_id IN (
    SELECT id FROM dossiers WHERE photographer_id = auth.uid()
  )
);

-- Public (clients) can view selections
CREATE POLICY "Public can view selections"
ON selections FOR SELECT
TO anon
USING (true);

-- Public (clients) can create selections
CREATE POLICY "Public can create selections"
ON selections FOR INSERT
TO anon
WITH CHECK (true);

-- Public (clients) can update selections
CREATE POLICY "Public can update selections"
ON selections FOR UPDATE
TO anon
USING (true);

-- Public (clients) can delete selections
CREATE POLICY "Public can delete selections"
ON selections FOR DELETE
TO anon
USING (true);
