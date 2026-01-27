# Quick Start - ZEN Services

Get the project running locally in a few minutes.

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your credentials. At minimum:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zenservices"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@example.com"
ADMIN_TOKEN="your-admin-token"
```

## 3. Prepare database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 4. Run dev server
```bash
npm run dev
```
Open http://localhost:3000

## Verify
- Home page loads
- Blog page lists posts
- Contact form submits
- Appointment form submits

## Admin
Go to `/admin/login`, paste `ADMIN_TOKEN`, then use `/admin/blog` to generate content.

## Optional
- Add assets in `public/images` and `public/videos`
- Set `OPENAI_API_KEY` to enable AI generation
- Set `BLOG_IMAGE_PROVIDER` or `NEXT_PUBLIC_BLOG_IMAGE_PROVIDER` for covers
