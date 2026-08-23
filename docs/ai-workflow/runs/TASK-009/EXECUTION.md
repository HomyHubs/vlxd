# Execution log — TASK-009

## Metadata

- Task: TASK-009 — Backend platform foundation + observability
- Lane: LANE-CORE
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-009-backend-platform-foundation-observability`
- Base commit: `b2c63e3`
- Started at (UTC): 2026-08-23T07:18:00Z
- Status: in_progress

## Inputs đã đọc

- [x] Root `AGENTS.md` (Mục 0, 1, 2, 3, 7, 8, 9)
- [x] `apps/api/AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001, DEC-004, DEC-005, DEC-006, DEC-007, DEC-013)
- [x] ADR liên quan (`docs/adr/0002-fastify-backend-and-type-provider.md`, `docs/adr/0004-database-and-data-access.md`, `docs/adr/0005-multi-tenancy-isolation.md`, `docs/adr/0006-opaque-tokens-and-capability-authorization.md`, `docs/adr/0007-immutable-ledgers-and-state-machines.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-009--backend-platform-foundation--observability--lane-core`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`
- [x] Contract `contracts/http/openapi.yaml`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Hoàn thiện nền tảng backend platform production-ready trong `apps/api/src/platform/`:
  - **Fail-fast Config:** Quản lý môi trường qua Zod schema (`NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `DATABASE_URL`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`, `DATABASE_SSL`), báo lỗi chi tiết khi cấu hình sai và dừng sớm khi khởi động.
  - **Kysely DB Pool & Lifecycle:** Khởi tạo connection pool PostgreSQL trên `pg.Pool`, cung cấp `createDatabase`, `closeDatabase`, `checkDatabaseHealth`, `withTransaction` helper, và `withTenantScope` helper.
  - **Request ID & Tracing:** Xử lý `x-request-id` (nhận từ client hoặc sinh mới UUID), gắn vào response header và đính kèm vào logger context của từng request.
  - **Pino Redaction & Structured Logging:** Cấu hình chuẩn hóa pino log redact PII và sensitive fields (`authorization`, `cookie`, `password`, `token`, `secret`, `accessToken`, `refreshToken`, `creditCard`, `phone`, `email`).
  - **Observability & Health/Readiness Endpoints:**
    - `GET /health`: Liveness probe (200 OK với version, status, timestamp).
    - `GET /health/ready`: Readiness probe kiểm tra kết nối DB pool thực tế.
  - **Global Error Handler & Envelope:** Xử lý toàn bộ lỗi (Zod validation 400, Not Found 404, AppError domain errors, Uncaught 500) khớp 100% với schema `ErrorEnvelope` trong `contracts/http/openapi.yaml`. Đảm bảo tuyệt đối không làm lộ internal stack trace, SQL query hay bí mật hệ thống cho client.
  - **Graceful Shutdown:** Bắt tín hiệu `SIGINT`, `SIGTERM`, đóng server Fastify và đóng kết nối DB pool an toàn.
  - **Automated Tests:** Xây dựng bộ test toàn diện kiểm tra config, request ID, error handling, health/readiness, database helpers, và shutdown lifecycle.

### Ngoài phạm vi

- Auth endpoints / login controller (thuộc TASK-010).
- Business feature slices (Product, Warehouse, Order, v.v.).

## Kế hoạch trước khi sửa

1. Cập nhật `contracts/http/openapi.yaml` bổ sung `/health/ready` (Readiness check) và regenerate `@vlxd/api-client`.
2. Bổ sung `ReadinessResponseSchema` vào `packages/shared`.
3. Hoàn thiện `apps/api/src/platform/config.ts` với đầy đủ database config và fail-fast validation.
4. Cải tiến `apps/api/src/platform/logger.ts` với redaction và request serializers.
5. Cập nhật `apps/api/src/platform/db/index.ts` với database pool factory, connection lifecycle, transaction helper và tenant scope helper.
6. Xây dựng HTTP platform middleware: `request-id.ts` và `error-handler.ts`.
7. Cập nhật `apps/api/src/app.ts` tích hợp đầy đủ plugins, error handling, request ID, `/health` và `/health/ready`.
8. Cập nhật `apps/api/src/main.ts` với graceful shutdown và error handlers.
9. Viết bộ unit/integration test suites cho platform components (`config.test.ts`, `error-handler.test.ts`, `request-id.test.ts`, `health.test.ts`, `db.test.ts`).
10. Chạy toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`).
11. Mở PR vào `dev`, cập nhật `CURRENT.md` và `EXECUTION.md`, tiến hành Bot 2 review.

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                        | Căn cứ                                   | Ảnh hưởng                                       |
| ---------- | ------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| 2026-08-23 | Dùng `fastify-type-provider-zod` và global error handler trả về `ErrorEnvelope` | ADR-0002 & `contracts/http/openapi.yaml` | Error structure đồng nhất toàn hệ thống         |
| 2026-08-23 | Request ID dùng header `x-request-id`, nếu thiếu tự sinh `req-<uuid>`           | `contracts/http/openapi.yaml`            | Hỗ trợ tracing end-to-end                       |
| 2026-08-23 | Cột timestamps và date time đều theo chuẩn ISO 8601 UTC                         | ADR-0004 & DEC-002                       | Tránh lỗi sai lệch timezone                     |
| 2026-08-23 | Database connection pool được quản lý tập trung và đóng sạch khi shutdown       | ADR-0004 & TASK-009 requirements         | Không rò rỉ connection pool                     |
| 2026-08-23 | Endpoint `/health/ready` trả về 503 khi DB không khả dụng                       | Observability best practices             | Kubernetes/Docker compose readiness probe chuẩn |

## Thay đổi đã thực hiện

| File/khu vực                                  | Thay đổi                                                        | Lý do                                              |
| --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `contracts/http/openapi.yaml`                 | Bổ sung endpoint `/health/ready` và `ReadinessResponse`         | Chuẩn hóa contract-first cho readiness probe       |
| `packages/shared/src/schemas/index.ts`        | Bổ sung `ReadinessResponseSchema`                               | Schema validation cho response readiness           |
| `packages/api-client/src/generated/`          | Regenerate OpenAPI types và client                              | Đồng bộ api-client với contract                    |
| `apps/api/src/platform/config.ts`             | Cập nhật schema config và database settings                     | Quản trị môi trường chặt chẽ                       |
| `apps/api/src/platform/logger.ts`             | Redaction, request serializer và correlation id                 | Observability và bảo mật dữ liệu log               |
| `apps/api/src/platform/db/index.ts`           | DB pool management, transaction helper, health check            | Data access layer nền tảng                         |
| `apps/api/src/platform/http/error-handler.ts` | Global error handler bọc mọi lỗi trả về `ErrorEnvelope`         | Bảo vệ thông tin máy chủ, trả lỗi chuẩn hóa        |
| `apps/api/src/platform/http/request-id.ts`    | Xử lý trace id `x-request-id`                                   | Observability context                              |
| `apps/api/src/app.ts`                         | Tích hợp error handler, request id, liveness & readiness        | Setup Fastify app production-ready                 |
| `apps/api/src/main.ts`                        | Graceful shutdown cho server & database                         | Xử lý shutdown an toàn, không ngắt kết nối dở dang |
| `apps/api/src/__tests__/*.test.ts`            | Test suites toàn diện cho error, request-id, db, health, config | Quality verification                               |
| `docs/tasks/CURRENT.md`                       | Cập nhật tiến độ TASK-009                                       | Quản lý tiến độ                                    |

## Migration/contract/generated artifacts

- `contracts/http/openapi.yaml`: Thêm `/health/ready`.
- `packages/api-client/src/generated/`: Generated types & client.

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code                    | Ghi chú                                                                                                                                                                              |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                     | Exit code 0 (6/6 turbo tasks passed) | Vitest chạy 32 tests trong `apps/api` (bao gồm `config`, `db`, `request-id`, `health`, `error-handler`, `migrations`, `tenant-isolation`), 6 tests `api-client`, 6 `shared`, 2 `web` |
| `pnpm run check`                | Exit code 0                          | Quality gate đầy đủ: check drift, lint, typecheck, test, build (18/18 turbo tasks), prettier check                                                                                   |
| `pnpm audit --audit-level=high` | Exit code 0                          | 0 lỗ hổng bảo mật                                                                                                                                                                    |

## Self-review

- [x] Startup fail-fast khi thiếu/sai config qua `ConfigValidationError`.
- [x] Không lộ stack trace, SQL query, hoặc secret cho client khi gặp lỗi 500 (test `error-handler.test.ts` đã kiểm chứng).
- [x] Mọi response có `x-request-id` header và log có correlation ID.
- [x] Log PII & sensitive headers/fields được redact bằng `[REDACTED]`.
- [x] Database pool mở và đóng sạch sẽ trong lifecycle ứng dụng (`createDatabase`, `closeDatabase`).
- [x] Liveness `/health` và Readiness `/health/ready` hoạt động đúng.
- [x] Toàn bộ quality gates (`pnpm check`, `pnpm test`, `pnpm audit`) xanh 100%.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: Sẵn sàng mở PR hướng vào `dev`
- Final status: `ready_for_review`
- Output chính:
  - `contracts/http/openapi.yaml`: Thêm `/health/ready` và `ReadinessResponse`.
  - `packages/shared/src/schemas/index.ts`: Thêm `ReadinessResponseSchema`.
  - `packages/api-client/src/generated/schema.ts` & `packages/api-client/src/index.ts`: Regenerated types và `getReadiness()` method.
  - `apps/api/src/platform/config.ts`: Zod config schema với database settings và `ConfigValidationError`.
  - `apps/api/src/platform/logger.ts`: Pino logger với PII & sensitive headers redaction.
  - `apps/api/src/platform/db/index.ts`: Kysely/pg pool lifecycle, transaction helper, tenant context helper, health check.
  - `apps/api/src/platform/http/request-id.ts`: Request ID extraction và generation.
  - `apps/api/src/platform/http/error-handler.ts`: Global error handler bọc mọi lỗi trả về `ErrorEnvelope`.
  - `apps/api/src/app.ts`: Setup Fastify app với type provider, logger, error handlers, liveness và readiness probes.
  - `apps/api/src/main.ts`: Application bootstrap với fail-fast config và graceful shutdown.
  - `apps/api/src/__tests__/*.test.ts`: 7 test suites bao phủ toàn bộ platform foundation (32 tests).
