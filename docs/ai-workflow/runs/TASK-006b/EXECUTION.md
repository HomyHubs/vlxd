# Execution log — TASK-006b

## Metadata

- Task: TASK-006b — Staging smoke deploy
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-006b-staging-smoke-deploy`
- Base commit: `ba5d7842ba3fa9e924b13689a74c6e93c1aa7e31`
- Started at (UTC): 2026-08-22T15:40:00Z
- Status: ready_for_review

## Inputs đã đọc

- [x] Root `AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001 đến DEC-013)
- [x] Requirements liên quan (`docs/requirements/*.md`)
- [x] ADR liên quan (`docs/adr/0001-monorepo-structure.md` đến `docs/adr/0009-service-plans-enforcement.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-006b--staging-smoke-deploy-mới`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Thiết lập pipeline staging deployment và automated post-deploy smoke testing cho `apps/api` (`/health`) và `apps/web` (production shell).
- Cấu hình hạ tầng container chuẩn hóa:
  - `apps/api/Dockerfile`: multi-stage container build cho Fastify service.
  - `apps/web/Dockerfile` & `nginx/staging.conf`: multi-stage build cho Vite web app phục vụ qua Nginx.
  - `compose.staging.yml`: Docker Compose stack cho môi trường staging (`api`, `web`, healthchecks, network isolation).
- Xây dựng công cụ kiểm tra tự động sau deploy: `scripts/smoke-test.mjs` (kiểm tra `/health` của API và kiểm tra HTTP 200 / HTML root của Web với retry logic).
- Thiết lập GitHub Actions workflow `.github/workflows/deploy-staging.yml`:
  - Trigger tự động khi merge vào `dev` và hỗ trợ `workflow_dispatch` thủ công.
  - Chạy `pre-deploy-check` (`pnpm check` + `pnpm audit`) trước khi deploy.
  - Build & test containers trong môi trường staging, chạy smoke tests tự động.
  - Quản trị cấu hình qua environment variables / secrets, không hard-code credentials.
  - Cơ chế rollback / failure report tự động nếu smoke test không đạt.

### Ngoài phạm vi

- Không triển khai migration dữ liệu kinh doanh phức tạp (phạm vi của các task M1+).
- Không thêm business endpoints mới chưa có requirement.

## Kế hoạch trước khi sửa

1. Cập nhật `docs/tasks/CURRENT.md` sang `in_progress`.
2. Tạo `EXECUTION.md` và `REVIEW.md` cho `TASK-006b`.
3. Xây dựng Dockerfile cho `apps/api` và `apps/web`, cấu hình Nginx staging.
4. Xây dựng `compose.staging.yml` và script `scripts/smoke-test.mjs`.
5. Xây dựng `.github/workflows/deploy-staging.yml`.
6. Kiểm tra quy trình build, chạy local checks (`pnpm check`, `pnpm audit`, `node scripts/smoke-test.mjs`).
7. Mở PR vào `dev`, cập nhật `CURRENT.md` và `EXECUTION.md`, tiến hành review.

## Giả định và quyết định

| Thời điểm  | Nội dung                                                              | Căn cứ                                                         | Ảnh hưởng                                                   |
| ---------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| 2026-08-22 | Multi-stage Dockerfile cho `apps/api` và `apps/web`                   | Tối ưu kích thước image và bảo mật runtime                     | Container staging nhỏ gọn, không chứa devDependencies       |
| 2026-08-22 | Smoke test bằng Node.js script độc lập `scripts/smoke-test.mjs`       | Chạy được trên cả CI (Linux) và máy dev cục bộ (Windows/macOS) | Không phụ thuộc công cụ ngoài, có exponential backoff retry |
| 2026-08-22 | Trigger `deploy-staging.yml` khi push vào `dev` + `workflow_dispatch` | Đúng yêu cầu MVP-BACKLOG.md                                    | Tự động hóa kiểm tra staging ngay sau khi merge             |

## Thay đổi đã thực hiện

| File/khu vực                                   | Thay đổi                                                                    | Lý do                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| `apps/api/Dockerfile`                          | Tạo multi-stage Dockerfile cho API Fastify                                  | Container hóa backend staging          |
| `apps/web/Dockerfile`                          | Tạo multi-stage Dockerfile cho Vite + Nginx                                 | Container hóa frontend staging         |
| `nginx/staging.conf`                           | Cấu hình Nginx reverse proxy & static SPA server                            | Phục vụ frontend và định tuyến an toàn |
| `compose.staging.yml`                          | Cấu hình Docker Compose cho môi trường staging                              | Khởi chạy stack staging độc lập        |
| `scripts/smoke-test.mjs`                       | Tạo script automated smoke test với retry logic                             | Xác thực hệ thống sau deploy           |
| `package.json`                                 | Bổ sung scripts `test:smoke`, `staging:build`, `staging:up`, `staging:down` | Tiện ích vận hành staging cục bộ       |
| `.github/workflows/deploy-staging.yml`         | Tạo workflow deploy & smoke test staging tự động                            | Tự động hóa CI/CD staging              |
| `docs/tasks/CURRENT.md`                        | Cập nhật trạng thái TASK-006b sang `ready_for_review`                       | Quản lý tiến độ                        |
| `docs/ai-workflow/runs/TASK-006b/EXECUTION.md` | Hoàn thiện execution log                                                    | Theo dõi quá trình triển khai          |
| `docs/ai-workflow/runs/TASK-006b/REVIEW.md`    | Khởi tạo review report                                                      | Chuẩn bị hồ sơ review                  |

## Migration/contract/generated artifacts

- Không có thay đổi DB schema hay API contract.

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code | Ghi chú                                              |
| ------------------------------- | ----------------- | ---------------------------------------------------- |
| `node scripts/smoke-test.mjs`   | Exit 0            | API `/health` và Web shell tải thành công (HTTP 200) |
| `pnpm audit --audit-level=high` | Exit 0            | 0 vulnerabilities found                              |
| `pnpm run format:check`         | Exit 0            | All matched files use Prettier code style            |
| `pnpm typecheck`                | Exit 0            | 7/7 projects typecheck pass                          |
| `pnpm lint`                     | Exit 0            | ESLint 9 pass với 0 errors                           |
| `pnpm test`                     | Exit 0            | 11 unit/integration tests pass                       |
| `pnpm build`                    | Exit 0            | 4 build targets pass                                 |
| `pnpm check`                    | Exit 0            | 18/18 turbo tasks + Prettier check xanh              |

## Self-review

- [x] Diff đúng phạm vi task.
- [x] Không có secret/PII.
- [x] Không có hard-coded secrets trong Dockerfile / Compose / Workflows.
- [x] Smoke test script chạy độc lập và trả về exit code chuẩn.

## Rủi ro và nợ còn lại

- Khi có DB Postgres Supabase ở M1 (TASK-008), cấu hình biến môi trường DB staging sẽ được bổ sung vào compose/secrets.

## Feedback đã xử lý

| Review finding                                                                                                                                             | Cách sửa                                                                                                                                                                                                                                                                                                                                                       | Commit/test bằng chứng                                                                  |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| FINDING-001 (Round 1): `apps/api/src/platform/config.ts` không hỗ trợ `NODE_ENV=staging` khiến `loadConfig()` ném lỗi khi boot container                   | Bổ sung `staging` vào `NODE_ENV` schema trong `config.ts` và thêm unit test `config.test.ts`.                                                                                                                                                                                                                                                                  | `apps/api/src/platform/config.ts`, `apps/api/src/__tests__/config.test.ts`              |
| FINDING-002 (Round 1): PR CI không kiểm tra Docker/Compose stack & smoke test                                                                              | Bổ sung job `staging-smoke` vào `.github/workflows/ci.yml` để build, start và smoke-test toàn bộ Compose stack trên mọi PR.                                                                                                                                                                                                                                    | `.github/workflows/ci.yml`                                                              |
| FINDING-003 (Round 1): Thiếu request timeout và `timeout-minutes` trên workflow jobs                                                                       | Thêm `AbortSignal.timeout(5000)` và exponential backoff trong `smoke-test.mjs`, thêm `timeout-minutes: 15` trên các jobs CI/Deploy.                                                                                                                                                                                                                            | `scripts/smoke-test.mjs`, `.github/workflows/deploy-staging.yml`                        |
| FINDING-004 (Round 1): Thiếu root `.dockerignore`                                                                                                          | Tạo `.dockerignore` tại root loại trừ `.git`, `node_modules`, `dist`, `.turbo`, `coverage`, `.env*`, `prototype/legacy-app`.                                                                                                                                                                                                                                   | `.dockerignore`                                                                         |
| FINDING-005 (Round 2-8): Chu kỳ phát hành GHCR, Compose `image:` directives, compensation rollback song phương hoàn chỉnh, và assertion đối soát chính xác | Bổ sung `image: ${API_IMAGE}` / `image: ${WEB_IMAGE}` vào `compose.staging.yml`, gắn tag candidate trước khi deploy, backup độc lập `:staging-previous` cho cả 2 dịch vụ, compensation rollback song phương khôi phục cả API và Web nếu push Web lỗi, đối soát so khớp toàn bộ tập images bằng sorted comparison, và chuẩn hóa endpoint smoke test thống nhất. | `compose.staging.yml`, `.github/workflows/deploy-staging.yml`, `scripts/smoke-test.mjs` |

## Kết quả bàn giao

- PR: [#15](https://github.com/HomyHubs/vlxd/pull/15)
- Final status: `ready_for_review`
- Output chính: `compose.staging.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `nginx/staging.conf`, `scripts/smoke-test.mjs`, `.github/workflows/deploy-staging.yml`.
- Reviewer cần tập trung: Cấu hình container đa tầng, smoke test logic, và workflow deploy staging.
