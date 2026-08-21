# Backlog triển khai tuần tự — vlxd

Backlog này được thực thi theo `docs/ai-workflow/README.md`. Mỗi task là một PR độc lập. Mọi task thay đổi API phải sửa OpenAPI trước; thay đổi DB phải có migration reversible; feature phải enforce tenant, permission, service plan và audit ở backend khi áp dụng.

## Công nghệ chuẩn

- Node.js 24.x, pnpm 11.x, TypeScript 5.9+ ESM, Turbo.
- Frontend: React 19, Vite, MUI, React Router 7, TanStack Query 5, react-hook-form, Zod, i18next.
- Backend: Fastify 5, `fastify-type-provider-zod`, Kysely, `pg`, Zod 4, pino.
- Database: Supabase PostgreSQL; dbmate SQL migrations.
- Contract: OpenAPI 3.1; generated TypeScript API client.
- Test: Vitest, Testing Library, testcontainers, Playwright, axe-core.
- CI: GitHub Actions; format, lint, typecheck, tests, build, OpenAPI drift, secret/dependency scan.

---

## TASK-001 — Đối soát trạng thái repo và cô lập prototype

**Mục tiêu:** làm tài liệu phản ánh đúng repo: `app/` là AI Studio frontend prototype, không phải production app.

**Cách làm:** đọc root docs và toàn bộ cấu trúc `app/`; lập inventory chức năng; chọn giải pháp ưu tiên là di chuyển nguyên trạng `app/` sang `prototype/legacy-app/` bằng một commit giữ lịch sử hợp lý, hoặc nếu rủi ro build/hosting chưa rõ thì giữ nguyên và đánh dấu read-only. Cập nhật `AGENTS.md`, root `README.md`, `docs/README.md`; không xóa prototype và không refactor code prototype.

**Công nghệ:** Git, Markdown; không thêm dependency.

**Output:** nguồn sự thật thống nhất; bảng implemented/demo/missing; quyết định rõ production target là `apps/web` + `apps/api`; execution/review logs.

**Acceptance:** không còn câu khẳng định sai “chưa có code”; agent sau không nhầm prototype với production; link tài liệu không hỏng.

**Review focus:** mất file, thay đổi prototype ngoài scope, mâu thuẫn tài liệu.

## TASK-002 — Decision backlog và phạm vi MVP

**Prerequisite:** TASK-001 accepted.

**Mục tiêu:** khóa các quyết định nghiệp vụ trước khi code.

**Cách làm:** tạo `docs/decision-backlog.md`; mỗi mục có ID, owner, status, options, recommendation, trigger và decision record. Bao gồm platform-vs-tenant admin, branch scope, thời điểm reserve/trừ tồn, negative stock/backorder, order state machine, cancel/reverse, partial payment, VAT, costing method, discount approval, credit limit, transfer workflow, archive policy.

**Công nghệ:** Markdown; ADR cho quyết định khó đảo ngược.

**Output:** backlog quyết định có `Accepted`, `Temporary assumption` hoặc `Open`; danh sách blocker trước từng feature.

**Acceptance:** không còn business blocker ẩn; AI không được tự chốt mục `Open`.

## TASK-003 — Requirements MVP theo capability

**Prerequisite:** TASK-002 accepted hoặc các mục liên quan đã được owner chấp nhận.

**Mục tiêu:** viết requirements kiểm thử được.

**Cách làm:** tạo tài liệu cho product, warehouse, inventory, customer/supplier, sales order, delivery/return, payment/debt, purchase, report và audit. Mỗi tài liệu có actors/permissions, scope, state machine, invariants, happy path, failures, concurrency, audit, plan gates, acceptance criteria và out-of-scope.

**Output:** `docs/requirements/*.md` hoàn chỉnh và được link từ `docs/README.md`.

**Acceptance:** acceptance criteria quan sát được; không trộn implementation detail vào business requirement.

## TASK-004 — ADR kiến trúc production

**Prerequisite:** TASK-003 accepted.

**Mục tiêu:** chốt kiến trúc trước scaffold.

**Cách làm:** ADR cho monorepo, Fastify/Kysely/Supabase, opaque session, capability authorization, multi-tenant shared DB, OpenAPI design-first, inventory ledger và money/date/time representation.

**Output:** `docs/adr/NNNN-*.md`, ADR index và architecture overview.

**Acceptance:** dependency direction, trust boundaries, rollback/migration consequences và rejected alternatives rõ ràng.

## TASK-005 — Scaffold monorepo và quality baseline

**Prerequisite:** TASK-004 accepted.

**Mục tiêu:** tạo skeleton production đúng `AGENTS.md` mà không phát minh feature.

**Cách làm:** tạo workspace `apps/web`, `apps/api`, `packages/shared`, `packages/api-client`, config packages, `contracts/http`, `db`, `e2e`; pin Node/pnpm/TypeScript; cấu hình Turbo, strict TS, ESLint, Prettier, Vitest và root commands. Prototype không được copy nguyên vào production app.

**Output:** install/build/typecheck tối thiểu chạy được; `.nvmrc`, `pnpm-workspace.yaml`, `turbo.json`, lockfile, root scripts và AGENTS con.

**Acceptance:** `pnpm install --frozen-lockfile` và baseline checks xanh; không có placeholder business endpoint/table.

## TASK-006 — Sửa GitHub Actions CI

**Prerequisite:** TASK-005 accepted.

**Mục tiêu:** thay workflow hỏng hiện tại.

**Cách làm:** Node 24 + pnpm cache; chạy frozen install, format, lint, typecheck, unit/integration, build, OpenAPI drift và secret/dependency scan; concurrency cancellation; branch rules phù hợp `dev`/`main`.

**Output:** `.github/workflows/ci.yml` hợp lệ, không còn `cd vlxd-app`/`test.js`.

**Acceptance:** CI xanh trên PR mẫu; command local và CI giống nhau về contract.

## TASK-007 — OpenAPI foundation và generated client

**Prerequisite:** TASK-005 accepted.

**Mục tiêu:** thiết lập contract-first.

**Cách làm:** OpenAPI 3.1 cho health, error envelope, pagination, money, date/time, request ID và optimistic version; cấu hình lint/generator; generate `packages/api-client`; thêm drift test. Không thêm business endpoint chưa có requirement.

**Output:** `contracts/http/openapi.yaml`, generated client, lint/generation scripts và docs.

**Acceptance:** generated files không sửa tay; CI phát hiện drift.

## TASK-008 — Database multi-tenant foundation

**Prerequisite:** TASK-004, TASK-005 accepted.

**Mục tiêu:** tạo identity, tenancy, permission, plan và audit schema nền.

**Cách làm:** dbmate migrations cho tenants, users, tenant_users, sessions, titles, role_groups, permissions, mappings, overrides, scopes, audit_logs, tenant_plans; constraints/indexes/grants; UTC timestamps; archive fields; test clean install, rollback và tenant isolation.

**Output:** reversible SQL migrations, deterministic seeds chỉ dùng dữ liệu giả, DB integration tests.

**Acceptance:** tenant A không đọc/ghi tenant B; migration up/down sạch; không secret.

## TASK-009 — Backend platform foundation

**Prerequisite:** TASK-007, TASK-008 accepted.

**Mục tiêu:** Fastify API vận hành an toàn.

**Cách làm:** Zod config, Kysely/pg, request ID, pino redaction, error mapper, graceful shutdown, health/readiness, transaction helper, tenant context; testcontainers integration.

**Output:** runnable `apps/api`, `/health`, platform tests, env example.

**Acceptance:** startup fail-fast khi config sai; không lộ stack/SQL/secret; shutdown đóng connection.

## TASK-010 — Authentication và session

**Prerequisite:** TASK-009 accepted; auth requirement/ADR accepted.

**Mục tiêu:** internal account login bằng opaque server-side session.

**Cách làm:** OpenAPI trước; password hashing; secure cookie; login/logout/current session; expiry/revocation; suspended user; CSRF policy; audit login; frontend login shell sau generated client.

**Output:** migration/contract/backend/frontend/tests.

**Acceptance:** không lưu token nhạy cảm trong localStorage; session fixation/revocation và failure cases được test.

## TASK-011 — Role Management và capability authorization

**Prerequisite:** TASK-010 accepted.

**Mục tiêu:** backend enforce permission và scope.

**Cách làm:** invite/suspend tenant user, title, role group, permission catalog, allow/deny override, tenant/warehouse/own-record scope; authorization hook/use case policy; UI quản lý user/role; audit mọi thay đổi quyền.

**Output:** vertical slice contract->DB->API->generated client->UI->tests.

**Acceptance:** direct API bypass bị từ chối; không hard-code quyền theo title; deny override thắng allow theo policy đã chốt.

## TASK-012 — Service plan enforcement

**Prerequisite:** TASK-009 accepted; service-plan requirements accepted.

**Mục tiêu:** enforce Free/Standard/Premium/Enterprise ở backend.

**Cách làm:** central plan capability config; limits product 80/800 và warehouse 1/unlimited; AI/OCR feature gates; downgrade giữ dữ liệu cũ nhưng chặn tạo mới; stable error codes; admin plan assignment/audit.

**Output:** shared schemas, backend policy, API errors, tests; UI chỉ phản ánh policy.

**Acceptance:** gọi API trực tiếp không bypass limit; enterprise dedicated DB chỉ là explicit unimplemented capability nếu chưa có ADR vận hành.

## TASK-013 — Frontend shell, router và i18n

**Prerequisite:** TASK-007, TASK-010 accepted.

**Mục tiêu:** tạo app shell production, không copy monolithic `App.tsx`.

**Cách làm:** React Router 7, MUI theme tokens, TanStack Query, auth provider, error boundary, capability-aware navigation; i18next `vi` mặc định, `en` fallback; locale preference; centralized Intl formatters; mobile-first shell.

**Output:** `apps/web/src/app`, i18n namespaces, shared UI contracts, tests.

**Acceptance:** không hard-code UI copy; refresh/deep link/back-forward hoạt động; loading/error/not-found/denied states có test.

## TASK-014 — Product catalog vertical slice

**Prerequisite:** TASK-011, TASK-012, TASK-013 accepted.

**Mục tiêu:** product/category/unit/price production-grade.

**Cách làm:** OpenAPI trước; product migration; backend create/read/update/archive/search/filter/sort/paginate; unique SKU per tenant; price history append-only; product limit; permissions/audit; generated client; React Query UI/forms bằng RHF+Zod.

**Output:** feature slices ở API/web, migration, tests và docs.

**Acceptance:** archive thay delete; server authoritative; no localStorage business data; pagination/filter reset đúng; vi/en UI.

## TASK-015 — Warehouse và location

**Prerequisite:** TASK-014 accepted.

**Mục tiêu:** warehouse/location thật, thay chuỗi hard-code.

**Cách làm:** CRUD/archive warehouse/location; plan limit; warehouse scope; tenant isolation; capacity metadata chỉ khi requirement có; contract-first vertical slice.

**Output:** DB/API/client/UI/tests.

**Acceptance:** Free/Standard không tạo warehouse thứ hai; user ngoài scope không truy cập kho.

## TASK-016 — Inventory ledger

**Prerequisite:** TASK-015 accepted; inventory decisions accepted.

**Mục tiêu:** nguồn sự thật tồn kho bất biến và concurrency-safe.

**Cách làm:** stock balance theo product+warehouse; append-only movement ledger; stock-in/out/transfer/stocktake/adjustment/reserve/release/reverse; transaction + lock/version; idempotency; không sửa quantity trực tiếp; permission/approval/audit.

**Output:** schema, use cases, API, UI, integration/concurrency tests.

**Acceptance:** transfer giảm nguồn tăng đích atomically; retry không nhân đôi; reverse tạo movement bù; không mất update đồng thời.

## TASK-017 — Customer và supplier

**Prerequisite:** TASK-013 accepted.

**Mục tiêu:** master data khách hàng/NCC có archive, credit và search.

**Cách làm:** contract-first CRUD/archive, customer type, addresses/projects, credit limit, supplier contacts, tenant isolation, permissions/audit, pagination.

**Output:** DB/API/client/UI/tests.

**Acceptance:** không hard delete entity đã được chứng từ tham chiếu; PII không xuất hiện trong log.

## TASK-018 — Quotation và sales order

**Prerequisite:** TASK-014, TASK-016, TASK-017 accepted.

**Mục tiêu:** quotation/order state machine liên kết reservation.

**Cách làm:** quotation->order; price snapshot; reserve stock ở transition đã chốt; validate tồn; edit reconcile reservation; discount policy; optimistic concurrency; cancel/release/reverse; delivery info; audit.

**Output:** complete vertical slice và E2E happy/conflict paths.

**Acceptance:** sửa/hủy đơn không làm lệch tồn; không tự coi hoàn tất là đã thu đủ; không bán vượt tồn trừ khi backorder được accepted.

## TASK-019 — Delivery, stock-out và return

**Prerequisite:** TASK-018 accepted.

**Mục tiêu:** giao hàng và xuất kho tách khỏi payment.

**Cách làm:** delivery note, partial delivery, stock-out, confirmation, return và return condition; reverse/cancel; proof-of-delivery chỉ khi requirement chốt; permission/audit.

**Output:** contract/DB/API/UI/tests/printable delivery note.

**Acceptance:** partial delivery và return giữ ledger cân bằng; completed delivery không tự tạo payment.

## TASK-020 — Payment và debt ledger

**Prerequisite:** TASK-017, TASK-018 accepted.

**Mục tiêu:** thay thao tác trừ trực tiếp số nợ bằng ledger tài chính.

**Cách làm:** payment/receipt, method, partial payment, allocation, receivable/payable entries, reversal, reconciliation; money decimal; finance permissions; audit.

**Output:** DB/API/client/UI/tests và phiếu thu/chi.

**Acceptance:** balance được suy ra từ ledger; overpayment/race/reversal được xử lý; không dùng float cho tiền ở backend/DB.

## TASK-021 — Purchase và receiving

**Prerequisite:** TASK-016, TASK-017, TASK-020 accepted.

**Mục tiêu:** purchase order, nhận hàng, supplier payable và cost update.

**Cách làm:** PO state machine, partial receiving, stock-in integration, purchase invoice, payable, cancel/reverse; costing policy theo decision; separation of duties.

**Output:** vertical slice + integration/E2E tests.

**Acceptance:** receiving và stock movement atomic; supplier debt khớp invoice/payment ledger.

## TASK-022 — Reporting

**Prerequisite:** TASK-016, TASK-018, TASK-020, TASK-021 accepted.

**Mục tiêu:** báo cáo từ business events/ledger thật.

**Cách làm:** revenue, cash collected, receivable/payable, inventory valuation, realized gross profit, low stock, employee performance; date/warehouse filters; export permission; query/performance budgets.

**Output:** report APIs, UI, tests với fixture cố định.

**Acceptance:** loại đúng draft/cancelled; không KPI hard-code; tiền/date format theo locale.

## TASK-023 — Import/export production-grade

**Prerequisite:** TASK-014, TASK-017 accepted; file contract decision accepted.

**Mục tiêu:** thay parser CSV thủ công và tuyên bố `.xlsx` sai.

**Cách làm:** server-side bounded import hoặc signed upload theo ADR; robust CSV và `.xlsx` chỉ khi dependency được approved; preview/validation/dedup; row limits; downloadable error report; correct CSV escaping; permission/plan/audit.

**Output:** file contract, importer/exporter, UI, security/tests.

**Acceptance:** quoted comma/newline/UTF-8/duplicate/malformed/oversize cases được test; không cần public Google Sheet mặc định.

## TASK-024 — Settings, numbering và print templates

**Prerequisite:** TASK-013, TASK-018 accepted.

**Mục tiêu:** loại bỏ thông tin cửa hàng hard-code khỏi phiếu in.

**Cách làm:** tenant settings, tax/bank/contact, document numbering, warehouse thresholds, credit/profit alerts; printable templates dùng settings; permission/audit; print CSS tests.

**Output:** settings vertical slice và mẫu in order/delivery/receipt.

**Acceptance:** thay settings phản ánh trên bản in; sequence không trùng khi concurrent.

## TASK-025 — Yard map và unit converter hardening

**Prerequisite:** TASK-015, TASK-016 accepted.

**Mục tiêu:** biến tiện ích prototype thành feature có dữ liệu thật hoặc loại khỏi MVP.

**Cách làm:** yard zone/location/capacity từ DB, không hard-code; accessible list fallback. Tách công thức converter thành pure functions, unit test, validation và nguồn/assumption; không tuyên bố TCVN nếu chưa có bằng chứng chuyên môn.

**Output:** accepted feature hoặc ADR ghi rõ hoãn; tests và docs.

**Acceptance:** nút không dùng `alert()` giả; mobile/keyboard usable; formula edge cases được test.

## TASK-026 — Accessibility, responsive và visual QA

**Prerequisite:** các UI slice MVP hoàn tất.

**Mục tiêu:** WCAG 2.2 AA và viewport production baseline.

**Cách làm:** semantic dialogs, focus trap/restore, keyboard tables, `aria-sort`, form errors, reduced motion, dark theme tokens, iPhone/desktop/zoom 200%; Playwright + axe; visual review record.

**Output:** automated tests, fixes, QA matrix.

**Acceptance:** critical axe violations bằng 0; keyboard-only hoàn thành workflow chính.

## TASK-027 — Security, E2E, deployment readiness

**Prerequisite:** toàn bộ MVP slices accepted.

**Mục tiêu:** ship gate trước staging/production.

**Cách làm:** tenant/permission negative tests, CSRF, session security, rate/file limits, secret/dependency/container scans, PII redaction, backup/restore, migration deploy/rollback, health/readiness, observability; E2E login->product->stock-in->order->delivery->partial payment->debt->reverse.

**Output:** CI ship gate, threat-model updates, runbooks, staging evidence.

**Acceptance:** không BLOCKER/HIGH security finding; backup restore được diễn tập; clean environment deploy và E2E xanh.

---

## Sau MVP — không bắt đầu khi TASK-027 chưa accepted

- OCR hóa đơn: upload contract, async job, correction workflow, retention, Premium/Enterprise gate.
- AI chat/voice: permission-safe tools, confirmation cho hành động tiền/hàng, transcript/retention/audit, cost controls.
- Enterprise dedicated DB: provisioning, tenant routing, schema compatibility, backup/recovery và secrets runbook.
