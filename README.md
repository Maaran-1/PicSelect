# PicSelect

Photo gallery selection tool for photographers. Share a Google Drive folder with clients, let them pick their favourite shots, and export the selections as CSV.

## Project Structure

```
picselect/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Photographer login
│   │   ├── (auth)/register/      # Photographer registration
│   │   ├── (dashboard)/          # Photographer dashboard
│   │   │   ├── dashboard/        # Event list
│   │   │   └── events/[id]/      # Event detail + selections
│   │   ├── api/                  # API routes
│   │   └── gallery/[token]/      # Public client gallery
│   ├── components/
│   └── lib/
│       ├── auth.ts               # NextAuth config
│       ├── drive.ts              # Google Drive API
│       └── prisma.ts             # Prisma client singleton
├── .env.production.example
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.production.example .env.local

# 3. Push schema to database
npm run db:push

# 4. Start dev server
npm run dev
```

## Deploy to Vercel

### 1. Create a Postgres database

Use [Supabase](https://supabase.com), [Neon](https://neon.tech), or any Postgres provider.  
Copy the **connection pooling URL** (important for serverless).

### 2. Configure Google OAuth

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Enable the **Google Drive API** for the same project

### 3. Set environment variables in Vercel

| Variable | Value |
|---|---|
| `DATABASE_URL` | Postgres connection pooling URL |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `GOOGLE_API_KEY` | (Optional) For public folder fallback |

### 4. Deploy

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deployments.

### 5. Run database migrations

After first deploy, run:

```bash
DATABASE_URL="your-production-url" npx prisma db push
```

## How It Works

1. **Photographer** registers/logs in, creates an event with a Google Drive folder link
2. Photographer clicks **Sync Photos** to import photo metadata from Drive
3. Photographer copies the **share link** and sends it to the client
4. **Client** opens the gallery, browses photos, selects their favourites, and submits
5. Photographer views selections in the dashboard and exports as CSV
