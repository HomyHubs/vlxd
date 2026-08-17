# AGENTS.md — vlxd (Quản lý Vật liệu xây dựng)

> 📦 File `AGENTS.md` cho repo **HomyHubs/vlxd**, đặt ở **root repo**. Cấu hình FE/BE kế thừa từ Web App Template, điều chỉnh dùng **Supabase (free)** làm DB, tách **backend/frontend**, và bổ sung yêu cầu **gói dịch vụ**.

## 0. Nguyên tắc bất biến

1. **Memory nằm trong file, không nằm trong context.** Mọi trạng thái, quyết định, tiến độ ghi vào `AGENTS.md` / `docs/` / ADR.
2. **Inspect trước khi assume.** Không giả định tồn tại service, biến môi trường, script, API hay bảng DB.
3. **Contract-first.** `contracts/http/openapi.yaml` là nguồn sự thật duy nhất của API; CI có gate chống drift.
4. **Không refactor ngoài phạm vi task.** Thay đổi nhỏ, một mục đích một commit.
5. **Feature encapsulation.** Cross-module import chỉ qua public entry point `index.ts`.
6. **Không có secret trong repo**, image, log, fixture hay tài liệu. Supabase URL/anon key/service key phải nằm ở biến môi trường, không commit.
7. **Mọi lệnh dev/test chạy qua Docker Compose**, không phụ thuộc runtime cài trên host.
8. **Cập nhật tiến độ** trong `AGENTS.md` của module sau mỗi task.

---

## 1. Bối cảnh dự án

- **Dự án:** vlxd — Web app quản lý cửa hàng/doanh nghiệp vật liệu xây dựng (quản lý sản phẩm, nhà kho, tồn kho, nhập/xuất, hóa đơn).
- **Kiến trúc:** Backend và frontend **tách biệt** (hai ứng dụng riêng, giao tiếp qua REST theo OpenAPI).
- **Database:** **Supabase (gói free)** — dùng PostgreSQL do Supabase quản lý.
- **Mô hình kinh doanh:** dịch vụ theo gói (Free, Standard, Premium, Enterprise); mỗi user chọn gói để bắt đầu.

---

## 2. Tech stack chuẩn

### Backend — `apps/api`

| Hạng mục | Lựa chọn |
| --- | --- |
| Ngôn ngữ | TypeScript 5.9+, ESM |
| Runtime | Node 24.x, pin qua `.nvmrc` |
| Package manager | pnpm 11.x + pnpm workspace |
| HTTP framework | Fastify 5 + `fastify-type-provider-zod` |
| Database | PostgreSQL do **Supabase (free)** cung cấp |
| Data access | Kysely trên `pg`, kết nối tới Supabase qua connection string |
| Migration | dbmate, SQL thuần, reversible (chạy trên Supabase Postgres) |
| Validation | Zod 4 dùng chung qua `packages/shared` |
| Auth | Opaque server-side session + capability-based authorization |
| Logging | pino, bật redact PII, kèm request-id |
| Observability | OpenTelemetry, endpoint `/healthz` và `/readyz` |
| Security | helmet, rate-limit, cors |
| Test | Vitest 4, testcontainers cho DB thật (Postgres local khi test) |

> 🟢 Supabase free: dùng chuỗi kết nối Postgres của project Supabase cho `apps/api`. KHÔNG truy cập DB trực tiếp từ frontend; mọi truy cập DB đi qua backend. Lưu ý giới hạn của gói free (kích thước DB, số kết nối, pausing khi không hoạt động) — cân nhắc dùng connection pooler (pgBouncer / Supabase pooler port 6543).

### Frontend — `apps/web`

| Hạng mục | Lựa chọn |
| --- | --- |
| Framework | React 19 + TypeScript + Vite |
| UI | MUI v6+, x-date-pickers, material-react-table |
| Server state | TanStack React Query 5 |
| Form | react-hook-form + Zod resolver |
| Router | react-router-dom 7 với route-level lazy loading |
| i18n | i18next + react-i18next (mặc định `vi`, hỗ trợ `en`) |
| API client | Sinh tự động từ OpenAPI vào `packages/api-client` |
| Test | Vitest + Testing Library, Playwright + axe-core |
| Mock API | MSW |
| Gate | coverage v8, bundle budget, jsx-a11y |

### Hạ tầng và CI/CD

| Hạng mục | Lựa chọn |
| --- | --- |
| Local orchestration | `compose.dev.yml` gồm web, api, db (Postgres local để dev/test), migrate, verify |
| DB thật (staging/prod) | Supabase (free) |
| Reverse proxy | nginx |
| CI | Một pipeline GitHub Actions, cache pnpm + turbo |
| Secret | Biến môi trường / secret manager; Supabase keys không commit |
| Supply chain | Renovate, pnpm audit, gitleaks |

---

## 3. Cấu trúc repo chuẩn

```text
repo/
├── AGENTS.md
├── Makefile                     # bootstrap | dev | check | migrate
├── turbo.json
├── pnpm-workspace.yaml
├── .nvmrc
├── docs/
│   ├── README.md
│   ├── decision-backlog.md
│   ├── adr/
│   ├── architecture/
│   ├── business-analysis/
│   └── requirements/
│       └── service-plans.md     # yêu cầu gói dịch vụ (mục 8)
├── standards/
├── contracts/http/openapi.yaml
├── apps/
│   ├── web/    (+ AGENTS.md)
│   │   └── src/{app,features,components,lib,i18n,theme,utils,test,generated}
│   └── api/    (+ AGENTS.md)
│       └── src/{features,platform,main.ts}
├── packages/
│   ├── shared/          # Zod schemas, domain types, error codes
│   ├── api-client/      # generated, không sửa tay
│   ├── config-eslint/
│   ├── config-ts/
│   └── config-prettier/
├── db/         (+ AGENTS.md)  # dbmate migrations chạy trên Supabase Postgres
├── e2e/
├── infra/
├── nginx/
└── compose.*.yml
```

### Quy ước vertical slice

```text
apps/api/src/features/warehouse/
├── index.ts        # public entry point
├── routes.ts       # HTTP layer, khớp openapi.yaml
├── service.ts      # domain logic, không biết HTTP
├── repository.ts   # Kysely queries
├── schema.ts       # Zod
└── __tests__/

apps/web/src/features/warehouse/
├── index.ts
├── api/            # hooks React Query bọc api-client
├── components/
├── pages/
├── hooks/
└── __tests__/
```

---

## 4. Workflow bắt buộc cho AI Agent

### Trước khi code

1. Đọc `docs/README.md`, `standards/README.md` và các `AGENTS.md` lồng nhau của thư mục sẽ sửa.
2. Đọc `docs/decision-backlog.md`. Không vượt qua blocking gate đã đặt tên.
3. Xác minh requirement/contract đã được chấp nhận trước khi code.
4. Nếu đổi API: sửa `contracts/http/openapi.yaml` trước, rồi regenerate client.
5. Nếu đổi schema DB: viết migration dbmate mới, không sửa migration đã merge.

### Khi code

- Feature mới tạo slice đầy đủ theo mẫu ở mục 3.
- Chỉ import qua `index.ts` của module khác.
- Mọi input từ ngoài (HTTP body, query, env) parse bằng Zod.
- Mọi chuỗi UI đi qua i18next.
- Không thêm dependency mới mà không ghi lý do vào PR.
- Enforce giới hạn theo gói ở **backend**; frontend chỉ là lớp trải nghiệm.

### Trước khi commit

```bash
make check   # format:check && lint && typecheck && test && build
```

Gate phải xanh: format, lint (--max-warnings 0), typecheck, unit + integration test, OpenAPI drift, bundle budget, secret scan.

### Sau khi code

1. Cập nhật tài liệu sở hữu rule đó (không nhân bản rule portable).
2. Thêm ADR mới nếu quyết định cross-cutting/khó đảo ngược; không sửa ADR đã Accepted/Rejected.
3. Cập nhật tiến độ trong `AGENTS.md` của module.
4. Commit nhỏ theo Conventional Commits.

---

## 5. Lệnh chuẩn

```bash
# Khởi tạo lần đầu
make bootstrap

# Phát triển
docker compose -f compose.dev.yml up
docker compose -f compose.dev.yml run --rm migrate

# Kiểm tra
pnpm -r check
pnpm --filter api test:integration
pnpm --filter web test:browser-integration

# Contract
pnpm contracts:lint
pnpm contracts:generate
pnpm contracts:check

# Migration lên Supabase (staging/prod) — dùng DATABASE_URL của Supabase
dbmate up
```

---

## 6. Definition of Done

- [ ] Hành vi khớp OpenAPI spec đã cập nhật, client đã regenerate và commit
- [ ] Unit test cho domain logic + integration test qua DB thật
- [ ] `pnpm -r check` xanh cục bộ và trên CI
- [ ] Không thêm secret, không `any`, không eslint-disable thiếu lý do
- [ ] Chuỗi UI đã i18n, không tạo violation axe mới
- [ ] Log structured + request-id, lỗi trả về theo error code trong `packages/shared`
- [ ] Giới hạn theo gói được enforce ở backend và có test
- [ ] Migration reversible và đã test rollback trên Supabase

---

## 7. Anti-pattern cần tránh

| Anti-pattern | Thay bằng |
| --- | --- |
| Truy cập Supabase DB trực tiếp từ frontend | Mọi truy cập DB qua backend `apps/api` |
| Commit Supabase service key / connection string | Biến môi trường + secret manager |
| Copy type/schema giữa FE và BE | `packages/shared` • client sinh từ OpenAPI |
| Sửa tay code trong `generated/` | Sửa `openapi.yaml` rồi regenerate |
| Enforce giới hạn gói chỉ ở frontend | Enforce ở backend, FE chỉ hiển thị |
| Refactor lớn kèm feature | Tách PR riêng |

---

## 8. Yêu cầu nghiệp vụ — Gói dịch vụ

> 🧾 Web app cung cấp dịch vụ theo gói. Mỗi user chọn một gói để bắt đầu sử dụng. Gói quyết định: giới hạn sản phẩm, số nhà kho, AI agent, chuyển hóa đơn viết tay thành hóa đơn online, và chế độ cơ sở dữ liệu.

### 8.1. Danh sách gói

#### Free (Miễn phí)

- Cho dùng miễn phí để trải nghiệm.
- Giới hạn tối đa **80 sản phẩm** trong kho.
- Phù hợp cửa hàng nhỏ hoặc dùng thử.

#### Tiêu chuẩn — Standard

- Chỉ có **1 nhà kho**.
- Đầy đủ chức năng cơ bản: quản lý sản phẩm, tồn kho, nhập/xuất, hóa đơn.

#### Chuyên nghiệp — Premium

- **Không giới hạn nhà kho**.
- Có **AI agent**: user có thể **chat** hoặc **yêu cầu bằng giọng nói**.
- Cho phép **chụp hóa đơn viết tay** và chuyển thành **hóa đơn online** (OCR + cho phép user kiểm tra/chỉnh sửa trước khi lưu).

#### Cao cấp — Enterprise

- Bao gồm mọi quyền lợi của Premium.
- Cho phép **cài đặt riêng** và có **cơ sở dữ liệu riêng biệt** (tách khỏi DB dùng chung của các gói khác — ví dụ một Supabase project / instance riêng cho tenant).

### 8.2. Bảng năng lực theo gói

| Tính năng | Free | Standard | Premium | Enterprise |
| --- | --- | --- | --- | --- |
| Sử dụng ứng dụng | Có | Có | Có | Có |
| Giới hạn sản phẩm trong kho | 80 | Không giới hạn \* | Không giới hạn \* | Không giới hạn \* |
| Số nhà kho | 1 | 1 | Không giới hạn | Không giới hạn |
| AI agent (chat) | Không | Không | Có | Có |
| AI agent (giọng nói) | Không | Không | Có | Có |
| Chụp hóa đơn viết tay → hóa đơn online | Không | Không | Có | Có |
| DB dùng chung | Có | Có | Có | Không |
| DB riêng biệt / cài đặt riêng | Không | Không | Không | Có |

> ❓ (\*) Giới hạn số sản phẩm cho Standard/Premium/Enterprise chưa được chốt — xem Open Decisions. Chỉ Free chắc chắn giới hạn 80 sản phẩm.

### 8.3. Chọn gói khi bắt đầu

1. User đăng ký / onboarding lần đầu.
2. Hệ thống hiển thị các gói: Free, Standard, Premium, Enterprise.
3. User chọn gói.
4. Hệ thống lưu gói đã chọn vào tài khoản/tenant.
5. Quyền và giới hạn được enforce theo gói đã chọn.

### 8.4. Enforcement (bắt buộc ở backend)

- Tạo sản phẩm: nếu gói **Free** và đã có 80 sản phẩm → chặn tạo thêm.
- Tạo nhà kho: gói **Free/Standard** giới hạn 1 nhà kho → chặn tạo nhà kho thứ 2.
- AI chat / AI giọng nói: chỉ **Premium** và **Enterprise**.
- Chụp hóa đơn viết tay → hóa đơn online: chỉ **Premium** và **Enterprise**.
- Định tuyến DB: **Free/Standard/Premium** dùng DB chung; **Enterprise** dùng DB riêng biệt.

### 8.5. Gợi ý dữ liệu

```typescript
type Plan = 'free' | 'standard' | 'premium' | 'enterprise'

const PLAN_CONFIG = {
  free:       { productLimit: 80,   warehouseLimit: 1,    hasAIAgent: false, hasVoice: false, hasInvoiceOCR: false, databaseMode: 'shared' },
  standard:   { productLimit: null, warehouseLimit: 1,    hasAIAgent: false, hasVoice: false, hasInvoiceOCR: false, databaseMode: 'shared' },
  premium:    { productLimit: null, warehouseLimit: null, hasAIAgent: true,  hasVoice: true,  hasInvoiceOCR: true,  databaseMode: 'shared' },
  enterprise: { productLimit: null, warehouseLimit: null, hasAIAgent: true,  hasVoice: true,  hasInvoiceOCR: true,  databaseMode: 'dedicated' },
} as const
```

### 8.6. Open Decisions

1. User có được đổi gói sau onboarding không? Hạ gói xử lý dữ liệu vượt hạn mức ra sao?
2. Standard/Premium/Enterprise có giới hạn số sản phẩm không?
3. Gói gắn theo user hay theo tenant/công ty?
4. Enterprise: provisioning DB riêng tự động hay admin cấu hình thủ công?
5. AI giọng nói lưu audio, transcript, hay cả hai?
6. Trường bắt buộc khi OCR hóa đơn viết tay là gì? Có bắt buộc human review không?

---

## 9. Trạng thái hiện tại (agent cập nhật mục này)

- [ ] Monorepo skeleton (pnpm workspace + turbo)
- [ ] contracts/http/openapi.yaml khởi tạo
- [ ] apps/api: Fastify bootstrap + /healthz, kết nối Supabase
- [ ] apps/web: Vite + MUI + Router bootstrap
- [ ] db: migration đầu tiên + seed (dbmate trên Supabase)
- [ ] compose.dev.yml chạy được end-to-end
- [ ] CI: check + contracts:check + gitleaks
- [ ] Gói dịch vụ: model dữ liệu + enforcement backend + màn chọn gói
- [ ] AI agent (chat + giọng nói) cho Premium/Enterprise
- [ ] OCR hóa đơn viết tay → hóa đơn online
- [ ] Enterprise: định tuyến DB riêng biệt

> ⚠️ Cập nhật checklist trên sau mỗi task. Đây là memory của dự án.
