# AGENTS.md — vlxd (Quản lý Vật liệu xây dựng)

> ⚠️ Đây là chỉ dẫn **BẮT BUỘC** cho AI coding agent làm việc trên repo `HomyHubs/vlxd`. Đọc hết trang này trước khi code và tuân thủ tuyệt đối. File này đồng thời là **bộ nhớ chung**: mọi trạng thái công việc ghi tại mục *Trạng thái tiến độ*, không giữ trong ngữ cảnh chat.

> 🔒 Trang này áp trực tiếp chuẩn gốc "AGENTS — Chỉ dẫn vận hành cho AI Coding Agent" cho dự án vlxd. Mọi mục đã được **chốt dứt khoát** cho vlxd — không còn dạng "có thể dùng X hoặc Y"; đã nêu rõ vlxd dùng gì.

## 0.0 Bản đồ tài liệu và thứ tự ưu tiên

| Tài liệu | Khi nào đọc | Vai trò |
| --- | --- | --- |
| Trang này — `AGENTS.md` ở root repo | Luôn luôn, đầu mỗi phiên | Bắt buộc, cao nhất |
| Profile công nghệ web app (Web App Template) | Đã áp dụng — vlxd là web app FE+BE | Đã gộp vào mục 2.5 |
| `AGENTS.md` con trong từng thư mục chức năng | Khi sửa file trong thư mục đó | Bổ sung phạm vi hẹp |
| `docs/adr/` | Khi quyết định cross-cutting hoặc khó đảo ngược | Bắt buộc ghi lại |
| `docs/decision-backlog.md` | Trước khi bắt đầu một mốc lớn | Không được vượt gate đang mở |

**Thứ tự ưu tiên khi xung đột:** trang gốc này → profile công nghệ (mục 2.5) → `AGENTS.md` con → thói quen riêng của agent (thấp nhất).

---

## 0. Quy tắc tối thượng

- Agent KHÔNG được giữ "trí nhớ" dự án trong đầu. Mọi trạng thái phải nằm trong mục **## Trạng thái tiến độ** của file này.
- Đầu mỗi phiên: ĐỌC `AGENTS.md` này trước tiên, xác định đang ở đâu, rồi mới code.
- Hoàn thành một bước: CẬP NHẬT ngay mục Trạng thái tiến độ.
- Trước khi kết thúc phiên hoặc sắp hết token: GHI rõ trạng thái rồi COMMIT.

---

## 1. Bối cảnh dự án

| Trường | Giá trị (đã chốt cho vlxd) |
| --- | --- |
| Tên dự án | vlxd |
| Mục tiêu một dòng | Web app quản lý cửa hàng/doanh nghiệp vật liệu xây dựng (sản phẩm, nhà kho, tồn kho, nhập/xuất, hóa đơn) |
| Loại dự án | Web app FE+BE tách biệt |
| Profile công nghệ áp dụng | Web App Template (xem mục 2.5) |
| Stack thực tế | FE: React 19 + Vite + MUI; BE: Node 24 + Fastify 5 + Kysely; DB: **Supabase (free)** Postgres |
| Điểm khởi đầu | `apps/web` (frontend), `apps/api` (backend), `contracts/http/openapi.yaml` (contract) |
| Cách chạy local | `docker compose -f compose.dev.yml up` |
| Người/nhóm sở hữu | HomyHubs |

> 🔌 vlxd là web app FE+BE nên **BẮT BUỘC** áp profile công nghệ ở mục 2.5 (stack chuẩn, monorepo, contract-first OpenAPI, cổng gác CI). Điều chỉnh duy nhất so với profile gốc: DB dùng **Supabase (free)** thay cho Postgres tự vận hành.

---

## 1.5 Nhận diện cấu trúc repo — QUYừT ĐẮNH ĐÃ CHỐT

> 🧭 Đã quét repo `HomyHubs/vlxd` (branch `dev`). Root chỉ có `AGENTS.md`, `README.md` (gần như trống) và `requirements_extracted/`. **Chưa có code chia theo chức năng.**

**Quyết định: TRƯỜNG HỢP B** — repo chưa chia thư mục theo chức năng, do đó **áp sơ đồ cây chuẩn ở mục 2** làm khuôn mẫu.

- Di chuyển / tạo code vào đúng module theo phạm vi từng task, không refactor toàn bộ một lần.
- Thư mục `requirements_extracted/` hiện có được giữ lại; nội dung yêu cầu chuẩn hoá dần vào `docs/requirements/`.
- Áp mọi nguyên tắc chung (đóng gói module, import qua cửa công khai `index.ts`, cổng gác mục 4, chốt contract mục 5) lên chính cấu trúc mới này.

---

## 2. Sơ đồ cây thư mục (áp dụng — Trường hợp B, web app FE+BE)

```text
vlxd/
├── AGENTS.md                     # File này: chỉ dẫn + trạng thái tiến độ toàn dự án
├── Makefile                      # bootstrap | dev | check | migrate
├── turbo.json
├── pnpm-workspace.yaml
├── .nvmrc                        # Node 24.x
├── compose.dev.yml
├── docs/
│   ├── README.md
│   ├── decision-backlog.md
│   ├── adr/
│   └── requirements/
│       └── service-plans.md          # yêu cầu gói dịch vụ (xem mục "Gói dịch vụ")
├── standards/
├── contracts/http/openapi.yaml   # nguồn sự thật duy nhất của API
├── apps/
│   ├── web/    (+ AGENTS.md con)
│   │   └── src/features/<feature>/{index.ts,api,components,pages,hooks,__tests__}
│   └── api/    (+ AGENTS.md con)
│       └── src/features/<feature>/{index.ts,routes.ts,service.ts,repository.ts,schema.ts,__tests__}
├── packages/
│   ├── shared/                   # Zod schema, domain type, error code dùng chung
│   ├── api-client/               # sinh từ OpenAPI, KHÔNG sửa tay
│   └── config-*/                 # eslint / ts / prettier dùng chung
└── db/         (+ AGENTS.md con)  # dbmate migration chạy trên Supabase Postgres
```

**Nguyên tắc cấu trúc BẮT BUỘC giữ:**

- Gom MỌI thứ của một chức năng vào đúng thư mục của nó, không rải rác.
- Module A KHÔNG import trực tiếp vào file bên trong module B — chỉ qua cửa công khai `index.ts` của B.
- Mỗi chức năng có một `AGENTS.md` con ghi trạng thái riêng.

---

## 2.5 Stack công nghệ đã CHỐT cho vlxd (profile web app FE+BE)

> 🟢 Mọi hạng mục dưới đây là quyết định cuối, không phải gợi ý. Agent dùng đúng các lựa chọn này, không thay thế nếu không có ADR.

### Backend — `apps/api`

| Hạng mục | vlxd dùng |
| --- | --- |
| Ngôn ngữ | TypeScript 5.9+, ESM |
| Runtime | Node 24.x (pin qua `.nvmrc`) |
| Package manager | pnpm 11.x + pnpm workspace |
| HTTP framework | Fastify 5 + `fastify-type-provider-zod` |
| Database | PostgreSQL do **Supabase (free)** cung cấp |
| Data access | Kysely trên `pg`, kết nối Supabase qua connection string (ưu tiên pooler port 6543) |
| Migration | dbmate, SQL thuần, reversible, chạy trên Supabase Postgres |
| Validation | Zod 4 dùng chung qua `packages/shared` |
| Auth | Opaque server-side session + capability-based authorization |
| Logging | pino, redact PII, kèm request-id |
| Observability | OpenTelemetry; endpoint `/healthz` (live) và `/readyz` (ready) |
| Security | helmet, rate-limit, cors |
| Test | Vitest 4 + testcontainers (Postgres thật trong container khi test) |

### Frontend — `apps/web`

| Hạng mục | vlxd dùng |
| --- | --- |
| Framework | React 19 + TypeScript + Vite |
| UI | MUI v6+, x-date-pickers, material-react-table |
| Server state | TanStack React Query 5 |
| Form | react-hook-form + Zod resolver |
| Router | react-router-dom 7, lazy loading theo route |
| i18n | i18next + react-i18next (mặc định `vi`, hỗ trợ `en`) |
| API client | Sinh từ OpenAPI vào `packages/api-client` |
| Test | Vitest + Testing Library; Playwright + axe-core cho e2e/a11y |
| Mock API | MSW |

### Hạ tầng / CI

| Hạng mục | vlxd dùng |
| --- | --- |
| Local | `compose.dev.yml`: web, api, db (Postgres local cho dev/test), migrate, verify |
| DB staging/prod | Supabase (free) |
| Reverse proxy | nginx |
| CI | GitHub Actions, cache pnpm + turbo |
| Secret | Biến môi trường / secret manager; khóa Supabase KHÔNG commit |
| Supply chain | Renovate, pnpm audit, gitleaks |

---

## 3. Quy tắc bắt buộc khi code

- Trước khi code: đọc mục **## Trạng thái tiến độ** để biết đang ở đâu.
- Chỉ sửa file thuộc phạm vi task hiện tại. Tuyệt đối không sửa file ngoài phạm vi.
- Commit nhỏ, message rõ ràng theo Conventional Commits.
- Sau khi xong một bước: chạy đầy đủ cổng gác mục 4, rồi cập nhật Trạng thái tiến độ.
- Mọi input từ ngoài (body, query, param, env) parse bằng Zod trước khi dùng.
- Mọi chuỗi UI đi qua i18next.
- Giới hạn theo gói enforce ở **backend**; frontend chỉ là lớp trải nghiệm.

---

## 4. Cổng gác tất định (chạy trước khi coi là "xong")

```bash
pnpm -r check   # format:check + lint(--max-warnings 0) + typecheck + test + build
```

- Bao gồm: format, lint không warning, typecheck, unit + integration test, kiểm tra drift OpenAPI, bundle budget, quét secret (gitleaks).
- PASS hết → được commit. FAIL → KHÔNG commit vào nhánh chính; tạo `git checkout -b repair/<mô-tả>` và sửa tới khi pass.
- "Đúng hay sai" do test quyết định. Không tắt rule để làm xanh cổng gác.
- Mọi cổng gác chạy cục bộ phải chạy y nguyên trên CI.

---

## 5. Chốt hợp đồng (contract) TRƯỚC khi làm

- Trước khi hiện thực feature, định nghĩa và cố định interface công khai trong `index.ts` của module. Không đổi contract giữa chừng.
- API giữa FE và BE: `contracts/http/openapi.yaml` là nguồn sự thật. Sửa spec trước, sinh lại client, rồi mới viết code.

```typescript
// apps/api/src/features/warehouse/index.ts — chốt trước, không đổi giữa chừng
export interface WarehouseModule {
  listWarehouses(tenantId: string): Promise<Warehouse[]>
  createWarehouse(tenantId: string, input: CreateWarehouseInput): Promise<Warehouse>
}
```

---

## 6. Làm việc song song nhiều feature

- Mỗi feature một worktree + một nhánh riêng; mỗi agent chỉ làm trong đúng worktree của mình.
- KHÔNG có 2 agent cùng sửa một file dùng chung cùng lúc.
- Feature phụ thuộc nhau làm TUẦN TỰ (ví dụ invoice cần warehouse thì xong warehouse trước).
- File dùng chung bắt buộc (router tổng) dùng "điểm ghép tự động", mỗi dòng đăng ký độc lập để giảm conflict.

---

## 7. Quy trình ghép (integration)

Gộp từng nhánh một, test pass mới gộp tiếp:

```bash
git checkout dev
git merge feature/warehouse
pnpm -r check        # PASS mới được gộp cái tiếp theo
git merge feature/invoice
pnpm -r check
```

---

## 8. Quy trình bàn giao khi đổi tool / hết token

1. Cập nhật đầy đủ mục **## Trạng thái tiến độ** (đang viết hàm nào, file nào, còn thiếu gì).
2. Commit kể cả khi chưa xong: `git commit -m "wip: <mô tả>"`.
3. Agent kế tiếp chỉ cần đọc `AGENTS.md` này là tiếp tục được.

---

## 9. Bảo mật và secret (không thoả hiệp)

- Không commit secret vào repo, image, log, fixture hay tài liệu. Chỉ commit `.env.example` với giá trị giả.
- Khóa Supabase (URL, anon key, service key, connection string) nạp lúc runtime từ secret manager; không dùng `.env` cho staging/production.
- Bật gitleaks trong CI. Nếu secret đã lọt: thu hồi và xoay khóa trước, xoá lịch sử sau.
- Không in secret, token, header `Authorization` hay PII ra log/terminal/issue/chat.
- Mọi input ngoài validate bằng Zod trước khi dùng. Thêm dependency phải ghi lý do trong PR.

---

## 10. Nhật ký, quan sát, xử lý lỗi

- pino structured log, mỗi log là bản ghi có trường, kèm request-id lan từ FE xuống BE. Không rải `console.log`.
- Bật redact trường nhạy cảm ngay tại logger.
- Mọi service có `/healthz` (live) và `/readyz` (ready) tách riêng.
- Lỗi trả về theo bộ error code tập trung trong `packages/shared`, không ném message tự do, không lộ stack trace ra client.
- Không bắt lỗi rồi bỏ qua im lặng.

---

## 11. Dữ liệu và migration

- Migration append-only. Không sửa migration đã merge, chỉ thêm mới.
- Mỗi migration đảo ngược được và đã test rollback trên Supabase Postgres.
- Không sửa schema trực tiếp trên bất kỳ môi trường nào. Mọi thay đổi qua migration được commit.
- Thay đổi phá vỡ chia hai bước: thêm cái mới tương thích ngược trước, xoá cái cũ ở release sau.
- Seed tách theo môi trường. Integration test chạy trên DB thật trong container, không mock tầng truy cập dữ liệu.

---

## 12. Contract API và code sinh tự động

- `contracts/http/openapi.yaml` là nguồn sự thật duy nhất. Sửa spec → sinh lại client → viết code.
- `packages/api-client` sinh tự động, không sửa tay.
- CI có gate chống lệch spec vs code sinh; gate đỏ thì không merge.
- Kiểu/schema dùng chung ở `packages/shared`, không copy thủ công giữa FE và BE.

---

## 13. Tài liệu và ADR

- Quyết định cross-cutting hoặc khó đảo ngược phải có ADR đánh số trong `docs/adr/`.
- ADR đã Accepted/Rejected là bất biến; muốn đổi thì tạo ADR mới thay thế.
- Rule dùng chung nhiều dự án ở `standards/`; tài liệu riêng dự án ở `docs/`. Không nhân bản cùng rule hai nơi.
- Sửa hành vi thì sửa luôn tài liệu sở hữu hành vi đó trong cùng PR.

---

## 14. Quy ước commit và pull request

- Conventional Commits: `feat(warehouse): ...`, `fix(api): ...`, `docs(adr): ...`, `wip: ...` khi bàn giao.
- Một PR một mục đích. Refactor lớn tách PR riêng.
- PR nêu: làm gì, tại sao, ảnh hưởng đâu, đã test thế nào, dependency mới nếu có và lý do.
- Không force push lên nhánh người khác. Không commit trực tiếp lên nhánh chính.

---

## 15. Definition of Done

- [ ] Contract module đã chốt và không đổi giữa chừng; API thì spec đã cập nhật và client đã sinh lại
- [ ] Có test cho domain logic + integration test qua DB thật
- [ ] Toàn bộ cổng gác mục 4 xanh cả cục bộ và CI
- [ ] Không thêm secret, không `any` bỏ kiểm tra, không tắt rule lint thiếu lý do
- [ ] Log có cấu trúc + request-id; lỗi theo error code tập trung
- [ ] Migration đảo ngược được và đã test rollback
- [ ] Giới hạn theo gói enforce ở backend và có test
- [ ] Chỉ sửa file trong phạm vi task
- [ ] Tài liệu/ADR liên quan đã cập nhật
- [ ] Mục Trạng thái tiến độ đã cập nhật và đã commit

---

## 16. Anti-pattern cấm tuyệt đối

| Anti-pattern | Thay bằng |
| --- | --- |
| Giữ tiến độ trong đầu hoặc trong chat | Ghi vào Trạng thái tiến độ và commit |
| Truy cập Supabase DB trực tiếp từ frontend | Mọi truy cập DB qua backend `apps/api` |
| Commit khóa Supabase / connection string | Secret manager, nạp lúc runtime |
| Đập đi tái cấu trúc repo đã có quy ước | Bổ sung dần theo task (mục 1.5) |
| Import thắng vào file bên trong module khác | Chỉ import qua `index.ts` |
| Đổi contract giữa chừng | Chốt trước, đổi thì làm ADR |
| Tắt rule lint hoặc bỏ test để làm xanh cổng gác | Sửa nguyên nhân |
| Sửa tay code sinh tự động | Sửa spec rồi sinh lại |
| Sửa migration đã merge | Thêm migration mới |
| Copy kiểu dữ liệu giữa FE và BE | `packages/shared` hoặc client sinh từ spec |
| Enforce giới hạn gói chỉ ở frontend | Enforce ở backend, FE chỉ hiển thị |
| Hai agent cùng sửa một file dùng chung cùng lúc | Worktree riêng, điểm ghép mỗi dòng độc lập |
| Kết thúc phiên mà không commit và không ghi trạng thái | Quy trình bàn giao mục 8 |
| Refactor lớn gán kèm feature trong một PR | Tách PR |

---

## Gói dịch vụ (yêu cầu nghiệp vụ vlxd — đã chốt)

> 🧾 Web app cung cấp dịch vụ theo gói. Mỗi user chọn một gói để bắt đầu. Gói quyết định: giới hạn sản phẩm, số nhà kho, AI agent, OCR hóa đơn viết tay, và chế độ cơ sở dữ liệu. Chi tiết đầy đủ ở `docs/requirements/service-plans.md`.

### Bảng năng lực theo gói (quyết định cuối)

| Tính năng | Free | Standard | Premium | Enterprise |
| --- | --- | --- | --- | --- |
| Sử dụng ứng dụng | Có | Có | Có | Có |
| Giới hạn sản phẩm trong kho | 80 | Không giới hạn | Không giới hạn | Không giới hạn |
| Số nhà kho | 1 | 1 | Không giới hạn | Không giới hạn |
| AI agent (chat) | Không | Không | Có | Có |
| AI agent (giọng nói) | Không | Không | Có | Có |
| Chụp hóa đơn viết tay → hóa đơn online | Không | Không | Có | Có |
| DB dùng chung | Có | Có | Có | Không |
| DB riêng biệt / cài đặt riêng | Không | Không | Không | Có |

### Enforcement (bắt buộc ở backend)

- Tạo sản phẩm: gói **Free** đủ 80 sản phẩm → chặn tạo thêm.
- Tạo nhà kho: gói **Free/Standard** giới hạn 1 nhà kho → chặn tạo nhà kho thứ 2.
- AI chat / AI giọng nói: chỉ **Premium** và **Enterprise**.
- OCR hóa đơn viết tay → hóa đơn online: chỉ **Premium** và **Enterprise**.
- Định tuyến DB: **Free/Standard/Premium** dùng DB chung; **Enterprise** dùng DB riêng biệt.

### Cấu hình gói (chuẩn cho backend)

```typescript
type Plan = 'free' | 'standard' | 'premium' | 'enterprise'

const PLAN_CONFIG = {
  free:       { productLimit: 80,   warehouseLimit: 1,    hasAIAgent: false, hasVoice: false, hasInvoiceOCR: false, databaseMode: 'shared' },
  standard:   { productLimit: null, warehouseLimit: 1,    hasAIAgent: false, hasVoice: false, hasInvoiceOCR: false, databaseMode: 'shared' },
  premium:    { productLimit: null, warehouseLimit: null, hasAIAgent: true,  hasVoice: true,  hasInvoiceOCR: true,  databaseMode: 'shared' },
  enterprise: { productLimit: null, warehouseLimit: null, hasAIAgent: true,  hasVoice: true,  hasInvoiceOCR: true,  databaseMode: 'dedicated' },
} as const
```

---

## Trạng thái tiến độ

> 🧠 Khu vực bộ nhớ chung. Luôn cập nhật mục này.

**Quyết định cấu trúc repo (mục 1.5):** [x] Trường hợp B (áp sơ đồ mục 2) — [ ] Trường hợp A
**Profile công nghệ (mục 0.0 và 2.5):** [x] Web app FE+BE (Web App Template, DB = Supabase free)
**Cổng gác thực tế (mục 4):** `pnpm -r check` — đã xác minh chạy được: [ ] cục bộ [ ] CI

### Task hiện tại
- Khởi tạo skeleton dự án theo sơ đồ mục 2.

### Đã xong
- [x] Chốt chuẩn vận hành AGENTS cho vlxd (trang này)
- [x] Chốt stack (mục 2.5) và yêu cầu gói dịch vụ

### Đang làm dở
- [ ] Monorepo skeleton (pnpm workspace + turbo)

### Bước tiếp theo
- [ ] `contracts/http/openapi.yaml` khởi tạo
- [ ] `apps/api`: Fastify bootstrap + `/healthz`, kết nối Supabase
- [ ] `apps/web`: Vite + MUI + Router bootstrap
- [ ] `db`: migration đầu tiên + seed (dbmate trên Supabase)
- [ ] `compose.dev.yml` chạy end-to-end
- [ ] CI: `pnpm -r check` + contracts:check + gitleaks
- [ ] Gói dịch vụ: model + enforcement backend + màn chọn gói
- [ ] AI agent (chat + giọng nói) cho Premium/Enterprise
- [ ] OCR hóa đơn viết tay → hóa đơn online
- [ ] Enterprise: định tuyến DB riêng biệt

### Ghi chú / lỗi đang gặp
- `requirements_extracted/` ở root sẽ được chuẩn hoá dần vào `docs/requirements/`.

---

## Mẫu `AGENTS.md` con cho mỗi thư mục chức năng

Đặt trong từng thư mục feature/domain:

```markdown
# AGENTS.md — <tên feature>

## Bối cảnh feature
- Nhiệm vụ: [1-2 dòng]
- Phụ thuộc: [module nào, qua cửa công khai nào]

## Contract (cửa công khai — chốt trước, không đổi giữa chừng)
- [liệt kê hàm/interface export ra ngoài]

## Trạng thái tiến độ
### Đã xong
- [ ] ...
### Đang làm dở
- [ ] ...
### Bước tiếp theo
- [ ] ...
```
