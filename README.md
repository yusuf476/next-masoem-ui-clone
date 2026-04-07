# Masoem Market Web

Full-stack web application berbasis Next.js untuk kebutuhan marketplace kampus.

## Fitur utama

- Landing page produk
- Katalog dan detail produk
- Register, login, logout, dan session cookie
- Keranjang belanja aktif
- Checkout aktif dengan Midtrans Snap
- Dashboard pesanan pengguna
- Panel admin di `/admin`
- Backend API dengan mode ganda: fallback lokal berbasis file JSON atau Supabase PostgreSQL

## Menjalankan project

```bash
npm install
npm run dev
```

Project berjalan di `http://localhost:3000`.

## Setup Supabase

1. Buat project Supabase baru.
2. Jalankan SQL schema dari [`supabase/schema.sql`](/C:/next-masoem-ui-clone/supabase/schema.sql) di SQL Editor Supabase.
3. Salin [`.env.example`](/C:/next-masoem-ui-clone/.env.example) menjadi `.env.local` lalu isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ADMIN_EMAILS=admin@masoem.ac.id
NEXT_PUBLIC_APP_URL=http://localhost:3000
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_IS_PRODUCTION=false
```

4. Jalankan ulang `npm run dev`.

Catatan:

- Saat env Supabase aktif, aplikasi otomatis membaca dan menulis ke Supabase melalui REST API server-side.
- Jika tabel `categories` dan `products` masih kosong, katalog awal akan otomatis di-seed dari [`data/store.json`](/C:/next-masoem-ui-clone/data/store.json).
- Jika belum ada admin yang ditentukan, akun pertama yang register akan otomatis mendapat role `admin`.
- Jika env Supabase belum diisi, aplikasi tetap jalan memakai penyimpanan lokal.

Jika Anda sudah pernah menjalankan versi schema sebelumnya, tambahkan kolom baru ini pada tabel `orders`:

```sql
alter table public.orders add column if not exists payment_token text;
alter table public.orders add column if not exists payment_url text;
alter table public.orders add column if not exists payment_payload jsonb;
alter table public.orders add column if not exists stock_applied boolean not null default false;
alter table public.orders add column if not exists paid_at timestamptz;
```

## Setup Midtrans

1. Buat akun Midtrans Sandbox lalu ambil `Server Key`.
2. Isi `MIDTRANS_SERVER_KEY` dan set `MIDTRANS_IS_PRODUCTION=false` untuk sandbox.
3. Set `NEXT_PUBLIC_APP_URL` ke origin aplikasi Anda.
4. Setelah deploy ke production, ubah:

```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
MIDTRANS_IS_PRODUCTION=true
```

5. Endpoint webhook aplikasi:

```text
https://your-domain/api/payments/midtrans/notification
```

6. Halaman return payment yang sudah disiapkan:

- `/payment/finish`
- `/payment/unfinish`
- `/payment/error`

Catatan:

- Aplikasi otomatis mengirim header `X-Override-Notification` ke Midtrans saat membuat transaksi, jadi webhook bisa langsung diarahkan ke deployment aktif.
- Status order berubah dari `pending` ke `paid/expired/failed` melalui webhook Midtrans atau sinkronisasi status saat user kembali dari halaman pembayaran.
- Jika Midtrans belum dikonfigurasi, checkout akan fallback ke mode bayar instan lokal agar development tetap jalan.

## Admin Panel

- Login dengan akun admin lalu buka `/admin`.
- Link `Admin` akan muncul otomatis di header untuk user dengan role admin.
- Panel admin menampilkan revenue, order terbaru, stok kritis, pelanggan terbaru, dan ringkasan pembayaran.
- Dashboard user juga akan menampilkan status payment dan tombol lanjutkan pembayaran untuk order yang masih pending.

## Integrasi Deploy

- Untuk deploy ke Vercel, tambahkan env yang sama seperti di `.env.local`.
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` hanya dipasang sebagai server-side secret.
- `NEXT_PUBLIC_APP_URL` harus diisi dengan URL deployment final agar callback dan webhook mengarah benar.
- Build tetap memakai fallback lokal saat env Supabase/Midtrans tidak tersedia, jadi staging lokal tetap aman untuk development.
