# Execution log — TASK-008b

## Metadata

- Task: TASK-008b — Permissions & role management migrations
- Lane: LANE-CORE
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-008b-permissions-and-role-management-migrations`
- Base commit: `17a5b1a`
- Started at (UTC): 2026-08-23T04:40:00Z
- Status: in_progress

## Inputs đã đọc

- [x] Root `AGENTS.md` (Mục 0, 1, 2, 3, 4, 7)
- [x] `db/AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001, DEC-002, DEC-003, DEC-004)
- [x] Requirements liên quan (`docs/requirements/role-management.md`, `docs/requirements/audit.md`)
- [x] ADR liên quan (`docs/adr/0004-database-and-data-access.md`, `docs/adr/0005-multi-tenancy-isolation.md`, `docs/adr/0006-auth-and-authorization.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-008--database-multi-tenant-foundation--lane-core-chẻ-3-pr`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Thiết lập migration SQL thuần túy (dbmate compliant) cho 6 bảng nền tảng Permissions & Role Management:
  - `role_groups`: Nhóm quyền hệ thống (`id`, `code`, `name`, `description`, `is_system`, `created_at`, `updated_at`, `archived_at`).
  - `permissions`: Danh mục quyền hạn / capability (`id`, `code`, `module`, `resource`, `action`, `name`, `description`, `created_at`, `updated_at`).
  - `role_group_permissions`: Bảng liên kết nhiều-nhiều gán permissions cho role group (`id`, `role_group_id`, `permission_id`, `created_at`) với unique constraint `uq_role_group_permissions`.
  - `titles`: Chức danh kinh doanh (`id`, `tenant_id`, `code`, `name`, `role_group_id`, `description`, `created_at`, `updated_at`, `archived_at`) với foreign key `tenant_id` nullable (cho default system templates) hoặc scoped theo tenant.
  - `tenant_user_titles`: Bảng gán chức danh cho nhân viên của tenant (`id`, `tenant_user_id`, `title_id`, `created_at`) với unique constraint `uq_tenant_user_titles`.
  - `user_custom_permissions`: Bảng ghi đè quyền (allow / deny override) và phạm vi quyền (scope) theo nhân viên (`id`, `tenant_user_id`, `permission_id`, `effect`, `scope_type`, `scope_value`, `created_at`, `updated_at`).
- Đảm bảo toàn bộ timestamps là UTC (`timestamptz DEFAULT timezone('utc'::text, now())`).
- Đảm bảo các bảng danh mục có trường soft delete / archive (`archived_at timestamptz DEFAULT NULL`).
- Đảm bảo migration có cả phần `-- migrate:up` và `-- migrate:down` reversible hoàn chỉnh (drop theo thứ tự phụ thuộc ngược).
- Cập nhật Kysely TypeScript interfaces cho database schema trong `apps/api/src/platform/db/schema.ts`.
- Mở rộng automated tests trong `apps/api/src/__tests__/migrations.test.ts` kiểm tra các bảng mới, foreign key constraints, unique constraints, indexes và reversibility.

### Ngoài phạm vi

- TASK-008c (Audit log & tenant plans migrations, deterministic seeds & isolation integration test).
- Business feature tables (Product, Warehouse, Order...).

## Kế hoạch trước khi sửa

1. Cập nhật `docs/tasks/CURRENT.md` sang `in_progress`.
2. Tạo `EXECUTION.md` và `REVIEW.md` cho `TASK-008b`.
3. Tạo migration file `db/migrations/20260823000002_create_permissions_and_roles.sql` với `-- migrate:up` và `-- migrate:down`.
4. Cập nhật database schema TypeScript types cho Kysely tại `apps/api/src/platform/db/schema.ts`.
5. Mở rộng test suite `apps/api/src/__tests__/migrations.test.ts` kiểm tra DDL, constraints, indexes, UTC timestamps, và reversibility cho migration mới.
6. Chạy toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`).
7. Mở PR vào `dev`, cập nhật `CURRENT.md` và `EXECUTION.md`, tiến hành review.

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                                | Căn cứ                                            | Ảnh hưởng                                                                   |
| ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| 2026-08-23 | Dùng UUID v4 (`gen_random_uuid()`) làm primary key                                      | ADR-0004 & DEC-002                                | Khóa chính chuẩn hóa đồng nhất                                              |
| 2026-08-23 | Timestamps dùng `timestamptz` với `timezone('utc'::text, now())`                        | ADR-0004 & `db/AGENTS.md`                         | Chuẩn hóa thời gian toàn hệ thống theo UTC                                  |
| 2026-08-23 | Phân tách rõ ràng 3 tầng: User -> Title -> Role Group -> Capability Permission          | ADR-0006 & `docs/requirements/role-management.md` | Phân quyền linh hoạt, không hard-code quyền theo Title                      |
| 2026-08-23 | Hỗ trợ ghi đè quyền `user_custom_permissions` với `effect` (ALLOW/DENY) và `scope_type` | `docs/requirements/role-management.md`            | Hỗ trợ mô hình Deny-override thắng Allow và Scope theo Kho/Chi nhánh/Tenant |

## Thay đổi đã thực hiện

| File/khu vực                                                    | Thay đổi                                                                                                                                | Lý do                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `db/migrations/20260823000002_create_permissions_and_roles.sql` | Tạo migration SQL cho `role_groups`, `permissions`, `role_group_permissions`, `titles`, `tenant_user_titles`, `user_custom_permissions` | CSDL phân quyền và chức danh         |
| `apps/api/src/platform/db/schema.ts`                            | Khai báo Kysely Database schema interfaces cho các bảng mới                                                                             | Type safety cho tầng Data Access     |
| `apps/api/src/__tests__/migrations.test.ts`                     | Automated test suite kiểm tra migration mới và SQL DDL                                                                                  | Đảm bảo reversibility và constraints |
| `docs/tasks/CURRENT.md`                                         | Cập nhật tiến độ TASK-008b                                                                                                              | Quản lý tiến độ                      |
| `docs/ai-workflow/runs/TASK-008b/EXECUTION.md`                  | Hoàn thiện execution log                                                                                                                | Ghi nhận thực thi                    |
| `docs/ai-workflow/runs/TASK-008b/REVIEW.md`                     | Khởi tạo review report                                                                                                                  | Chuẩn bị hồ sơ review                |

## Migration/contract/generated artifacts

- `db/migrations/20260823000002_create_permissions_and_roles.sql`: Pure SQL migration (up & down).

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code                    | Ghi chú                                                                                                                                                              |
| ------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                     | Exit code 0 (6/6 turbo tasks passed) | Vitest chạy 9 tests trong `apps/api` (bao gồm 4 migration tests trong `migrations.test.ts`), 5 tests trong `api-client`, 6 tests trong `shared`, 2 tests trong `web` |
| `pnpm run check`                | Exit code 0                          | Quality gate đầy đủ: check drift, lint, typecheck, test, build (18/18 turbo tasks), prettier check                                                                   |
| `pnpm audit --audit-level=high` | Exit code 0                          | 0 lỗ hổng bảo mật                                                                                                                                                    |

## Self-review

- [x] Migration có cả `-- migrate:up` và `-- migrate:down` tuân thủ chuẩn `dbmate`.
- [x] Mọi cột thời gian dùng `timestamptz` UTC (`timezone('utc'::text, now())`).
- [x] Bảng liên kết có foreign keys `ON DELETE CASCADE` tới bảng cha phù hợp (`role_group_permissions`, `tenant_user_titles`, `user_custom_permissions`).
- [x] Có các unique constraints (`uq_role_group_permissions`, `uq_titles_tenant_code`, `uq_tenant_user_titles`, `uq_user_custom_permissions`) và indexes đầy đủ.
- [x] Không có secret/password raw trong migration hoặc code.
- [x] Không thêm các bảng ngoài phạm vi TASK-008b.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: Sẵn sàng mở PR hướng vào `dev`
- Final status: `ready_for_review`
- Output chính:
  - `db/migrations/20260823000002_create_permissions_and_roles.sql`: Pure SQL migration (up & down).
  - `apps/api/src/platform/db/schema.ts`: Kysely Database types cho `role_groups`, `permissions`, `role_group_permissions`, `titles`, `tenant_user_titles`, `user_custom_permissions`.
  - `apps/api/src/__tests__/migrations.test.ts`: Automated test suite kiểm tra cấu trúc DDL, reversibility và constraints của TASK-008b.
