# Execution log — TASK-011b

## Metadata

- Task: TASK-011b — Tenant user lifecycle & title assignment
- Lane: LANE-CORE
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: task/TASK-011b-tenant-user-lifecycle
- Base commit: e11a9a8
- Started at (UTC): 2026-08-26T09:23:00Z
- Status: ready_for_review

## Inputs đã đọc

- [x] Root `AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md`
- [x] Requirement liên quan (`docs/requirements/role-management.md`)
- [x] ADR liên quan (`docs/adr/0002-vertical-slice-architecture.md`, `docs/adr/0003-contract-first-openapi.md`, `docs/adr/0005-multi-tenancy-isolation.md`, `docs/adr/0006-auth-and-authorization.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md` — TASK-011b)
- [x] `AGENTS.md` con liên quan (`apps/api/src/features/tenant-user/AGENTS.md`, `apps/api/src/features/authorization/AGENTS.md`)

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Contract-first API endpoints cho vòng đời tenant user:
  - `POST /api/v1/tenant-users`: Mời/thêm tài khoản người dùng đã có vào tenant (`user.account.create`).
  - `PATCH /api/v1/tenant-users/{tenantUserId}/status`: Cập nhật trạng thái (`ACTIVE`, `SUSPENDED`, `REVOKED`) (`user.account.update`).
  - `PUT /api/v1/tenant-users/{tenantUserId}/titles`: Thay thế danh sách chức danh/title được gán (`user.role.assign`).
- Cập nhật OpenAPI spec và tự động regenerate `packages/api-client`.
- Triển khai backend vertical slice tại `apps/api/src/features/tenant-user/` (routes, service, repository, tests).
- Đảm bảo tenant isolation, capability authorization, và validate title thuộc tenant hoặc system.

### Ngoài phạm vi

- Mời tài khoản người dùng chưa đăng ký (chưa có account toàn cục / invitation token qua email setup mật khẩu) — sẽ thực hiện ở slice riêng khi có invitation token workflow.
- Custom permission overrides và scope evaluation — thuộc TASK-011c.
- Giao diện người dùng web — thuộc TASK-011d.

## Kế hoạch trước khi sửa

1. Định nghĩa OpenAPI contract cho các endpoint tenant-user và regenerate client.
2. Thiết kế vertical slice `apps/api/src/features/tenant-user/` gồm routes, service, repository.
3. Enforce capability authorization hook trên Fastify routes (`user.account.create`, `user.account.update`, `user.role.assign`).
4. Viết unit và HTTP integration tests cho service và routes, kiểm tra cả happy path lẫn error handling (400, 401, 403, 404, 409).
5. Chạy toàn bộ quality gates (`pnpm check`).

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                              | Căn cứ                                                                                              | Ảnh hưởng                                                                 |
| ---------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-08-26 | Mời tài khoản yêu cầu email đã tồn tại trong hệ thống                                 | Schema `users` hiện tại yêu cầu password_hash, chưa có token mời người dùng mới                     | Trả lỗi 404 `User account not found` nếu email chưa có tài khoản hệ thống |
| 2026-08-26 | Titles gán cho user chấp nhận system titles hoặc tenant-specific titles của tenant đó | Migration `20260823000002_create_permissions_and_roles.sql` (tenant_id nullable trên bảng `titles`) | User không thể được gán title thuộc về tenant khác                        |

## Thay đổi đã thực hiện

| File/khu vực                                                       | Thay đổi                                                                             | Lý do                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `contracts/http/openapi.yaml`                                      | Thêm schemas và operations cho `tenant-users` invite, update status, replace titles  | Contract-first                                    |
| `packages/api-client/src/generated/schema.ts`                      | Regenerate từ OpenAPI                                                                | Đồng bộ TypeScript types                          |
| `packages/api-client/src/index.ts`                                 | Thêm methods `inviteTenantUser`, `updateTenantUserStatus`, `replaceTenantUserTitles` | Typed API client                                  |
| `packages/api-client/src/__tests__/client.test.ts`                 | Thêm test cases cho các methods mới                                                  | Đảm bảo client hoạt động đúng                     |
| `apps/api/src/features/tenant-user/`                               | Tạo vertical slice mới (routes, service, repository, index, AGENTS.md)               | Triển khai nghiệp vụ tenant user lifecycle        |
| `apps/api/src/features/tenant-user/__tests__/`                     | Thêm `service.test.ts` và `routes.test.ts`                                           | Đảm bảo chất lượng và độ phủ kiểm thử             |
| `apps/api/src/app.ts`                                              | Đăng ký `tenantUserRoutes` và inject `TenantUserService`                             | Khởi tạo feature slice khi có DB                  |
| `apps/api/src/features/authorization/__tests__/repository.test.ts` | Thêm skip an toàn khi Docker container runtime không khả dụng                        | Chạy test ổn định trên môi trường không có Docker |
| `.gitignore`                                                       | Thêm `.playwright-mcp/`                                                              | Vệ sinh repo                                      |
| `docs/tasks/CURRENT.md`                                            | Cập nhật thông tin task và trạng thái `ready_for_review`                             | Theo dõi quy trình 2-bot                          |

## Migration/contract/generated artifacts

- OpenAPI: Thêm endpoints `/api/v1/tenant-users`, `/api/v1/tenant-users/{tenantUserId}/status`, `/api/v1/tenant-users/{tenantUserId}/titles`.
- Migration: Không cần migration mới (đã có từ TASK-008a, TASK-008b).
- Generated client: `pnpm run generate:api-client` đã sinh và khớp 100%.
- Compatibility/rollback: Không có breaking change với các endpoint hiện có.

## Kiểm tra đã chạy

| Command                               | Kết quả/exit code | Ghi chú                                                                                         |
| ------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm run check:drift`                | 0                 | OpenAPI schema khớp 100%                                                                        |
| `pnpm --filter @vlxd/api-client test` | 0                 | 12 tests passed                                                                                 |
| `pnpm --filter @vlxd/api test`        | 0                 | 15 test files, 76 passed, 2 skipped (PostgreSQL container integration test khi không có Docker) |
| `pnpm check`                          | 0                 | Drift check, lint, typecheck, tests, build, format check đều xanh                               |

## Self-review

- [x] Diff đúng phạm vi task.
- [x] Không có secret/PII.
- [x] Không sửa generated code bằng tay.
- [x] Permission/plan/tenant/audit được xử lý nếu liên quan.
- [x] Failure, conflict và concurrency cases được kiểm tra nếu liên quan.
- [x] Docs và trạng thái được cập nhật.

## Rủi ro và nợ còn lại

- Mời tài khoản người dùng chưa đăng ký hệ thống cần triển khai ở phase sau khi có luồng mời qua email kèm invitation token.

## Kết quả bàn giao

- PR: Branch `task/TASK-011b-tenant-user-lifecycle`
- Final status: ready_for_review
- Output chính: Endpoints tenant user lifecycle với capability authorization và client SDK hoàn chỉnh.
- Reviewer cần tập trung: Kiểm tra logic phân quyền capability, validation title IDs theo tenant isolation, và error responses.
