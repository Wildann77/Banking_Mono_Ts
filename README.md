# Nest Banking Monorepo

Repositori monorepo berbasis **Bun Workspace** yang berisi backend banking ledger dengan arsitektur **Domain-Driven Design (DDD)** dan **Clean Architecture**.

## Struktur Workspace

Monorepo ini dibagi menjadi beberapa modul/workspace:

- **`server/`**: Service utama berbasis NestJS yang mengekspos RESTful/HTTP API. Bertindak sebagai *gRPC client* untuk berinteraksi dengan sub-service operasi perbankan.
- **`packages/proto/`**: Berisi definisi kontrak protokol gRPC (`operations.proto`) yang dibagikan ke seluruh sub-service.
- **`packages/banking-operations-service/`**: Sub-service NestJS gRPC internal yang menangani operasi asinkron/sensitif seperti:
  - **Notification Module**: Pengiriman email/alert dengan pola idempotensi lokal (Redis cache).
  - **Reconciliation Module**: Audit integritas ledger (gap detection, balance verification) secara read-only.

---

## Prasyarat (Prerequisites)

- **Bun** (versi terbaru direkomendasikan)
- **Node.js** v20+
- **PostgreSQL** & **Redis** (bisa dijalankan via Docker Compose di `docker-compose.yml`)

---

## Setup & Instalasi

Instal seluruh dependensi monorepo sekaligus dari level root:

```bash
bun install
```

---

## Manajemen Environment Variables (3-Env Strategy)

Monorepo ini membagi tanggung jawab konfigurasi ke dalam 3 berkas `.env` yang berbeda sesuai dengan konteks kerjanya:

```text
├── .env                  # Root: Infrastruktur lokal & Docker (Database & Cache port)
├── server/.env           # HTTP Service: API port, JWT Secret, connection strings (Prisma write)
└── packages/banking-operations-service/.env
                          # gRPC Service: gRPC port, SMTP email, DB read-only URL
```

### Korelasi Variabel Antar Layanan

| Kebutuhan / Konteks | `.env` (Root) | `server/.env` | `packages/banking-operations-service/.env` | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Port & DB** | `DB_PORT=5432`<br>`DB_NAME=banking_ledger` | Bagian dari `DATABASE_URL` | Bagian dari `OPERATIONS_DATABASE_URL` | Harus sinkron dengan port & nama DB PostgreSQL kontainer. |
| **PostgreSQL Credentials** | `DB_USER=banking_user`<br>`DB_PASSWORD=banking_password` | Bagian dari `DATABASE_URL` | Bagian dari `OPERATIONS_DATABASE_URL` | Kredensial akses database. |
| **Redis Cache & Streams** | `REDIS_PORT=6379` | `REDIS_PORT=6379`<br>`REDIS_HOST=localhost` | - | Digunakan oleh server untuk idempotensi dan outbox stream. |
| **gRPC Communication** | - | `OPERATIONS_GRPC_URL=localhost:50051` | `OPERATIONS_GRPC_PORT=50051`<br>`OPERATIONS_GRPC_HOST=0.0.0.0` | Port komunikasi internal gRPC client-server. |

### Panduan Inisialisasi Environment
Jalankan perintah berikut di terminal root untuk menyalin semua template `.env.example` lokal sekaligus:
```bash
# Salin root env
cp .env.example .env

# Salin server env
cp server/.env.example server/.env

# Salin gRPC sub-service env
cp packages/banking-operations-service/.env.example packages/banking-operations-service/.env
```

---

## Perintah Pengembangan (Scripts)

Perintah-perintah berikut dapat dijalankan langsung dari direktori root:

### 1. Menjalankan Server Development

```bash
# Menjalankan kedua server secara bersamaan (HTTP & gRPC)
bun dev

# Menjalankan HTTP main server saja
bun dev:server

# Menjalankan gRPC banking-operations-service saja
bun dev:ops
```

### 2. Membangun Proyek (Build)

```bash
# Build sub-service operasi (termasuk generate Prisma client)
bun build:ops

# Build HTTP main server
bun build:server

# Build semua package & service sekaligus
bun build:all
```

### 3. Pengujian (Testing)

```bash
# Menjalankan semua unit/integration test di workspace
bun test:all

# Menjalankan unit test di main server saja
bun test:server

# Menjalankan unit test di sub-service operasi saja
bun test:ops

# Menjalankan e2e test di main server
bun test:e2e:server

# Menjalankan e2e test di sub-service operasi
bun test:e2e:ops
```

---

## Catatan Penting Arsitektur

1. **Dependency Direction**:
   - `server` -> `@banking/proto` (mengimpor tipe data gRPC).
   - `packages/banking-operations-service` -> `@banking/proto`.
   - **Dilarang keras** mengimpor kode produksi secara langsung lintas service (`server` <-> `banking-operations-service`). Interaksi wajib melalui gRPC.
2. **Database Schema**:
   - Database schema dipusatkan di `server/prisma/schema.prisma`.
   - Sub-service `banking-operations-service` menarik skema ini saat build/generate melalui script `prisma:generate` lokal.


<!-- Development period: June 2026 -->
