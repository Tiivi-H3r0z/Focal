-- Migration 005: Remove tolerance, add visibility toggle and notification email
-- This migration:
-- 1. Removes the photo_limit_tolerance column (no longer needed)
-- 2. Adds 'visible' boolean to control client access (replaces activate/deactivate)
-- 3. Adds 'notification_email' for sending selection notifications

-- Step 1: Add new columns
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);

-- Step 2: Migrate existing data - set visible=true for active/submitted/locked dossiers
UPDATE dossiers
SET visible = true
WHERE status IN ('active', 'submitted', 'locked');

-- Step 3: Remove the tolerance column
ALTER TABLE dossiers
DROP COLUMN IF EXISTS photo_limit_tolerance;

-- Step 4: Update the dossier_stats view to remove tolerance-related fields
DROP VIEW IF EXISTS dossier_stats;

CREATE VIEW dossier_stats AS
SELECT
  d.id,
  d.photographer_id,
  d.client_name,
  d.client_email,
  d.client_phone,
  d.client_address,
  d.photo_limit,
  d.secret_url,
  d.status,
  d.contacted_client,
  d.created_at,
  d.updated_at,
  d.submitted_at,
  d.locked_at,
  d.archived,
  d.archived_at,
  d.visible,
  d.notification_email,
  COUNT(DISTINCT p.id) AS total_photos,
  COUNT(DISTINCT s.id) AS selected_photos
FROM dossiers d
LEFT JOIN photos p ON p.dossier_id = d.id
LEFT JOIN selections s ON s.dossier_id = d.id
GROUP BY d.id;

-- Step 5: Add index for visible column (frequently queried)
CREATE INDEX IF NOT EXISTS idx_dossiers_visible ON dossiers(visible);

-- Step 6: Update RLS policies to include visible check for client gallery access
-- (Clients should only see visible dossiers)
