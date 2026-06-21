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

## Gelistirme

1. Bagimliliklari kurun:

```bash
npm install
```

2. Ortam degiskenlerini ayarlayin:

```bash
copy .env.example .env
```

3. Veritabani semasini olusturun ve demo veriyi basin:

```bash
npm run db:migrate
npm run db:seed
```

4. API ve Next uygulamasini ayri terminallerde baslatin:

```bash
npm run dev:api
npm run dev
```

## Ortam Degiskenleri

- `DATABASE_URL`: PostgreSQL baglanti adresi
- `JWT_SECRET`: auth token imzalama anahtari
- `PORT`: Hono API portu
- `APP_ORIGIN`: API icin izinli frontend origin'i
- `API_PROXY_TARGET`: Next proxy'nin yonlendirecegi API adresi

## Kalite Kontrolleri

```bash
npm run lint
npm run build
npm run build:api
```

## Notlar

- Frontend istekleri `/api` uzerinden Next proxy ile backend'e gider.
- Auth cookie tabanli calisir ve demo ile cekirdek urun ayni kod tabanini kullanir.
- `server/dist` build ciktilari gelistirme konforu icin olusur, kaynak kod `server/` altindadir.
