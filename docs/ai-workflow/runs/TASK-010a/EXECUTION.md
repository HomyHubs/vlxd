# Execution log — TASK-010a

## Metadata

- Task: TASK-010a — Backend auth, password hashing, and session tokens
- Lane: LANE-CORE
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-010a-backend-auth-session`
- Base commit: `841980c`
- Started at (UTC): 2026-08-23T07:36:00Z
- Status: in_progress

## Inputs đã đọc

- [x] Root `AGENTS.md` (Mục 0, 1, 2, 3, 4, 7, 8, 9)
- [x] `apps/api/AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001, DEC-004, DEC-005, DEC-006, DEC-007, DEC-013)
- [x] `docs/adr/0006-auth-and-authorization.md`
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-010--authentication-v%C3%A0-session--lane-core-ch%E1%BA%BB-2-pr`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`
- [x] Contract `contracts/http/openapi.yaml`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- **Contract-first Auth API:**
  - `POST /api/v1/auth/login`: Xác thực email/password, kiểm tra trạng thái user (`ACTIVE`), tạo session token mới lưu trong bảng `sessions`, ghi nhận `audit_logs` (action: `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILED`), trả về thông tin user/tenant và set HTTP-only cookie `vlxd_session`.
  - `POST /api/v1/auth/logout`: Thu hồi session hiện tại (`revoked_at`), xóa cookie `vlxd_session`, ghi `audit_logs` (action: `AUTH_LOGOUT`).
  - `GET /api/v1/auth/me`: Trả về thông tin authenticated user hiện tại (`id`, `email`, `fullName`, `status`, `tenantId`, `tenantName`, `isOwner`, `titles`).
- **Cryptographic Security:**
  - Password hashing bằng `scrypt` với random salt 16-byte cryptographically secure, constant-time verification (`crypto.timingSafeEqual`).
  - Opaque session token: Chuỗi ngẫu nhiên 32-byte (64 hex characters), lưu trong database dưới dạng SHA-256 hash (`token_hash`), ngăn chặn brute-force và rò rỉ token qua database dump.
  - Secure Cookie: `HttpOnly; Secure (khi production); SameSite=Lax; Path=/; Max-Age=...`.
- **Session Lifecycle & Security Controls:**
  - Hỗ trợ session expiry (mặc định 7 ngày) và thu hồi tức thì (`revoked_at IS NOT NULL`).
  - Chặn đăng nhập / từ chối session nếu User có trạng thái `INACTIVE`, `BLOCKED`, hoặc `ARCHIVED`.
  - Chặn thao tác nếu Tenant có trạng thái `SUSPENDED` hoặc `ARCHIVED`.
- **Vertical Slice Architecture:**
  - `apps/api/src/features/auth/` đầy đủ các module: `index.ts`, `routes.ts`, `service.ts`, `repository.ts`, `schema.ts`, `crypto.ts`.
- **Fastify Session Auth Plugin / Hook:**
  - Pre-handler hook xác thực request qua cookie `vlxd_session` hoặc `Authorization: Bearer <token>`, gắn `request.user` và `request.session`.
- **Automated Tests:**
  - Unit/Integration tests cho password hashing, session creation/verification/revocation, login/logout routes, me route, suspended users, audit logging, error envelopes.

### Ngoài phạm vi

- Frontend login UI / React component (thuộc `TASK-010b`).
- Phân quyền capability authorization chi tiết (thuộc `TASK-011a`).

## Kế hoạch trước khi sửa

1. Cập nhật `contracts/http/openapi.yaml` bổ sung endpoints `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`, và schemas `LoginRequest`, `LoginResponse`, `AuthMeResponse`.
2. Bổ sung Zod schemas vào `packages/shared`.
3. Regenerate `@vlxd/api-client` và xác nhận drift 0%.
4. Cài đặt `@fastify/cookie` cho `apps/api`.
5. Tạo helper crypto bảo mật (`apps/api/src/features/auth/crypto.ts`): password hashing (`hashPassword`, `verifyPassword`) và session token hashing (`generateSessionToken`, `hashSessionToken`).
6. Xây dựng data repository (`apps/api/src/features/auth/repository.ts`) tương tác với bảng `users`, `sessions`, `tenants`, `tenant_users`, `tenant_user_titles`, `titles`, `audit_logs`.
7. Xây dựng business service (`apps/api/src/features/auth/service.ts`) xử lý logic xác thực, session lifecycle, audit log.
8. Xây dựng HTTP routes & controller (`apps/api/src/features/auth/routes.ts`) với fastify zod validation và cookie management.
9. Xây dựng authentication hook/plugin (`apps/api/src/features/auth/plugin.ts`) trích xuất session và bảo vệ route.
10. Đăng ký auth routes và cookie plugin vào `apps/api/src/app.ts`.
11. Viết test suites toàn diện (`apps/api/src/features/auth/__tests__/*.test.ts`).
12. Chạy toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`).

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                            | Căn cứ                                      | Ảnh hưởng                                       |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| 2026-08-23 | Password hash bằng `scrypt` với random salt 16 bytes và constant-time verify        | ADR-0006, OWASP Password Storage Guidelines | Chuẩn bảo mật cao, zero external binary deps    |
| 2026-08-23 | Session token sinh 64-char hex, lưu hash SHA-256 trong bảng `sessions`              | ADR-0006 & Database migration 0001          | Bảo vệ token khi database bị dump               |
| 2026-08-23 | Hỗ trợ cả Cookie `vlxd_session` (cho web SPA) và Header `Authorization: Bearer ...` | ADR-0006 & OpenAPI best practice            | Linh hoạt cho cả Web SPA và API clients/scripts |
| 2026-08-23 | Audit mọi sự kiện login thành công, login thất bại, logout vào bảng `audit_logs`    | ADR-0006 & DEC-006                          | Truy vết bảo mật và kiểm toán đầy đủ            |

## Thay đổi đã thực hiện

| File/khu vực                                     | Thay đổi                                                                     | Lý do                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| `contracts/http/openapi.yaml`                    | Thêm `/api/v1/auth/login`, `/logout`, `/me`, securitySchemes, Auth schemas   | Contract-first API specification cho Auth          |
| `packages/shared/src/errors/index.ts`            | Thêm `INVALID_CREDENTIALS`, `USER_SUSPENDED`, `TENANT_SUSPENDED` error codes | Error codes định danh ổn định cho Auth             |
| `packages/shared/src/schemas/index.ts`           | Thêm Zod schemas cho Auth payload/response                                   | Shared validation logic                            |
| `packages/api-client/src/index.ts`               | Thêm `login`, `logout`, `getAuthMe` methods và export Auth types             | Typed API client sinh từ contract                  |
| `apps/api/package.json`                          | Cài đặt `@fastify/cookie` và `fastify-plugin`                                | Quản lý cookie HttpOnly và auth plugin             |
| `apps/api/src/features/auth/crypto.ts`           | Helper băm mật khẩu `scrypt` và token `sha256`                               | Bảo mật mật khẩu và session token                  |
| `apps/api/src/features/auth/repository.ts`       | Data access layer cho `users`, `sessions`, `tenants`, `audit_logs`           | Truy vấn dữ liệu Kysely                            |
| `apps/api/src/features/auth/service.ts`          | Business service xử lý login, logout, me, session validation, audit logs     | Logic nghiệp vụ xác thực                           |
| `apps/api/src/features/auth/plugin.ts`           | Fastify plugin `authenticate` hook & request decorators                      | Middleware bảo vệ route                            |
| `apps/api/src/features/auth/routes.ts`           | Fastify endpoints cho Auth với cookie management                             | HTTP interface cho Auth                            |
| `apps/api/src/features/auth/index.ts`            | Public entrypoint cho `features/auth`                                        | Feature encapsulation                              |
| `apps/api/src/app.ts`                            | Đăng ký `fastifyCookie`, `authPlugin`, và `authRoutes`                       | Tích hợp vào Fastify app                           |
| `apps/api/src/features/auth/__tests__/*.test.ts` | Test suites cho crypto, service, routes                                      | Quality verification (26 tests mới, 58 tests tổng) |

## Migration/contract/generated artifacts

- `contracts/http/openapi.yaml`: Thêm Auth endpoints & schemas.
- `packages/shared/src/schemas/`: Thêm Auth Zod schemas.
- `packages/api-client/src/generated/`: Generated API client schema.

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code                    | Ghi chú                                                                                      |
| ------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `pnpm test`                     | Exit code 0 (6/6 turbo tasks passed) | Vitest chạy 58 tests trong `apps/api`, 9 tests trong `api-client`, 6 trong `shared`, 2 `web` |
| `pnpm run check`                | Exit code 0                          | Quality gates 18/18 turbo tasks + OpenAPI drift check 0% + Prettier formatting check         |
| `pnpm audit --audit-level=high` | Exit code 0                          | 0 lỗ hổng bảo mật                                                                            |

## Self-review

- [x] Password hash an toàn qua `scrypt`, timing-safe.
- [x] Session token được hash SHA-256 trước khi lưu vào DB.
- [x] User/Tenant bị suspended/blocked không thể đăng nhập hoặc dùng session cũ.
- [x] Logout thu hồi session thành công (`revoked_at` được set và xóa cookie).
- [x] Mọi sự kiện auth ghi audit log với IP, User-Agent, Request ID.
- [x] Tất cả responses khớp schema OpenAPI `contracts/http/openapi.yaml`.
- [x] Toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`) xanh 100%.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: Sẵn sàng mở PR hướng vào `dev`
- Final status: `ready_for_review`
- Output chính:
  - `contracts/http/openapi.yaml`: Auth endpoints `/login`, `/logout`, `/me` và schemas.
  - `packages/shared/`: Auth Zod schemas và error codes.
  - `packages/api-client/`: API client methods `login`, `logout`, `getAuthMe`.
  - `apps/api/src/features/auth/`: Vertical slice hoàn chỉnh (crypto, repository, service, routes, plugin, index).
  - `apps/api/src/features/auth/__tests__/`: Bộ test bao phủ toàn bộ luồng auth.
