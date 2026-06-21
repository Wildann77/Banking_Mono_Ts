# AGENTS.md

## Purpose
File ini adalah entrypoint untuk AI agent yang bekerja di repository ini.

Tujuannya:
- memberi konteks singkat tentang proyek
- menjelaskan kenapa folder `docs/` ada dan kapan harus dirujuk
- membantu agent bernavigasi ke dokumen yang tepat sebelum membuat atau mengubah kode
- menjaga implementasi tetap konsisten dengan keputusan arsitektur yang sudah disepakati

## Project Context
Repository ini mengelola sistem perbankan berbasis **Bun Workspace Monorepo** dengan tiga service utama:
1. **HTTP Main Service (`server/`)**: Modular monolith NestJS yang bertindak sebagai HTTP entrypoint utama untuk identity-access, account management, core banking ledger, dan transfers.
2. **gRPC Operations Service (`packages/banking-operations-service/`)**: Microservice gRPC NestJS internal yang menangani operasi asinkron/sensitif (Notification SMTP dan Reconciliation/audit ledger secara read-only).
3. **Frontend Web App (`apps/web/`)**: SPA React 19 + Vite + shadcn/ui — consumer API Main Service.

Kedua service ini menggunakan standar arsitektur:
- `Domain-Driven Design (DDD)` penuh
- `Clean Architecture`
- `PostgreSQL` sebagai database relasional utama (Main Service menulis & membaca; Operations Service membaca secara read-only)
- `Prisma` sebagai adapter persistence utama di infrastructure
- Database lokal menggunakan Docker image PostgreSQL resmi
- Fokus tinggi pada `data integrity`, `security`, `auditability`, dan `transactional consistency`

Prinsip inti proyek:
- ledger adalah source of truth saldo
- ledger bersifat immutable
- transfer dana harus atomik
- idempotency adalah requirement wajib
- domain logic tidak boleh bocor ke controller atau infrastructure
- domain entity tidak boleh bergantung pada NestJS, Prisma, atau detail SQL

## Why This File Exists
AI agent sering langsung menulis kode terlalu cepat tanpa membaca keputusan arsitektur yang sudah ada.

File ini ada untuk memastikan agent:
- membaca konteks sebelum implementasi
- tidak menebak-nebak aturan domain
- tidak membuat struktur folder atau dependency yang melanggar desain
- tahu dokumen mana yang relevan untuk task tertentu

## Required Working Style For AI Agents
Sebelum implementasi atau refactor:
1. Baca dokumen yang relevan di `docs/`.
2. Pastikan solusi mengikuti DDD, Clean Architecture, dan NestJS best practices.
3. Jangan letakkan business rule di controller, DTO, schema persistence, atau adapter eksternal.
4. Gunakan use case per aksi penting.
5. Gunakan repository abstraction/port, bukan akses database langsung dari presentation/application tanpa boundary yang jelas.

Jika task menyentuh transfer, ledger, auth, persistence, migration, atau transaction:
- jangan lanjut coding sebelum mengecek dokumen desain terkait

## Recommended Reading Order
Gunakan urutan baca ini saat baru masuk ke repo:

1. [docs/PROJECT_OVERVIEW.md](docs/core/PROJECT_OVERVIEW.md)
   Untuk memahami tujuan sistem, scope, fitur utama, aktor, asumsi teknis, dan constraint proyek.
2. [docs/TECH_STACK.md](docs/core/TECH_STACK.md)
   Untuk memahami stack inti project, dependency baseline, tooling, dan batas teknologi yang dipakai.
3. [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
   Untuk memahami bounded context, entity, value object, aggregate, domain service, event, dan business rules.
4. [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
   Untuk memahami layer, dependency direction, flow request, error handling, validation, transaction boundary, dan security architecture.
5. [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md)
   Untuk menentukan penempatan file dan module structure.
6. [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)
   Untuk aturan implementasi detail, naming, DTO, repository, mapper, logging, dan error handling.
7. [docs/API_DESIGN.md](docs/core/API_DESIGN.md)
   Untuk endpoint contract, request/response shape, auth requirement, cookie strategy, dan standard error response.
8. [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)
   Untuk desain tabel, constraint, index, migration, Dockerized PostgreSQL, session auth persistence, dan mapping domain ke persistence.
9. [docs/IMPLEMENTATION_PLAN.md](docs/archive/audit/IMPLEMENTATION_PLAN.md)
   Untuk urutan implementasi yang disarankan dan acceptance criteria per fase.

## Navigation Guide
Gunakan panduan ini untuk memilih dokumen yang relevan berdasarkan jenis pekerjaan.

### Jika task adalah memahami produk atau scope
Baca:
- [docs/PROJECT_OVERVIEW.md](docs/core/PROJECT_OVERVIEW.md)

### Jika task adalah memahami stack, dependency, tooling, atau baseline teknologi
Baca:
- [docs/TECH_STACK.md](docs/core/TECH_STACK.md)
- [docs/PROJECT_OVERVIEW.md](docs/core/PROJECT_OVERVIEW.md)

### Jika task adalah menambah business rule atau domain object
Baca:
- [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
- [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Jika task adalah menentukan letak file atau membuat module baru
Baca:
- [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md)
- [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)

### Jika task adalah membuat controller, DTO, use case, guard, atau response contract
Baca:
- [docs/API_DESIGN.md](docs/core/API_DESIGN.md)
- [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
- [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Jika task adalah membuat entity, value object, aggregate, domain service, atau domain event
Baca:
- [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
- [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Jika task adalah membuat repository, Prisma schema, migration, mapper, atau transaction adapter
Baca:
- [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)
- [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
- [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)
- [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md)

### Jika task adalah transfer dana, ledger, atau idempotency
Baca wajib:
- [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
- [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
- [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)
- [docs/API_DESIGN.md](docs/core/API_DESIGN.md)

### Jika task adalah auth, JWT, refresh token, logout, logout-all, atau token rotation
Baca wajib:
- [docs/PROJECT_OVERVIEW.md](docs/core/PROJECT_OVERVIEW.md)
- [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
- [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
- [docs/API_DESIGN.md](docs/core/API_DESIGN.md)
- [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)

### Jika task adalah setup database lokal, migration, atau seeding
Baca wajib:
- [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/archive/audit/IMPLEMENTATION_PLAN.md)
- [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md)

### Jika task adalah tentang Frontend Web App (`apps/web/`)
Baca:
- [docs/frontend/FRONTEND_ARCHITECTURE.md](docs/frontend/FRONTEND_ARCHITECTURE.md) untuk layered architecture dan folder structure
- [docs/frontend/FRONTEND_AUTH_FLOW.md](docs/frontend/FRONTEND_AUTH_FLOW.md) untuk token storage, protected routes, auto-refresh
- [docs/frontend/FRONTEND_API_INTEGRATION.md](docs/frontend/FRONTEND_API_INTEGRATION.md) untuk Axios client, pagination, idempotency
- [docs/frontend/DESIGN.md](docs/frontend/DESIGN.md) untuk design system, komponen, dark mode
- [docs/frontend/FRONTEND_STACK.md](docs/frontend/FRONTEND_STACK.md) untuk dependency dan tooling
- [docs/backend-for-frontend/](docs/backend-for-frontend/) untuk panduan integrasi API (BFF cheat sheet, types, error handling)

### Jika task adalah tentang gRPC Operations Service (`banking-operations-service`)
Baca wajib:
- [docs/operations-service/SERVICE_SPEC.md](docs/operations-service/SERVICE_SPEC.md) untuk spesifikasi internal gRPC
- [docs/operations-service/PROTO_SPEC.md](docs/operations-service/PROTO_SPEC.md) untuk protobuf interface contract
- [docs/operations-service/WORKSPACE_STRUCTURE.md](docs/operations-service/WORKSPACE_STRUCTURE.md) untuk relasi Bun monorepo & env
- [docs/operations-service/TESTING_STRATEGY.md](docs/operations-service/TESTING_STRATEGY.md) untuk testing strategy
- [docs/operations-service/GRPC_CLIENT_SPEC.md](docs/operations-service/GRPC_CLIENT_SPEC.md) jika mengintegrasikan gRPC client di main service

### Jika task adalah implementasi bertahap atau planning sprint
Baca:
- [docs/IMPLEMENTATION_PLAN.md](docs/archive/audit/IMPLEMENTATION_PLAN.md)

## Source of Truth
Saat terjadi konflik interpretasi, gunakan prioritas berikut:

1. [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md) untuk aturan domain
2. [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md) untuk boundary dan dependency flow
3. [docs/API_DESIGN.md](docs/core/API_DESIGN.md) untuk contract HTTP dan auth session flow
4. [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md) untuk persistence, migrations, refresh session storage, dan Dockerized PostgreSQL
5. [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md) untuk penempatan file
6. [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md) untuk gaya implementasi
7. [docs/PROJECT_OVERVIEW.md](docs/core/PROJECT_OVERVIEW.md) untuk arah dan scope sistem
8. [docs/TECH_STACK.md](docs/core/TECH_STACK.md) untuk baseline teknologi, dependency, dan tooling

Jika dua dokumen tampak bertabrakan:
- prioritaskan domain rule dan architecture boundary
- jangan mengambil shortcut implementasi yang merusak invariants bisnis

## Auth Model Baseline
Untuk konteks `identity-access`, baseline yang harus diasumsikan agent adalah:
- `access token` berbentuk JWT stateless dengan masa aktif pendek, target default `15 menit`
- `access token` dikirim ke client lewat response body dan dipakai lewat header `Authorization: Bearer <token>`
- `refresh token` berbentuk JWT long-lived dengan masa aktif lebih panjang, target default `30 hari`
- `refresh token` dikirim sebagai `HttpOnly`, `Secure`, `SameSite` cookie, bukan payload JSON biasa
- database hanya menyimpan hash `SHA-256` dari refresh token, bukan token mentah
- setiap refresh session wajib memiliki `jti` unik dan `familyId` untuk rotation chain
- `users.token_version` dipakai untuk invalidasi cepat access token lama saat `logout-all`, password/security event, atau reuse detection
- refresh token yang sudah pernah dirotasi tidak boleh bisa dipakai lagi
- reuse refresh token lama harus diperlakukan sebagai `security event`

## Critical Invariants
AI agent tidak boleh melanggar hal berikut:
- saldo bukan source of truth utama
- ledger tidak boleh di-update atau di-delete sebagai alur normal
- transfer tidak boleh meninggalkan partial write
- `idempotencyKey` wajib dihormati
- domain entity tidak boleh bergantung pada NestJS atau Prisma
- controller tidak boleh berisi business logic
- DTO tidak boleh dipakai sebagai domain entity
- refresh token mentah tidak boleh disimpan ke database atau log
- refresh token tidak boleh dikembalikan dalam JSON payload biasa
- reuse refresh token lama harus memicu revoke seluruh sesi dalam `token family` terkait
- `logout-all` harus merevoke semua refresh session aktif milik user dan meningkatkan `token_version`
- **mutation endpoint WAJIB mengembalikan `{ data, meta }` via `withResponseMeta()` — bukan raw object**
- **currency input WAJIB divalidasi terhadap whitelist `SUPPORTED_CURRENCIES`**
- **interface/type yang dipakai lebih dari satu use case TIDAK boleh di-export dari file use case**
- **side effect eksternal (email, notif) TIDAK boleh dipanggil langsung dari use case — gunakan domain event**
- **akses data finansial sensitif (balance, ledger) WAJIB di-log**

## Implementation Guardrails
Saat menulis kode:
- buat `use case` per aksi penting
- gunakan `ports` untuk repository dan external dependency
- simpan mapper di boundary yang tepat
- gunakan validation teknis di DTO/pipes
- gunakan validation bisnis di domain/application
- gunakan transaction boundary pada flow transfer
- gunakan transaction boundary juga pada flow refresh rotation dan logout-all
- gunakan migration terkontrol untuk perubahan schema database
- gunakan Docker image PostgreSQL resmi untuk local/dev setup
- gunakan access token JWT dengan claims minimal dan refresh token session persistence yang aman
- **letakkan shared interface/type di `src/modules/<context>/application/types/`, bukan di file use case**
- **mutation endpoint eksplisit pakai `withResponseMeta()`; GET andalkan `TransformInterceptor`**
- **currency wajib ada di `SUPPORTED_CURRENCIES` whitelist — validasi di DTO dan `Money.create()`**
- **side effect (email, notif) via domain event, bukan direct call dari use case**
- **use case yang mengakses balance atau ledger WAJIB log event baca finansial**

## Cross-Cutting Standards
Standar berikut wajib dianggap aktif di seluruh repo, walaupun task hanya menyentuh satu module kecil.

### Structured Error Handling
- jangan kembalikan pesan error generik seperti `Something went wrong`
- semua error penting harus memiliki `error.code` yang stabil dan unik
- gunakan kode seperti `USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `REFRESH_TOKEN_REUSED`, `INSUFFICIENT_FUNDS`
- response error harus konsisten agar client bisa menangani error secara deterministik
- rujuk: [docs/API_DESIGN.md](docs/core/API_DESIGN.md), [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Structured Logging
- gunakan structured logging, bukan log string acak tanpa konteks
- log harus minimal mendukung `timestamp`, `level`, `message`, `traceId`, dan context/module name
- untuk operation sensitif seperti auth dan transfer, sertakan identifier yang aman seperti `userId`, `accountId`, `transferId`, `idempotencyKey`, `refreshSessionId`, `familyId` bila relevan
- jangan log secret, password, token mentah, refresh token mentah, atau data sensitif yang tidak perlu
- rujuk: [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Structured Response
- semua response sukses harus mengikuti envelope yang konsisten
- gunakan bentuk `data` dan `meta`
- semua response error harus mengikuti envelope `error`
- jangan mengembalikan shape response berbeda-beda tanpa alasan kontrak yang jelas
- **mutation endpoint WAJIB eksplisit pakai `withResponseMeta()` di controller**
- **GET endpoint boleh return raw object, interceptor handle otomatis**
- rujuk: [docs/API_DESIGN.md](docs/core/API_DESIGN.md)

### Transactions and ACID
- semua flow transfer uang wajib berada dalam transaction boundary
- flow `refresh token rotation`, `reuse detection`, dan `logout-all` juga wajib berada dalam transaction boundary yang benar
- pahami dan jaga properti `ACID`:
  - `Atomicity`: semua operasi berhasil bersama atau rollback bersama
  - `Consistency`: state data selalu valid sebelum dan sesudah transaction
  - `Isolation`: concurrent transaction tidak boleh saling merusak hasil
  - `Durability`: commit yang sukses harus tetap bertahan walau sistem crash setelahnya
- jangan pecah flow transfer atomik atau refresh rotation atomik menjadi write terpisah tanpa justifikasi arsitektural yang sangat kuat
- rujuk: [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)

### Input Validation and Sanitization
- semua request harus divalidasi sebelum masuk ke use case
- validasi format menggunakan `class-validator` dan `class-transformer` atau alat setara yang sesuai dengan NestJS
- lakukan sanitization input untuk menghapus atau menormalisasi nilai yang tidak aman atau tidak relevan
- validasi teknis tidak menggantikan validasi bisnis
- jangan percaya input client walau field terlihat sederhana seperti email, status, amount, account id, atau cookie-derived token
- **currency wajib ada di whitelist `SUPPORTED_CURRENCIES` — gunakan `@IsIn(SUPPORTED_CURRENCIES)` di DTO**
- rujuk: [docs/API_DESIGN.md](docs/core/API_DESIGN.md), [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Audit Logging for Financial Data
- `GetAccountBalanceUseCase` dan `ListLedgerEntriesUseCase` WAJIB log structured event saat akses
- event: `account_balance_read`, `ledger_entries_read`
- payload minimal: `accountId`, `userId`, `traceId`
- operation exhaustion (deadlock retry habis) WAJIB log `logger.error` sebelum throw
- rujuk: [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

### Domain Event Pattern
- side effect (email, notifikasi) TIDAK boleh di-call langsung dari use case
- gunakan `DomainEventPublisherPort` + event class di `domain/events/`
- handler di `application/handlers/` subscribe dan eksekusi
- rujuk: [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md), [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)

## When Updating Docs
Jika perubahan kode mengubah salah satu hal berikut, update dokumen terkait:
- endpoint atau response contract
- model domain atau business rule
- transaction strategy
- folder/module structure
- tabel, constraint, index, atau migration persistence
- auth session flow, cookie policy, atau refresh token lifecycle
- implementation plan atau urutan fase

## Quick Task Map
- Tambah endpoint baru: [docs/API_DESIGN.md](docs/core/API_DESIGN.md)
- Tambah entity / VO / aggregate: [docs/DOMAIN_MODEL.md](docs/core/DOMAIN_MODEL.md)
- Tentukan placement file: [docs/FOLDER_STRUCTURE.md](docs/core/FOLDER_STRUCTURE.md)
- Buat repository/Prisma schema/migration/mapper: [docs/DATABASE_DESIGN.md](docs/core/DATABASE_DESIGN.md)
- Validasi boundary layer: [docs/ARCHITECTURE.md](docs/core/ARCHITECTURE.md)
- Cek standar implementasi: [docs/CODING_STANDARDS.md](docs/core/CODING_STANDARDS.md)
- Cek urutan delivery: [docs/IMPLEMENTATION_PLAN.md](docs/archive/audit/IMPLEMENTATION_PLAN.md)
- Frontend component/page baru: [docs/frontend/DESIGN.md](docs/frontend/DESIGN.md), [docs/frontend/FRONTEND_ARCHITECTURE.md](docs/frontend/FRONTEND_ARCHITECTURE.md)
- Frontend API integration: [docs/frontend/FRONTEND_API_INTEGRATION.md](docs/frontend/FRONTEND_API_INTEGRATION.md), [docs/backend-for-frontend/](docs/backend-for-frontend/)
- Frontend auth flow: [docs/frontend/FRONTEND_AUTH_FLOW.md](docs/frontend/FRONTEND_AUTH_FLOW.md)

## Final Instruction For Agents
Jangan mulai dari "bagaimana cara tercepat menulis kode".
Mulailah dari:
1. aturan domain apa yang harus dijaga
2. boundary arsitektur apa yang tidak boleh dilanggar
3. dokumen `docs/` mana yang menjadi referensi utama untuk task ini

Jika ketiganya belum jelas, baca dokumen terkait dulu sebelum mengedit kode.

## Adopted Improvements (Standar Aktif Sejak Phase 10)
Standar berikut telah diadopsi dari hasil audit dan wajib dipatuhi:
1. **Mutation envelope**: semua POST/PATCH/PUT/DELETE wajib eksplisit `withResponseMeta()`
2. **Shared types isolation**: interface/type bersama di `application/types/`, bukan di use case file
3. **Financial read audit log**: balance dan ledger read wajib di-log (`account_balance_read`, `ledger_entries_read`)
4. **Currency whitelist**: `IDR`, `USD`, `SGD`, `EUR` — validasi di DTO + `Money.create()`
5. **Domain event untuk side effect**: email/notif via `DomainEventPublisherPort`, tidak langsung
6. **Account lifecycle endpoints**: `freeze`, `unfreeze`, `close` — exposed di API dan domain
7. **Cursor pagination**: ledger dan transfer list — cursor-based, bukan offset
8. **Redis Throttler & Cache**: Global Rate Limiter dan global caching untuk idempotensi dipindahkan ke Redis.
9. **Outbox Pattern dengan Redis Streams**: domain event asinkron dilewatkan tabel `outbox_events` dan didistribusikan via Redis Streams.
10. **PageHeader standard**: semua halaman wajib pakai `PageHeader` component dari `components/common/PageHeader.tsx` dengan title + description + optional action slot.
11. **CurrencyInput standard**: semua input amount currency wajib pakai `CurrencyInput` dari `components/common/CurrencyInput.tsx` dengan major-unit display dan minor-unit conversion on submit.
12. **DataTable loading/empty slots**: `DataTable` di `components/common/DataTable.tsx` menyediakan `isLoading`, `loadingState`, `emptyState` props untuk konsistensi skeleton/empty state.
13. **ErrorBoundary per-route**: setiap lazy-loaded route dibungkus `ErrorBoundary` dengan `resetKeys={[location.pathname]}` — lihat `LazyPage` di `routes/index.tsx`.



<!-- Commit history: Jun 21-25, 2026 -->
