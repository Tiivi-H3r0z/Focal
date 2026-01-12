-- Add archive fields to dossiers table
ALTER TABLE dossiers
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for archived field for faster queries
CREATE INDEX idx_dossiers_archived ON dossiers(archived);

-- Add comment explaining the archive feature
COMMENT ON COLUMN dossiers.archived IS 'Indicates if the dossier has been archived. When archived, only client-selected photos are kept.';
COMMENT ON COLUMN dossiers.archived_at IS 'Timestamp when the dossier was archived. NULL if not archived or if it was unarchived.';

-- Update dossier_stats view to include archived fields
DROP VIEW IF EXISTS dossier_stats;

CREATE VIEW dossier_stats AS
SELECT
  d.id,
  d.client_name,
  d.status,
  d.photo_limit,
  d.photo_limit_tolerance,
  d.archived,
  d.archived_at,
  COUNT(DISTINCT p.id) AS total_photos,
  COUNT(DISTINCT s.id) AS selected_photos,
  d.photo_limit + d.photo_limit_tolerance AS max_allowed,
  d.photo_limit - d.photo_limit_tolerance AS min_allowed
FROM dossiers d
LEFT JOIN photos p ON d.id = p.dossier_id
LEFT JOIN selections s ON d.id = s.dossier_id
GROUP BY d.id;
