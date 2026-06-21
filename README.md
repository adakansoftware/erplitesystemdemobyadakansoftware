# Adakan ERP Lite

Adakan ERP Lite, CRM + ERP + finans modullerini tek panelde birlestiren Next.js ve Hono tabanli bir uygulamadir. Bu repo demo gorunumunden cikmis, canli API ve PostgreSQL uzerinden calisan cekirdek urun iskeletini icerir.

## Teknoloji

- Next.js 16 + React 19
- Hono API
- Drizzle ORM
- PostgreSQL / Neon
- TypeScript

## Moduller

- CRM: leads, musteriler, firmalar, anlasmalar, gorevler
- ERP: urunler, stok, teklifler, faturalar, satin alma
- Finans: kasa-banka, cari hesaplar, raporlar, ayarlar

## Kurulum

### 1. Bagimliliklari Yukle

```bash
pnpm install
```

Alternatif olarak:

```bash
npm install
```

### 2. Ortam Degiskenleri

```bash
copy .env.example .env
```

`.env` icinde en az su alanlari doldurun:

- `DATABASE_URL`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

`DATABASE_URL` format ornegi:

```bash
postgresql://user:pass@host:5432/erplite
```

### 3. Veritabani

```bash
pnpm drizzle-kit migrate
pnpm tsx --env-file=.env server/db/seed.ts
```

Repo scriptleriyle ayni islemler:

```bash
npm run db:migrate
npm run db:seed
```

### 4. Gelistirme

Iki terminal kullanin:

```bash
pnpm dev
```

```bash
pnpm tsx --env-file=.env watch server/index.ts
```

Repo scriptleriyle:

```bash
npm run dev
npm run dev:api:watch
```

### Demo Hesaplar

- `admin@demo.com / demo123`
- `satis@demo.com / demo123`

## Ortam Degiskenleri

- `DATABASE_URL`: PostgreSQL baglanti adresi
- `JWT_SECRET`: auth token imzalama anahtari
- `PORT`: Hono API portu
- `APP_ORIGIN`: API icin izinli frontend origin'i
- `API_PROXY_TARGET`: Next proxy'nin yonlendirecegi API adresi
- `SMTP_*`: bildirim e-postalari icin SMTP ayarlari

## Kalite Kontrolleri

```bash
npm run lint
npm run build
npm run build:api
```

## Notlar

- Frontend istekleri `/api` uzerinden Next proxy ile backend'e gider.
- Auth cookie tabanli calisir ve demo ile cekirdek urun ayni kod tabanini kullanir.
- `server/dist` build ciktilari artik git'te tutulmaz; kaynak kod `server/` altindadir.
