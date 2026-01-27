# ZEN Services - Digital Agency Website

Next.js 14 App Router site with services, projects, blog, and contact flows. Includes admin tools for AI blog generation, Prisma/Postgres data, and cinematic UI.

## Stack
- Frontend: Next.js, React 18, TypeScript, Tailwind CSS
- UI: shadcn/ui, Framer Motion, GSAP
- Backend: Next.js API routes
- Data: Prisma + Postgres (Supabase compatible)
- Email: Nodemailer (SMTP)
- AI: OpenAI (optional)

## Key Features
- Cinematic home experience + responsive sections
- Services, projects, blog, contact pages
- Contact + appointment API flows
- Admin blog generator (token protected)
- Basic PWA support (manifest + service worker)

## Local Setup
```bash
npm install
cp .env.local.example .env.local
npx prisma generate
npm run dev
```

## Required Environment Variables
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@example.com"

ADMIN_TOKEN="your-admin-token"
```

## Optional Environment Variables
```env
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

OPENAI_API_KEY="sk-your-openai-key"
AI_MODEL="gpt-4o-mini"
AI_AUTOPUBLISH="false"
AI_IMAGE_ENABLED="false"
AI_RATE_LIMIT_DISABLED="false"

BLOG_IMAGE_PROVIDER="local"
NEXT_PUBLIC_BLOG_IMAGE_PROVIDER="local"
FORM_RATE_LIMIT_DISABLED="false"
```

## Admin Access
Open `/admin/login` and paste `ADMIN_TOKEN` to use the blog generator.

## Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - Lint

## Deployment
See `DEPLOYMENT.md` for production steps.
