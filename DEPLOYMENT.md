# Deployment Guide - ZEN Services

## 1. Database (Supabase)
1. Create a Supabase project
2. Copy the connection string into `DATABASE_URL`
3. (Optional) set `DIRECT_URL`

Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

## 2. Environment Variables
Set these in your hosting provider (Vercel recommended):
```env
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@example.com

ADMIN_TOKEN=your-admin-token
```

Optional:
```env
OPENAI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-4o-mini
BLOG_IMAGE_PROVIDER=local
NEXT_PUBLIC_BLOG_IMAGE_PROVIDER=local
```

## 3. Deploy to Vercel
1. Push to GitHub
2. Import the repo in Vercel
3. Add env vars for Production, Preview, and Development
4. Deploy

## 4. Post-deploy checks
- Home, services, projects, blog pages load
- Contact form sends email
- Appointment form sends email
- Admin blog generator works with `ADMIN_TOKEN`
- `sitemap.xml` and `robots.txt` load

## 5. Monitoring (optional)
- Enable Vercel Analytics
- Add error tracking (Sentry)
- Monitor uptime (UptimeRobot)
