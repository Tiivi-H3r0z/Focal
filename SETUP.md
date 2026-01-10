# Focal Setup Guide

Complete setup instructions for your Focal photographer-client portal.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- A Vercel account for deployment (optional, free tier available)

## Step 1: Clone and Install

```bash
cd Focal
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose an organization (or create one)
4. Set your project name (e.g., "focal-production")
5. Set a strong database password (save this!)
6. Choose a region close to your users
7. Click "Create new project"

### 2.2 Run Database Migrations

Once your project is created:

1. Go to the SQL Editor in your Supabase dashboard
2. Run each migration file in order:

**Migration 1: Initial Schema**
- Open `supabase/migrations/001_initial_schema.sql`
- Copy the entire contents
- Paste into Supabase SQL Editor
- Click "Run"

**Migration 2: Storage Policies**
- Open `supabase/migrations/002_storage_policies.sql`
- Copy the entire contents
- Paste into Supabase SQL Editor
- Click "Run"

**Migration 3: RLS Policies**
- Open `supabase/migrations/003_rls_policies.sql`
- Copy the entire contents
- Paste into Supabase SQL Editor
- Click "Run"

### 2.3 Get Your API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string)

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Create Your Photographer Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter your email and password
4. Click "Create user"
5. (Optional) Verify the email in the email tab if you want to enable email features later

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Focal landing page!

## Step 6: Test the Application

### 6.1 Login as Photographer
1. Click "Photographer Login"
2. Use the email/password you created in Step 4
3. You should see the empty dashboard

### 6.2 Create a Test Dossier
1. Click "New Dossier"
2. Fill in client details:
   - Client Name: "Test Client"
   - Photo Limit: 25
   - Tolerance: 5
3. Click "Create Dossier"

### 6.3 Upload Photos
1. Click "Upload Photos"
2. Either:
   - Drag and drop image files
   - Click to select files
   - Upload a ZIP file
3. Wait for upload to complete

### 6.4 Test Client Gallery
1. Copy the "Client Gallery URL" from the dossier page
2. Open it in a private/incognito window (or different browser)
3. You should see the photo gallery
4. Select some photos, add comments
5. Click "Submit Selection"

### 6.5 View Selection as Photographer
1. Go back to the photographer dashboard
2. Click on the dossier
3. Scroll down to see the selected photos and comma-separated list
4. Click "Copy" to copy the Lightroom export list

## Step 7: Deploy to Production (Optional)

### Option A: Deploy to Vercel (Recommended)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Deploy"
7. Your app will be live at `your-project.vercel.app`!

### Option B: Deploy to Other Platforms

Focal is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
- Self-hosted on VPS

## Customization

### Change Branding Colors

Edit `tailwind.config.js` to customize the brand colors:

```js
colors: {
  brand: {
    // Customize these colors
    600: '#426085',  // Primary button color
    700: '#364e6c',  // Primary button hover
    // ... etc
  },
}
```

### Modify Photo Limits

Default limits are set when creating a dossier. You can:
- Change defaults in `src/app/admin/dossiers/new/page.tsx`
- Edit individual dossier limits in the database

### Email Notifications (Future Enhancement)

To add email notifications:
1. Enable email in Supabase Auth settings
2. Configure email templates
3. Add email sending logic when dossier status changes

## Troubleshooting

### "Not authenticated" error
- Make sure you created a user in Supabase Auth
- Check that your environment variables are correct
- Try logging out and back in

### Photos not showing
- Check Supabase Storage → photos bucket exists
- Verify storage policies are set correctly
- Check browser console for CORS errors

### "Row Level Security" errors
- Make sure you ran all three migration files
- Verify RLS policies in Supabase Dashboard → Database → Policies

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check that you're using Node.js 18+

## Support

For issues or questions:
1. Check the main README.md
2. Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
3. Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Cost Estimates

### Free Tier (Getting Started)
- Supabase: Free (500MB database, 1GB storage, 2GB bandwidth)
- Vercel: Free (Hobby tier)
- **Total: $0/month**

### Low Volume (~50 dossiers/month)
- Supabase: Free tier sufficient
- Vercel: Free tier sufficient
- **Total: $0-5/month**

### Medium Volume (~200 dossiers/month)
- Supabase: May need Pro plan ($25/month)
- Vercel: Free tier likely sufficient
- **Total: $25/month**

### Scaling Considerations
- Storage costs: ~$0.021/GB/month
- Bandwidth: Free up to 1TB/month on Supabase
- Database: Free up to 500MB
