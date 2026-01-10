export type DossierStatus = 'draft' | 'active' | 'submitted' | 'locked'

export interface Dossier {
  id: string
  photographer_id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  photo_limit: number
  photo_limit_tolerance: number
  secret_url: string
  status: DossierStatus
  contacted_client: boolean
  created_at: string
  updated_at: string
  submitted_at: string | null
  locked_at: string | null
}

export interface Photo {
  id: string
  dossier_id: string
  original_filename: string
  storage_path: string
  file_size: number | null
  display_order: number | null
  uploaded_at: string
}

export interface Selection {
  id: string
  dossier_id: string
  photo_id: string
  comment: string | null
  selected_at: string
  updated_at: string
}

export interface DossierStats {
  id: string
  client_name: string
  status: DossierStatus
  photo_limit: number
  photo_limit_tolerance: number
  total_photos: number
  selected_photos: number
  max_allowed: number
  min_allowed: number
}

export interface PhotoWithSelection extends Photo {
  selection?: Selection
}

export interface DossierWithStats extends Dossier {
  total_photos: number
  selected_photos: number
}
