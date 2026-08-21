# Backlog triển khai — vlxd (v2: milestone + lane song song)

> Bản viết lại từ backlog tuần tự ban đầu. Giữ nguyên kỷ luật **contract-first** và **foundation-first**, nhưng bổ sung 5 thay đổi:
> 1. Chia thành **milestone** demo-được (M0–M4).
> 2. Cho phép các **lane chạy song song** sau khi nền tảng xong.
> 3. **Chẻ các task-epic** thành sub-PR review được.
> 4. Thêm **SLA quyết định** để không nghẽn cả backlog.
> 5. Kéo **staging smoke + observability + secret scan** lên sớm.
>
> Mỗi task vẫn là một PR độc lập. Thay đổi API phải sửa OpenAPI trước; thay đổi DB phải có migration reversible; feature phải enforce tenant, permission, service plan và audit ở backend khi áp dụng.

---

## Mô hình thực thi

- **Đơn vị giao hàng:** 1 PR nhỏ, review được (ưu tiên < ~400 dòng thay đổi thực chất). Task lớn phải chẻ theo sub-ID (vd `TASK-016a`).
- **Pipeline 2 bot** giữ nguyên theo `docs/ai-workflow/README.md`: implementer → reviewer.
- **Lane** (tuyến công việc chạy song song khi prerequisite đã `accepted`):
  - `LANE-CORE` — nền tảng, tuần tự nghiêm ngặt, không song song trong nội bộ lane.
  - `LANE-CATALOG` — product, warehouse, inventory.
  - `LANE-CRM` — customer, supplier.
  - `LANE-COMMERCE` — order, delivery, payment, purchase.
  - `LANE-PLATFORMUI` — app shell, i18n, settings, report, import/export.
  - `LANE-QUALITY` — accessibility, security, E2E (chạy tăng dần, không dồn cuối).
- **WIP limit:** tối đa 1 task `active` mỗi lane; nhiều lane có thể active đồng thời.
- **Decision SLA:** mọi mục `Open` trong `docs/decision-backlog.md` phải có `temporary assumption` để không chặn code. Owner chốt trong ≤ 2 ngày làm việc; quá hạn thì dùng assumption và ghi rủi ro vào task. AI vẫn **không** được tự chuyển `Open` → `Accepted`.
- **CURRENT.md** mở rộng thành bảng nhiều dòng: mỗi lane một dòng task `active`, kèm milestone.

## Milestones

| Mốc | Tên | Nội dung | Tiêu chí demo |
| --- | --- | --- | --- |
| **M0** | Foundation guardrails | repo audit, decisions, requirements, ADR, scaffold, CI, staging smoke | `pnpm install` + baseline checks xanh; staging chạy `/health` + web shell rỗng |
| **M1** | Platform core | OpenAPI, DB multi-tenant, backend platform + observability, auth, role/authz, plan enforce, frontend shell/i18n | Login thật, phân quyền enforce ở backend, shell song ngữ vi/en |
| **M2** | Master data | product, warehouse, customer/supplier | CRUD master data thật, không còn mock/localStorage |
| **M3** | Commerce & finance | inventory ledger, order, delivery/return, payment/debt, purchase | Chuỗi bán hàng → xuất kho → thu tiền chạy E2E |
| **M4** | Insights & hardening | report, import/export, settings/print, yard/converter, a11y, security/E2E ship gate | Báo cáo từ ledger thật; ship gate không BLOCKER/HIGH |

## Sơ đồ phụ thuộc rút gọn

```text
M0: 001→002→003→004→005→006→006b        (LANE-CORE, tuần tự)
M1: 005→007 ; 005→008a→008b→008c ; 007+008c→009(+obs) ; 009→010a→010b
    009+010* → 011a→011b→011c→011d ; 009→012 ; 007+010b→013
M2: 014a→{014b,014c} ; 014a→015 (LANE-CATALOG) ‖ 013→017 (LANE-CRM)
M3: 015+016 decisions→016a→016b→016c→016d
    014+016+017→018a→018b→018c→018d→018e→019
    017+018→020a→020b→020c ; 016+017+020→021
M4: 016+018+020+021→022 ; 014+017→023 ; 013+018→024 ; 015+016→025
    LANE-QUALITY: 026 chạy tăng dần theo từng UI slice ; 027 ship gate cuối
```

## Công nghệ chuẩn

- Node.js 24.x, pnpm 11.x, TypeScript 5.9+ ESM, Turbo.
- Frontend: React 19, Vite, MUI, React Router 7, TanStack Query 5, react-hook-form, Zod, i18next.
- Backend: Fastify 5, `fastify-type-provider-zod`, Kysely, `pg`, Zod 4, pino.
- Database: Supabase PostgreSQL; dbmate SQL migrations.
- Contract: OpenAPI 3.1; generated TypeScript API client.
- Test: Vitest, Testing Library, testcontainers, Playwright, axe-core.
- CI: GitHub Actions; format, lint, typecheck, tests, build, OpenAPI drift, secret/dependency scan.

---

# M0 — Foundation guardrails · `LANE-CORE`

## TASK-001 — Đối soát trạng thái repo và cô lập prototype

**Lane:** CORE · **Prerequisite:** —

**Mục tiêu:** làm tài liệu phản ánh đúng repo: `app/` là AI Studio frontend prototype, không phải production app.

**Cách làm:** đọc root docs và toàn bộ cấu trúc `app/`; lập inventory chức năng; ưu tiên di chuyển nguyên trạng `app/` sang `prototype/legacy-app/` bằng một commit giữ lịch sử, hoặc nếu rủi ro build/hosting chưa rõ thì giữ nguyên và đánh dấu read-only. Cập nhật `AGENTS.md`, root `README.md`, `docs/README.md`; không xóa prototype và không refactor code prototype.

**Output:** nguồn sự thật thống nhất; bảng implemented/demo/missing; quyết định rõ production target là `apps/web` + `apps/api`; execution/review logs.

**Acceptance:** không còn khẳng định sai “chưa có code”; agent sau không nhầm prototype với production; link tài liệu không hỏng.

## TASK-002 — Decision backlog và phạm vi MVP

**Lane:** CORE · **Prerequisite:** TASK-001 accepted

**Mục tiêu:** khóa quyết định nghiệp vụ trước khi code.

**Cách làm:** tạo `docs/decision-backlog.md`; mỗi mục có ID, owner, status, options, recommendation, trigger, decision record **và `temporary assumption` bắt buộc cho mục `Open`**. Bao gồm platform-vs-tenant admin, branch scope, thời điểm reserve/trừ tồn, negative stock/backorder, order state machine, cancel/reverse, partial payment, VAT, costing method, discount approval, credit limit, transfer workflow, archive policy.

**Output:** backlog quyết định có `Accepted`, `Temporary assumption` hoặc `Open`; danh sách blocker trước từng feature; **SLA chốt ≤ 2 ngày làm việc**.

**Acceptance:** không còn business blocker cứng; mọi mục `Open` đều có assumption an toàn; AI không tự chốt `Open`.

## TASK-003 — Requirements MVP theo capability

**Lane:** CORE · **Prerequisite:** TASK-002 accepted (hoặc các mục liên quan đã có assumption/accepted)

**Mục tiêu:** viết requirements kiểm thử được cho product, warehouse, inventory, customer/supplier, sales order, delivery/return, payment/debt, purchase, report, audit. Mỗi tài liệu có actors/permissions, scope, state machine, invariants, happy path, failures, concurrency, audit, plan gates, acceptance criteria, out-of-scope.

**Output:** `docs/requirements/*.md` hoàn chỉnh, link từ `docs/README.md`.

**Acceptance:** acceptance criteria quan sát được; không trộn implementation detail vào business requirement.

## TASK-004 — ADR kiến trúc production

**Lane:** CORE · **Prerequisite:** TASK-003 accepted

**Mục tiêu:** chốt kiến trúc trước scaffold. ADR cho monorepo, Fastify/Kysely/Supabase, opaque session, capability authorization, multi-tenant shared DB, **định hướng sớm cho tenant routing/enterprise dedicated DB**, OpenAPI design-first, inventory ledger, money/date/time representation.

**Output:** `docs/adr/NNNN-*.md`, ADR index, architecture overview.

**Acceptance:** dependency direction, trust boundaries, rollback/migration consequences, rejected alternatives rõ ràng.

## TASK-005 — Scaffold monorepo và quality baseline

**Lane:** CORE · **Prerequisite:** TASK-004 accepted

**Mục tiêu:** skeleton production đúng `AGENTS.md`, không phát minh feature. Tạo `apps/web`, `apps/api`, `packages/shared`, `packages/api-client`, config packages, `contracts/http`, `db`, `e2e`; pin Node/pnpm/TypeScript; Turbo, strict TS, ESLint, Prettier, Vitest, root commands. Prototype không copy nguyên vào production.

**Acceptance:** `pnpm install --frozen-lockfile` và baseline checks xanh; không có placeholder business endpoint/table.

## TASK-006 — GitHub Actions CI + secret/dependency scan baseline

**Lane:** CORE · **Prerequisite:** TASK-005 accepted

**Mục tiêu:** thay workflow hỏng; **đưa secret/dependency scan vào ngay từ nền tảng** (không chờ ship gate). Node 24 + pnpm cache; frozen install, format, lint, typecheck, unit/integration, build, OpenAPI drift, secret + dependency scan; concurrency cancellation; branch rules cho `dev`/`main`.

**Output:** `.github/workflows/ci.yml` hợp lệ, không còn `cd vlxd-app`/`test.js`.

**Acceptance:** CI xanh trên PR mẫu; command local và CI khớp contract; scan chạy trên mọi PR.

## TASK-006b — Staging smoke deploy (MỚI)

**Lane:** CORE · **Prerequisite:** TASK-005 accepted, TASK-006 accepted

**Mục tiêu:** rút ngắn vòng phản hồi: có môi trường staging tối thiểu từ rất sớm.

**Cách làm:** pipeline deploy staging cho `apps/api` (`/health`) và `apps/web` (shell rỗng); config qua env/secret manager, không hard-code; smoke test tự động sau deploy; rollback đơn giản.

**Acceptance:** mỗi merge vào `dev` deploy staging tự động; smoke `/health` + tải shell xanh; không secret trong log/artifact.

---

# M1 — Platform core

## TASK-007 — OpenAPI foundation và generated client · `LANE-CORE`

**Prerequisite:** TASK-005 accepted

OpenAPI 3.1 cho health, error envelope, pagination, money, date/time, request ID, optimistic version; lint/generator; generate `packages/api-client`; drift test. Không thêm business endpoint chưa có requirement.

**Acceptance:** generated files không sửa tay; CI phát hiện drift.

## TASK-008 — Database multi-tenant foundation · `LANE-CORE` (chẻ 3 PR)

**Prerequisite:** TASK-004, TASK-005 accepted

- **TASK-008a — Identity & tenancy:** migrations `tenants`, `users`, `tenant_users`, `sessions`; UTC timestamps; archive fields; test clean install + rollback.
- **TASK-008b — Permission & scope:** `titles`, `role_groups`, `permissions`, mappings, overrides, scopes; constraints/indexes/grants.
- **TASK-008c — Audit & plan:** `audit_logs`, `tenant_plans`; deterministic seeds chỉ dùng dữ liệu giả; tenant isolation test.

**Acceptance chung:** tenant A không đọc/ghi tenant B; migration up/down sạch; không secret.

## TASK-009 — Backend platform foundation + observability · `LANE-CORE`

**Prerequisite:** TASK-007, TASK-008c accepted

Fastify + Zod config, Kysely/pg, request ID, **pino redaction + structured logging + health/readiness (observability baseline kéo lên đây)**, error mapper, graceful shutdown, transaction helper, tenant context; testcontainers integration.

**Acceptance:** startup fail-fast khi config sai; không lộ stack/SQL/secret; shutdown đóng connection; log có request-id, PII redacted.

## TASK-010 — Authentication và session · `LANE-CORE` (chẻ 2 PR)

**Prerequisite:** TASK-009 accepted; auth requirement/ADR accepted

- **TASK-010a — Backend auth:** OpenAPI trước; password hashing; opaque server-side session; secure cookie; login/logout/current session; expiry/revocation; suspended user; CSRF policy; audit login.
- **TASK-010b — Frontend login shell:** dùng generated client; form login; xử lý session state; không lưu token nhạy cảm ở localStorage.

**Acceptance:** session fixation/revocation và failure cases được test; token nhạy cảm không ở localStorage.

## TASK-011 — Role Management và capability authorization · `LANE-CORE` (chẻ 4 PR)

**Prerequisite:** TASK-010 accepted

- **TASK-011a — Authorization engine:** permission catalog + authorization hook/use-case policy; deny-override thắng allow theo policy đã chốt.
- **TASK-011b — Tenant user lifecycle:** invite/suspend tenant user, gán title/role group (contract-first).
- **TASK-011c — Override & scope:** allow/deny override, tenant/warehouse/own-record scope.
- **TASK-011d — UI quản lý user/role:** vertical slice UI + audit mọi thay đổi quyền.

**Acceptance:** direct API bypass bị từ chối; không hard-code quyền theo title; deny override thắng allow.

## TASK-012 — Service plan enforcement · `LANE-CORE` (song song sau 009)

**Prerequisite:** TASK-009 accepted; service-plan requirements accepted

Central plan capability config; product 80/800, warehouse 1/unlimited; AI/OCR feature gates; downgrade giữ dữ liệu cũ nhưng chặn tạo mới; stable error codes; admin plan assignment/audit.

**Acceptance:** gọi API trực tiếp không bypass limit; enterprise dedicated DB chỉ là explicit unimplemented capability nếu chưa có ADR vận hành.

## TASK-013 — Frontend shell, router và i18n · `LANE-PLATFORMUI`

**Prerequisite:** TASK-007, TASK-010b accepted

React Router 7, MUI theme tokens, TanStack Query, auth provider, error boundary, capability-aware navigation; i18next `vi` mặc định, `en` fallback; locale preference; centralized Intl formatters; mobile-first shell. Không copy monolithic `App.tsx`.

**Acceptance:** không hard-code UI copy; refresh/deep link/back-forward hoạt động; loading/error/not-found/denied states có test.

---

# M2 — Master data (các lane chạy song song)

## TASK-014 — Product catalog · `LANE-CATALOG` (chẻ 3 PR)

**Prerequisite:** TASK-011 (ít nhất 011a+011b), TASK-012, TASK-013 accepted

- **TASK-014a — Contract + DB + backend core:** OpenAPI trước; product migration; create/read/update/archive/search/filter/sort/paginate; unique SKU per tenant; permissions/audit; generated client.
- **TASK-014b — Price history append-only:** bảng lịch sử giá append-only + enforce product limit theo plan.
- **TASK-014c — UI:** React Query UI/forms bằng RHF+Zod; vi/en.

**Acceptance:** archive thay delete; server authoritative; no localStorage business data; pagination/filter reset đúng.

## TASK-015 — Warehouse và location · `LANE-CATALOG`

**Prerequisite:** TASK-014a accepted

CRUD/archive warehouse/location; plan limit; warehouse scope; tenant isolation; capacity metadata chỉ khi requirement có; contract-first vertical slice.

**Acceptance:** Free/Standard không tạo warehouse thứ hai; user ngoài scope không truy cập kho.

## TASK-017 — Customer và supplier · `LANE-CRM` (song song với CATALOG)

**Prerequisite:** TASK-013 accepted

Contract-first CRUD/archive, customer type, addresses/projects, credit limit, supplier contacts, tenant isolation, permissions/audit, pagination.

**Acceptance:** không hard delete entity đã được chứng từ tham chiếu; PII không xuất hiện trong log.

---

# M3 — Commerce & finance · `LANE-COMMERCE`

## TASK-016 — Inventory ledger (chẻ 4 PR)

**Prerequisite:** TASK-015 accepted; inventory decisions accepted

- **TASK-016a — Balance & schema:** stock balance theo product+warehouse; schema nền; không sửa quantity trực tiếp.
- **TASK-016b — Core movements:** stock-in/out/transfer/stocktake/adjustment append-only ledger.
- **TASK-016c — Reserve & safety:** reserve/release/reverse; transaction + lock/version; idempotency; permission/approval/audit.
- **TASK-016d — UI + tests:** UI + integration/concurrency tests.

**Acceptance:** transfer giảm nguồn tăng đích atomically; retry không nhân đôi; reverse tạo movement bù; không mất update đồng thời.

## TASK-018 — Quotation và sales order (chẻ 5 PR)

**Prerequisite:** TASK-014, TASK-016, TASK-017 accepted

- **TASK-018a — Quotation:** báo giá + price snapshot.
- **TASK-018b — Order state machine:** quotation→order; state machine; validate tồn.
- **TASK-018c — Reservation integration:** reserve stock ở transition đã chốt; optimistic concurrency.
- **TASK-018d — Discount & lifecycle:** discount policy; edit reconcile reservation; cancel/release/reverse; delivery info; audit.
- **TASK-018e — UI + E2E:** vertical slice UI + E2E happy/conflict paths.

**Acceptance:** sửa/hủy đơn không lệch tồn; không tự coi hoàn tất là đã thu đủ; không bán vượt tồn trừ khi backorder accepted.

## TASK-019 — Delivery, stock-out và return

**Prerequisite:** TASK-018 accepted

Delivery note, partial delivery, stock-out, confirmation, return + return condition; reverse/cancel; proof-of-delivery chỉ khi requirement chốt; permission/audit; printable delivery note.

**Acceptance:** partial delivery và return giữ ledger cân bằng; completed delivery không tự tạo payment.

## TASK-020 — Payment và debt ledger (chẻ 3 PR)

**Prerequisite:** TASK-017, TASK-018 accepted

- **TASK-020a — Ledger & money:** receivable/payable entries; money decimal (không float ở backend/DB).
- **TASK-020b — Payment ops:** payment/receipt, method, partial payment, allocation, reversal, reconciliation; finance permissions; audit.
- **TASK-020c — UI + chứng từ:** UI + phiếu thu/chi.

**Acceptance:** balance suy ra từ ledger; overpayment/race/reversal xử lý đúng; không float cho tiền.

## TASK-021 — Purchase và receiving

**Prerequisite:** TASK-016, TASK-017, TASK-020 accepted

PO state machine, partial receiving, stock-in integration, purchase invoice, payable, cancel/reverse; costing policy theo decision; separation of duties.

**Acceptance:** receiving và stock movement atomic; supplier debt khớp invoice/payment ledger.

---

# M4 — Insights & hardening

## TASK-022 — Reporting · `LANE-PLATFORMUI`

**Prerequisite:** TASK-016, TASK-018, TASK-020, TASK-021 accepted

Revenue, cash collected, receivable/payable, inventory valuation, realized gross profit, low stock, employee performance; date/warehouse filters; export permission; query/performance budgets.

**Acceptance:** loại đúng draft/cancelled; không KPI hard-code; tiền/date format theo locale.

## TASK-023 — Import/export production-grade · `LANE-PLATFORMUI`

**Prerequisite:** TASK-014, TASK-017 accepted; file contract decision accepted

Server-side bounded import hoặc signed upload theo ADR; robust CSV và `.xlsx` chỉ khi dependency approved; preview/validation/dedup; row limits; downloadable error report; correct CSV escaping; permission/plan/audit.

**Acceptance:** quoted comma/newline/UTF-8/duplicate/malformed/oversize được test; không cần public Google Sheet mặc định.

## TASK-024 — Settings, numbering và print templates · `LANE-PLATFORMUI`

**Prerequisite:** TASK-013, TASK-018 accepted

Tenant settings, tax/bank/contact, document numbering, warehouse thresholds, credit/profit alerts; printable templates dùng settings; permission/audit; print CSS tests.

**Acceptance:** thay settings phản ánh trên bản in; sequence không trùng khi concurrent.

## TASK-025 — Yard map và unit converter hardening · `LANE-CATALOG`

**Prerequisite:** TASK-015, TASK-016 accepted

Yard zone/location/capacity từ DB, không hard-code; accessible list fallback. Tách converter thành pure functions, unit test, validation, nguồn/assumption; không tuyên bố TCVN nếu chưa có bằng chứng.

**Acceptance:** nút không dùng `alert()` giả; mobile/keyboard usable; formula edge cases được test.

## TASK-026 — Accessibility, responsive và visual QA · `LANE-QUALITY` (tăng dần)

**Prerequisite:** áp dụng **tăng dần cho từng UI slice** (013, 014c, 017, 018e, ...) thay vì dồn cuối; tổng kết khi các UI slice MVP hoàn tất.

Semantic dialogs, focus trap/restore, keyboard tables, `aria-sort`, form errors, reduced motion, dark theme tokens, iPhone/desktop/zoom 200%; Playwright + axe; visual review record.

**Acceptance:** critical axe violations = 0; keyboard-only hoàn thành workflow chính.

## TASK-027 — Security, E2E, deployment readiness (ship gate) · `LANE-QUALITY`

**Prerequisite:** toàn bộ MVP slices accepted

Tenant/permission negative tests, CSRF, session security, rate/file limits, secret/dependency/container scans, PII redaction, backup/restore, migration deploy/rollback, health/readiness, observability; E2E login→product→stock-in→order→delivery→partial payment→debt→reverse.

**Acceptance:** không BLOCKER/HIGH security finding; backup restore diễn tập được; clean environment deploy và E2E xanh.

---

## Sau MVP — không bắt đầu khi TASK-027 chưa accepted

- OCR hóa đơn: upload contract, async job, correction workflow, retention, Premium/Enterprise gate.
- AI chat/voice: permission-safe tools, confirmation cho hành động tiền/hàng, transcript/retention/audit, cost controls.
- Enterprise dedicated DB: provisioning, tenant routing, schema compatibility, backup/recovery, secrets runbook (ADR định hướng đã đặt ở TASK-004).
