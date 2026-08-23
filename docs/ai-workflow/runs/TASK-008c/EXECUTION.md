# Execution log — TASK-008c

## Metadata

- Task: TASK-008c — Audit logs & tenant plans migrations, deterministic seeds & isolation test
- Lane: LANE-CORE
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-008c-audit-and-plan-migrations`
- Base commit: `818c5c0`
- Started at (UTC): 2026-08-23T06:40:00Z
- Status: in_progress

## Inputs đã đọc

- [x] Root `AGENTS.md` (Mục 0, 1, 2, 3, 6, 7)
- [x] `db/AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001, DEC-002, DEC-003, DEC-004, DEC-005, DEC-006, DEC-013)
- [x] Requirements liên quan (`docs/requirements/service-plans.md`, `docs/requirements/audit.md`, `docs/requirements/role-management.md`)
- [x] ADR liên quan (`docs/adr/0004-database-and-data-access.md`, `docs/adr/0005-multi-tenancy-isolation.md`, `docs/adr/0007-immutable-ledgers-and-state-machines.md`, `docs/adr/0009-service-plans-enforcement.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-008--database-multi-tenant-foundation--lane-core-chẻ-3-pr`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Thiết lập migration SQL thuần túy (dbmate compliant) cho 2 bảng nền tảng Audit & Service Plans:
  - `tenant_plans`: Quản lý gói dịch vụ và hạn mức tài nguyên theo tenant (`id`, `tenant_id`, `plan_code`, `status`, `max_products`, `max_warehouses`, `features`, `started_at`, `expires_at`, `created_at`, `updated_at`, `archived_at`).
  - `audit_logs`: Bảng nhật ký kiểm toán bất biến (WORM / append-only) (`id`, `tenant_id`, `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `ip_address`, `user_agent`, `request_id`, `created_at`).
- Đảm bảo toàn bộ timestamps là UTC (`timestamptz DEFAULT timezone('utc'::text, now())`).
- Đảm bảo migration có cả phần `-- migrate:up` và `-- migrate:down` reversible hoàn chỉnh.
- Xây dựng deterministic seed data tại `db/seeds/deterministic_seeds.sql` chỉ dùng dữ liệu giả (fake data only, không chứa secret/production credentials) gồm:
  - Standard role groups (`SUPER_ADMIN`, `SYSTEM_ADMIN`, `SUPPORT_ADMIN`, `USER`).
  - Permissions catalog cốt lõi hệ thống.
  - Role group permission mappings.
  - Standard titles templates.
  - Mock demo tenants, users, tenant memberships và tenant plans.
- Cập nhật Kysely TypeScript interfaces cho database schema trong `apps/api/src/platform/db/schema.ts`.
- Mở rộng automated tests trong `apps/api/src/__tests__/migrations.test.ts` kiểm tra các bảng mới, foreign key constraints, indexes và reversibility.
- Xây dựng test suite `apps/api/src/__tests__/tenant-isolation.test.ts` kiểm chứng nguyên tắc cô lập multi-tenant: Tenant A tuyệt đối không truy cập hoặc sửa đổi dữ liệu Tenant B.

### Ngoài phạm vi

- Business feature tables (Product, Warehouse, Order...).
- Backend auth controller & cookies (thuộc TASK-010).

## Kế hoạch trước khi sửa

1. Cập nhật `docs/tasks/CURRENT.md` sang `in_progress`.
2. Tạo `EXECUTION.md` và `REVIEW.md` cho `TASK-008c`.
3. Tạo migration file `db/migrations/20260823000003_create_audit_logs_and_plans.sql` với `-- migrate:up` và `-- migrate:down`.
4. Tạo file deterministic seed data `db/seeds/deterministic_seeds.sql`.
5. Cập nhật database schema TypeScript types cho Kysely tại `apps/api/src/platform/db/schema.ts`.
6. Cập nhật test suite `apps/api/src/__tests__/migrations.test.ts` và tạo `apps/api/src/__tests__/tenant-isolation.test.ts`.
7. Chạy toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`).
8. Mở PR vào `dev`, cập nhật `CURRENT.md` và `EXECUTION.md`, tiến hành review.

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                                           | Căn cứ                                          | Ảnh hưởng                                       |
| ---------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| 2026-08-23 | Dùng UUID v4 (`gen_random_uuid()`) làm primary key                                                 | ADR-0004 & DEC-002                              | Khóa chính chuẩn hóa đồng nhất                  |
| 2026-08-23 | Timestamps dùng `timestamptz` với `timezone('utc'::text, now())`                                   | ADR-0004 & `db/AGENTS.md`                       | Chuẩn hóa thời gian toàn hệ thống theo UTC      |
| 2026-08-23 | `audit_logs` là append-only, lưu snapshot `before_state` và `after_state` dưới dạng JSONB          | ADR-0007 & `docs/requirements/audit.md`         | Đảm bảo khả năng truy vết và kiểm toán bất biến |
| 2026-08-23 | `tenant_plans` lưu hạn mức `max_products`, `max_warehouses` và cờ tính năng `features` theo tenant | ADR-0009 & `docs/requirements/service-plans.md` | Hỗ trợ kiểm soát hạn mức gói dịch vụ ở backend  |
| 2026-08-23 | Seeds chỉ dùng dữ liệu giả, password hash dùng mock/deterministic hash an toàn                     | AGENTS.md Mục 0 ("Không secret trong repo")     | Đảm bảo tính an toàn bảo mật cho repo           |

## Thay đổi đã thực hiện

| File/khu vực                                                   | Thay đổi                                                                      | Lý do                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `db/migrations/20260823000003_create_audit_logs_and_plans.sql` | Tạo migration SQL cho `tenant_plans` và `audit_logs`                          | CSDL quản lý gói dịch vụ và nhật ký kiểm toán |
| `db/seeds/deterministic_seeds.sql`                             | Tạo seed SQL giả lập dữ liệu chuẩn (roles, permissions, titles, demo tenants) | Phục vụ kiểm thử và khởi tạo môi trường dev   |
| `apps/api/src/platform/db/schema.ts`                           | Khai báo Kysely Database schema interfaces cho các bảng mới                   | Type safety cho tầng Data Access              |
| `apps/api/src/__tests__/migrations.test.ts`                    | Automated test suite kiểm tra migration mới và SQL DDL                        | Đảm bảo reversibility và constraints          |
| `apps/api/src/__tests__/tenant-isolation.test.ts`              | Test suite kiểm chứng nguyên tắc cô lập multi-tenant                          | Đảm bảo an toàn phân tách dữ liệu đa thuê bao |
| `docs/tasks/CURRENT.md`                                        | Cập nhật tiến độ TASK-008c                                                    | Quản lý tiến độ                               |
| `docs/ai-workflow/runs/TASK-008c/EXECUTION.md`                 | Hoàn thiện execution log                                                      | Ghi nhận thực thi                             |
| `docs/ai-workflow/runs/TASK-008c/REVIEW.md`                    | Khởi tạo review report                                                        | Chuẩn bị hồ sơ review                         |

## Migration/contract/generated artifacts

- `db/migrations/20260823000003_create_audit_logs_and_plans.sql`: Pure SQL migration (up & down).
- `db/seeds/deterministic_seeds.sql`: Deterministic seed data.

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code                    | Ghi chú                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                     | Exit code 0 (6/6 turbo tasks passed) | Vitest chạy 16 tests trong `apps/api` (bao gồm 6 migration/seeds tests trong `migrations.test.ts` và 5 tenant isolation tests trong `tenant-isolation.test.ts`), 5 tests `api-client`, 6 `shared`, 2 `web` |
| `pnpm run check`                | Exit code 0                          | Quality gate đầy đủ: check drift, lint, typecheck, test, build (18/18 turbo tasks), prettier check                                                                                                         |
| `pnpm audit --audit-level=high` | Exit code 0                          | 0 lỗ hổng bảo mật                                                                                                                                                                                          |

## Self-review

- [x] Migration có cả `-- migrate:up` và `-- migrate:down` tuân thủ chuẩn `dbmate`.
- [x] Mọi cột thời gian dùng `timestamptz` UTC (`timezone('utc'::text, now())`).
- [x] Bảng `audit_logs` và `tenant_plans` liên kết foreign keys chuẩn xác tới `tenants` và `users`.
- [x] Seeds (`db/seeds/deterministic_seeds.sql`) chỉ chứa dữ liệu giả lập, không có secret/credential thật.
- [x] Test suite `tenant-isolation.test.ts` kiểm tra và chứng minh phân lập đa tenant chặt chẽ (Tenant A không thể đọc/sửa dữ liệu Tenant B).
- [x] Không thêm các bảng ngoài phạm vi TASK-008c.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: Sẵn sàng mở PR hướng vào `dev`
- Final status: `ready_for_review`
- Output chính:
  - `db/migrations/20260823000003_create_audit_logs_and_plans.sql`: Pure SQL migration (up & down).
  - `db/seeds/deterministic_seeds.sql`: Deterministic seed dataset.
  - `apps/api/src/platform/db/schema.ts`: Kysely Database types cho `tenant_plans` và `audit_logs`.
  - `apps/api/src/__tests__/migrations.test.ts`: Automated test suite kiểm tra cấu trúc DDL, reversibility và seeds.
  - `apps/api/src/__tests__/tenant-isolation.test.ts`: Test suite kiểm chứng nguyên tắc cô lập multi-tenant.
