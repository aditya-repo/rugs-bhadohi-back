# Rug Casa Admin Backend

Production-ready ecommerce admin backend for the Rug Casa platform. Single-admin JWT authentication, PostgreSQL + Prisma, local image storage, and REST APIs under `/api/v1`.

## Tech Stack

- Node.js + Express.js + TypeScript
- PostgreSQL + Prisma ORM
- JWT + Bcrypt authentication
- Multer + Cloudinary (cloud image uploads)
- Zod validation, Swagger, Helmet, Morgan, Winston, PM2

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- PM2 (production)

## Installation

```bash
cd backend
cp .env.example .env
npm install
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon: include `?sslmode=require&schema=public`) |
| `JWT_ACCESS_SECRET` | Min 32 chars |
| `JWT_REFRESH_SECRET` | Min 32 chars |
| `APP_URL` | Backend URL (e.g. `http://localhost:4000`) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `ADMIN_EMAIL` | Default admin email for seed |
| `ADMIN_PASSWORD` | Default admin password for seed |

See `.env.example` for all variables.

## Database (Neon PostgreSQL)

For [Neon](https://neon.tech) cloud Postgres, use the connection string from the Neon dashboard:

```
postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&schema=public
```

`sslmode=require` is required for Neon. Keep credentials in `.env` only (never commit them).

## Prisma Migration

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Development

```bash
npm run dev
```

API: `http://localhost:4000/api/v1`  
Swagger: `http://localhost:4000/api/docs`  
Health: `http://localhost:4000/health`

## Build & Production

```bash
npm run build
npm start
```

### PM2 Setup

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## API Overview

| Module | Base Path |
|--------|-----------|
| Auth | `/api/v1/auth` |
| Dashboard | `/api/v1/dashboard` |
| Categories | `/api/v1/categories` |
| Products | `/api/v1/products` |
| Orders | `/api/v1/orders` |
| Customers | `/api/v1/customers` |
| Reviews | `/api/v1/reviews` |
| Returns | `/api/v1/returns` |
| Banners | `/api/v1/banners` |
| Settings | `/api/v1/settings` |
| Search | `/api/v1/search` |
| Media | `/api/v1/media/:folder` |
| SEO | `/api/v1/seo` |

### Auth Endpoints

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/profile`
- `PUT /auth/profile`
- `PUT /auth/change-password`

## Image Storage

Images are uploaded to **Cloudinary** (not local disk).

Set these in `.env`:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=rug-casa
```

Uploads go under Cloudinary folders like `rug-casa/products`, `rug-casa/banners`, etc. Full HTTPS URLs are stored in the database. Invoice HTML files are stored under `storage/invoices/` on disk.

Media endpoint: `POST /api/v1/media/:folder` where folder is one of `products | categories | banners | collections | reviews | seo`.

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.rugcasa.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.rugcasa.com
```

## Ubuntu VPS Deployment

1. Install Node.js 20, PostgreSQL, Nginx, PM2
2. Clone repo to `/var/www/rug-casa`
3. Configure `.env` with production values
4. Run migrations and seed
5. Build and start with PM2
6. Configure Nginx reverse proxy
7. Enable SSL with Certbot

```bash
sudo apt update
sudo apt install -y nodejs postgresql nginx
sudo npm install -g pm2
cd /var/www/rug-casa/backend
npm ci
npm run prisma:migrate:prod
npm run prisma:seed
npm run build
pm2 start ecosystem.config.js
```

## Backup Guide

### Database

```bash
pg_dump -U postgres rug_casa_admin > backup_$(date +%Y%m%d).sql
```

Restore:

```bash
psql -U postgres rug_casa_admin < backup_20260101.sql
```

### Storage backups

Invoice HTML files live under `storage/invoices/`. Media assets are on Cloudinary.

Schedule daily cron:

```bash
0 2 * * * pg_dump -U postgres rug_casa_admin > /backups/db_$(date +\%Y\%m\%d).sql
```

## Production Checklist

- [ ] Change JWT secrets and admin password
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL with strong credentials
- [ ] Enable Nginx + SSL
- [ ] Configure PM2 auto-restart and log rotation
- [ ] Set up database backups
- [ ] Configure SMTP for password reset emails
- [ ] Restrict PostgreSQL to localhost
- [ ] Set file permissions on `storage/` and `logs/`
- [ ] Configure firewall (UFW: 22, 80, 443 only)
- [ ] Configure Cloudinary credentials

## Default Admin (after seed)

- Email: `admin@rugcasa.com`
- Password: `Admin@123456`

Change immediately in production.
