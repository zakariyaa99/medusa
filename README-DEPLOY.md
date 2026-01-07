# Deployment Guide untuk Medusa E-commerce ke Dokploy

## Struktur Proyek
```
.
├── medusa-backend/          # Backend Medusa (monorepo)
│   └── packages/medusa/     # Aplikasi Medusa utama
│       ├── medusa-config.js
│       ├── .env.template
│       ├── Dockerfile
│       └── docker-compose.yml (untuk development lokal)
├── medusa-frontend/         # Frontend Next.js
│   ├── .env.production
│   └── Dockerfile
└── README-DEPLOY.md         # Panduan ini
```

## Prasyarat
1. **Akun Dokploy** - Sudah terdaftar dan terkonfigurasi
2. **GitHub Repository** - Kode sudah di-push ke GitHub
3. **Supabase** - Database PostgreSQL (sudah ada URL)
4. **Upstash** - Redis (sudah ada URL)

## Environment Variables yang Diperlukan

### Backend Server (`medusa-backend/packages/medusa/.env` - untuk service HTTP)
```bash
# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Redis Configuration (Upstash)
REDIS_URL=redis://default:[PASSWORD]@[ENDPOINT]:6379

# JWT and Cookie Secrets
JWT_SECRET=your-jwt-secret-change-this
COOKIE_SECRET=your-cookie-secret-change-this

# CORS Configuration (sesuaikan dengan domain frontend)
STORE_CORS=https://your-frontend-domain.com
ADMIN_CORS=https://your-admin-domain.com
AUTH_CORS=https://your-backend-domain.com

# Worker Mode: "server" untuk service HTTP
MEDUSA_WORKER_MODE=server

# Port Configuration
PORT=9000
NODE_ENV=production
```

### Backend Worker (`medusa-backend/packages/medusa/.env` - untuk service worker)
```bash
# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Redis Configuration (Upstash)
REDIS_URL=redis://default:[PASSWORD]@[ENDPOINT]:6379

# JWT and Cookie Secrets
JWT_SECRET=your-jwt-secret-change-this
COOKIE_SECRET=your-cookie-secret-change-this

# Worker Mode: "worker" untuk background jobs
MEDUSA_WORKER_MODE=worker

# Port Configuration (tidak diperlukan untuk worker, tapi bisa di-set)
PORT=9001
NODE_ENV=production
```

### Frontend (`medusa-frontend/.env.production`)
```bash
# Medusa Backend URL
MEDUSA_BACKEND_URL=https://your-backend-domain.com

# Publishable API Key (dapatkan dari Medusa admin)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_...

# Storefront URL
NEXT_PUBLIC_BASE_URL=https://your-frontend-domain.com

# Default region
NEXT_PUBLIC_DEFAULT_REGION=id

# Next.js revalidation secret
REVALIDATE_SECRET=your-revalidate-secret-change-this

NODE_ENV=production
```

## Deployment ke Dokploy (Dengan Server & Worker Terpisah)

### Step 1: Persiapan GitHub Repository
1. Pastikan semua file konfigurasi sudah commit dan push ke GitHub:
   - `medusa-backend/packages/medusa/medusa-config.js`
   - `medusa-backend/packages/medusa/Dockerfile`
   - `medusa-backend/packages/medusa/docker-compose.yml`
   - `medusa-frontend/Dockerfile`
   - File konfigurasi lainnya

### Step 2: Setup Services di Dokploy

Karena kita memisahkan server dan worker, kita akan membuat **tiga services** di Dokploy:

#### Service 1: Backend Server (HTTP API)
- **Repository**: URL repository GitHub Anda
- **Build Context**: `medusa-backend`
- **Dockerfile**: `packages/medusa/Dockerfile`
- **Build Command**: (kosongkan, menggunakan Dockerfile)
- **Start Command**: `node dist/app.js`
- **Port**: 9000
- **Environment Variables**: Gunakan environment variables dari **Backend Server** di atas (termasuk `MEDUSA_WORKER_MODE=server`)

#### Service 2: Backend Worker (Background Jobs)
- **Repository**: URL repository GitHub yang sama
- **Build Context**: `medusa-backend`
- **Dockerfile**: `packages/medusa/Dockerfile`
- **Build Command**: (kosongkan, menggunakan Dockerfile)
- **Start Command**: `node dist/app.js`
- **Port**: Tidak perlu port publik (worker tidak menangani HTTP requests)
- **Environment Variables**: Gunakan environment variables dari **Backend Worker** di atas (termasuk `MEDUSA_WORKER_MODE=worker`)

#### Service 3: Frontend (Next.js)
- **Repository**: URL repository GitHub yang sama
- **Build Context**: `medusa-frontend`
- **Dockerfile**: `Dockerfile` (otomatis terdeteksi)
- **Build Command**: (kosongkan, menggunakan Dockerfile)
- **Start Command**: `yarn start`
- **Port**: 8000
- **Environment Variables**: Salin dari bagian Frontend di atas

### Step 3: Konfigurasi Database Migrations
Setelah backend server berjalan, jalankan migrations:
```bash
# Masuk ke container backend server
docker exec -it [container-name] sh

# Jalankan migrations
medusa migrations run
```

Atau tambahkan script startup di Dockerfile backend (opsional).

**Catatan**: Migrations hanya perlu dijalankan sekali, bisa di service manapun (server atau worker) karena menggunakan database yang sama.

### Step 4: Verifikasi
1. **Backend**: Akses `https://your-backend-domain.com/health` harus mengembalikan `OK`
2. **Frontend**: Akses `https://your-frontend-domain.com` harus menampilkan storefront
3. **Admin**: Akses `https://your-backend-domain.com/admin` untuk panel admin

## Konfigurasi Domain & SSL
1. Di Dokploy, tambahkan custom domain untuk setiap service
2. Konfigurasi SSL certificate otomatis
3. Update CORS settings di `medusa-config.js` dengan domain production

## Troubleshooting

### Backend tidak bisa connect ke database
- Periksa `DATABASE_URL` format Supabase
- Pastikan IP Dokploy di-whitelist di Supabase
- Test koneksi secara manual

### Frontend tidak bisa connect ke backend
- Periksa `MEDUSA_BACKEND_URL` di frontend
- Pastikan CORS settings di backend mencakup domain frontend
- Periksa logs di kedua services

### Build gagal
- Periksa resource memory/CPU di Dokploy
- Pastikan Dockerfile build context benar
- Check logs build untuk detail error

### Error ".yarn not found" saat build
- Dockerfile sudah diperbaiki untuk menghindari error ini
- Pastikan menggunakan versi terbaru dari repository
- Error ini terjadi karena struktur monorepo Medusa
- Solusi: Gunakan `--ignore-scripts` flag saat `yarn install`

### Error "yarn.lock not found" atau "Yarn version mismatch"
- **Penyebab**: Build context salah atau versi Yarn tidak cocok
- **Solusi 1**: Pastikan build context `medusa-backend/` (bukan `medusa-backend/packages/medusa/`)
- **Solusi 2**: Dockerfile sudah menggunakan Corepack untuk Yarn 3.2.1

## Perbaikan Docker Build (Update Terbaru)
Dockerfile telah diperbaiki untuk semua error build:

### **Backend Dockerfile** (`medusa-backend/packages/medusa/Dockerfile`):
1. **Corepack**: Mengaktifkan Corepack dan menggunakan Yarn 3.2.1
2. **Build Context**: Dirancang untuk build context `medusa-backend/`
3. **Install**: `yarn install --immutable --ignore-scripts`
4. **Structure**: Mengakses yarn.lock dari root monorepo

### **Frontend Dockerfile** (`medusa-frontend/Dockerfile`):
1. **Corepack**: Juga menggunakan Corepack untuk Yarn 3.2.1
2. **Install**: `yarn install --immutable --ignore-scripts`

### **Konfigurasi Dokploy yang Benar:**
- **Backend**: Build Context = `medusa-backend/`, Dockerfile = `packages/medusa/Dockerfile`
- **Frontend**: Build Context = `medusa-frontend/`, Dockerfile = `Dockerfile`

## Development Lokal (Opsional)
```bash
# Clone repository
git clone [your-repo]
cd [repo-name]

# Backend
cd medusa-backend/packages/medusa
cp .env.template .env
# Edit .env dengan konfigurasi lokal
yarn install
yarn build
yarn start

# Frontend (terminal lain)
cd medusa-frontend
cp .env.template .env.production
# Edit .env.production
yarn install
yarn build
yarn start
```

## Catatan Penting
1. **Secrets Management**: Jangan commit file `.env` ke GitHub
2. **Backup Database**: Setup backup otomatis di Supabase
3. **Monitoring**: Setup logging dan monitoring di Dokploy
4. **Scalability**: Atur resource CPU/memory sesuai kebutuhan

## Support
- [Dokploy Documentation](https://docs.dokploy.com)
- [Medusa Documentation](https://docs.medusajs.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://upstash.com/docs)