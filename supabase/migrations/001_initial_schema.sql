-- DOSSIERS TABLE
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client Information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  client_address TEXT,

  -- Settings
  photo_limit INTEGER NOT NULL DEFAULT 25,
  photo_limit_tolerance INTEGER NOT NULL DEFAULT 5, -- ±5

  -- Access
  secret_url VARCHAR(255) UNIQUE NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, submitted, locked
  contacted_client BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'submitted', 'locked'))
);

CREATE INDEX idx_dossiers_photographer ON dossiers(photographer_id);
CREATE INDEX idx_dossiers_secret_url ON dossiers(secret_url);
CREATE INDEX idx_dossiers_status ON dossiers(status);

-- PHOTOS TABLE
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- File Information
  original_filename VARCHAR(500) NOT NULL, -- CRITICAL: Must preserve for Lightroom
  storage_path VARCHAR(1000) NOT NULL,     -- Supabase storage path
  file_size INTEGER,                       -- bytes

  -- Display
  display_order INTEGER,                   -- For sorting

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(dossier_id, original_filename)
);

CREATE INDEX idx_photos_dossier ON photos(dossier_id);
CREATE INDEX idx_photos_order ON photos(dossier_id, display_order);

-- SELECTIONS TABLE
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,

  -- Client Input
  comment TEXT,

  -- Timestamps
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(dossier_id, photo_id)
);

CREATE INDEX idx_selections_dossier ON selections(dossier_id);
CREATE INDEX idx_selections_photo ON selections(photo_id);

-- FUNCTIONS FOR AUTOMATIC TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selections_updated_at
  BEFORE UPDATE ON selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- VIEW FOR DOSSIER STATISTICS
CREATE VIEW dossier_stats AS
SELECT
  d.id,
  d.client_name,
  d.status,
  d.photo_limit,
  d.photo_limit_tolerance,
  COUNT(DISTINCT p.id) AS total_photos,
  COUNT(DISTINCT s.id) AS selected_photos,
  d.photo_limit + d.photo_limit_tolerance AS max_allowed,
  d.photo_limit - d.photo_limit_tolerance AS min_allowed
FROM dossiers d
LEFT JOIN photos p ON d.id = p.dossier_id
LEFT JOIN selections s ON d.id = s.dossier_id
GROUP BY d.id;
