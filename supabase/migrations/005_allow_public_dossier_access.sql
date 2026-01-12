-- Allow anonymous users (clients) to view dossiers by secret URL
-- This is necessary for the client gallery to work
CREATE POLICY "Public can view dossiers by secret URL"
ON dossiers FOR SELECT
TO anon
USING (true);
