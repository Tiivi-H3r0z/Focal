# Focal - Photographer Client Portal

Professional photo selection platform for photographers and their clients.

## Features

- **Photographer Backend**: Create client dossiers, upload photos, manage selections
- **Client Gallery**: Beautiful gallery for clients to select photos and add comments
- **Lightroom Export**: Generate comma-separated lists for Adobe Lightroom
- **Status Management**: Track dossier progress (Draft → Active → Submitted → Locked)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Run the database migrations in the Supabase SQL Editor:
   - Execute `supabase/migrations/001_initial_schema.sql`
   - Execute `supabase/migrations/002_storage_policies.sql`
   - Execute `supabase/migrations/003_rls_policies.sql`

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Create Photographer Account

In Supabase Dashboard → Authentication → Users, click "Add user" and create an account with your email/password.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy!

## Usage

### For Photographers

1. Login at `/login`
2. Create a new client dossier
3. Upload photos (bulk or zip)
4. Share the secret URL with your client
5. View client selections and export comma-separated list
6. Lock dossier when complete

### For Clients

1. Visit the secret URL provided by photographer
2. Browse photos in the gallery
3. Select photos (checkbox)
4. Add comments if needed
5. Validate selection when done

## License

MIT
