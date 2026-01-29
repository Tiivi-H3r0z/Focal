# CLAUDE.md - AI Assistant Guide for Focal

## Project Overview

Focal is a professional photographer-client portal for photo selection. Photographers create client "dossiers" (projects), upload photos, and share secret URLs with clients. Clients browse galleries, select photos within configured limits, add comments, and submit their selections. Photographers can then export selections for Adobe Lightroom.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage (for photos)
- **Styling**: Tailwind CSS with custom brand colors
- **Language**: TypeScript (strict mode)
- **Authentication**: Supabase Auth
- **State Management**: React hooks + SWR for data fetching
- **Deployment**: Vercel

## Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/login/             # Authentication pages (route group)
│   ├── admin/                    # Protected photographer dashboard
│   │   ├── dossiers/[id]/        # Dossier detail, upload, selections
│   │   └── page.tsx              # Dashboard listing all dossiers
│   ├── api/                      # API routes
│   │   └── dossiers/[id]/        # Archive, delete, unarchive endpoints
│   ├── gallery/[secretUrl]/      # Public client gallery (no auth required)
│   ├── debug/gallery/            # Debug version of gallery
│   └── layout.tsx                # Root layout with fonts
├── components/
│   ├── admin/                    # Photographer-facing components
│   │   ├── DossierCard.tsx       # Dashboard card for each dossier
│   │   ├── DossierActions.tsx    # Action buttons (lock, archive, etc.)
│   │   ├── PhotoUploader.tsx     # Upload images or ZIP files
│   │   ├── PhotoGallery.tsx      # Admin photo grid view
│   │   ├── SelectionViewer.tsx   # View client selections + export
│   │   └── CopyButton.tsx        # Copy to clipboard utility
│   └── gallery/                  # Client-facing gallery components
│       ├── ClientGallery.tsx     # Main client gallery wrapper
│       ├── PhotoGrid.tsx         # Masonry-style photo grid
│       ├── PhotoCard.tsx         # Individual photo with selection
│       ├── PhotoLightbox.tsx     # Full-screen photo viewer
│       ├── CommentModal.tsx      # Add comment to selection
│       ├── GalleryNavigation.tsx # Header with progress counter
│       ├── SelectionCounter.tsx  # Selection count display
│       └── Icons.tsx             # Shared SVG icons
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server-side Supabase client
│   ├── types/
│   │   └── database.types.ts     # TypeScript interfaces for DB tables
│   └── utils.ts                  # Helper functions (cn, formatDate, etc.)
└── middleware.ts                 # Auth middleware for protected routes

supabase/
└── migrations/                   # SQL migrations (run in order)
    ├── 001_initial_schema.sql    # Tables: dossiers, photos, selections
    ├── 002_storage_policies.sql  # Storage bucket + policies
    ├── 003_rls_policies.sql      # Row Level Security policies
    └── 004_add_archive_fields.sql # Archive feature migration
```

## Key Conventions

### TypeScript Types

All database types are defined in `src/lib/types/database.types.ts`:

```typescript
type DossierStatus = 'draft' | 'active' | 'submitted' | 'locked'

interface Dossier {
  id: string
  photographer_id: string
  client_name: string
  status: DossierStatus
  photo_limit: number
  photo_limit_tolerance: number
  secret_url: string
  archived: boolean
  // ... timestamps and optional fields
}

interface Photo {
  id: string
  dossier_id: string
  original_filename: string  // CRITICAL: Preserve for Lightroom export
  storage_path: string
  // ...
}

interface Selection {
  id: string
  dossier_id: string
  photo_id: string
  comment: string | null
  // ...
}
```

### Component Patterns

**Server Components** (default in App Router):
- Used for pages that fetch data at request time
- Import from `@/lib/supabase/server`
- Example: `src/app/admin/page.tsx`

**Client Components** (add `'use client'` directive):
- Used for interactive UI with hooks
- Import from `@/lib/supabase/client`
- Example: `src/components/gallery/ClientGallery.tsx`

### Supabase Client Usage

```typescript
// Server-side (in Server Components or API routes)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client-side (in 'use client' components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Styling Conventions

- Use Tailwind CSS utility classes
- Custom brand colors: `brand-50` through `brand-950` (warm stone palette)
- Accent colors: `accent-50` through `accent-900` (purple)
- Use `cn()` helper for conditional classes: `import { cn } from '@/lib/utils'`
- Fonts: `font-serif` for headings (Playfair Display), `font-sans` for body (Inter)
- Custom animations: `animate-fade-in`, `animate-slide-up`, `animate-zoom-in`

### Path Aliases

Use `@/` prefix for imports from `src/`:
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Dossier } from '@/lib/types/database.types'
```

## Database Schema

### Tables

1. **dossiers** - Client projects
   - Links to `auth.users` via `photographer_id`
   - Status workflow: draft → active → submitted → locked
   - `secret_url` provides client access (32-char random string)

2. **photos** - Uploaded images
   - Links to dossiers via `dossier_id`
   - `original_filename` must be preserved exactly (for Lightroom export)
   - `storage_path` points to Supabase Storage

3. **selections** - Client photo picks
   - Links photos to dossiers with optional comments
   - Unique constraint on (dossier_id, photo_id)

### Views

- **dossier_stats** - Aggregates photo counts and selection counts per dossier

### Row Level Security

- Authenticated users (photographers) can only access their own dossiers/photos
- Anonymous users (clients) can read photos and manage selections (via secret URL)
- Storage policies mirror database RLS

## Dossier Status Workflow

```
draft → active → submitted → locked → (archived)
  │        │          │          │
  │        │          │          └── Photographer locks, client can't modify
  │        │          └── Client submitted selection
  │        └── Ready for client access
  └── Initial creation, uploading photos
```

## API Routes

All API routes are in `src/app/api/`:

- `POST /api/dossiers/[id]/archive` - Archives locked dossier, deletes unselected photos
- `POST /api/dossiers/[id]/unarchive` - Reverts archive status (doesn't restore photos)
- `DELETE /api/dossiers/[id]/delete` - Permanently deletes dossier and all photos

API routes pattern:
```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... validate ownership, perform action
}
```

## Common Development Tasks

### Adding a New Database Field

1. Create migration in `supabase/migrations/00X_description.sql`
2. Update `dossier_stats` view if needed
3. Add field to TypeScript interface in `database.types.ts`
4. Update relevant components

### Creating a New Admin Page

1. Create file in `src/app/admin/[path]/page.tsx`
2. Page is automatically protected by middleware
3. Use server-side Supabase client for data fetching

### Creating a New Client Component

1. Add `'use client'` at top of file
2. Import browser Supabase client
3. Use React hooks for state management

### Working with Photos

- Upload: Use `PhotoUploader` component
- Storage path: `{dossier_id}/{sanitized_filename}`
- Always preserve `original_filename` for Lightroom export
- Delete from both storage AND database when removing

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint check
```

## Client Gallery Features

- Masonry-style photo grid (CSS columns)
- Photo selection with visual feedback
- Optional comments on selections
- Selection counter with min/max limits
- Filter to show only selected photos
- Lightbox for full-screen viewing
- French UI text for client-facing pages

## Important Notes

1. **Filename Preservation**: The `original_filename` field is critical for Lightroom export - never modify it
2. **Secret URLs**: 32-character random strings provide security-through-obscurity for client access
3. **Mobile Support**: Cookie settings use `sameSite: 'lax'` for mobile browser compatibility
4. **Archive Feature**: Archiving deletes unselected photos from storage to save space
5. **No Test Suite**: Project currently has no automated tests
6. **French Locale**: Client-facing gallery uses French text ("Sélection", "Envoyer", etc.)
