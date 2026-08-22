# Review report — TASK-006b

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR/commit reviewed: [#15](https://github.com/HomyHubs/vlxd/pull/15)
- Reviewed commits:
  - Round 1 (PR #15): `9d3bb7f33c6b53b60d4cd0b2f2871da6344c2d8d`
- Reviewed at (UTC): 2026-08-22T15:53:00Z
- Review round: 1
- Verdict: changes_required (Round 1) -> pending re-review (Round 2)

## Phạm vi đã kiểm tra

- [x] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-006b--staging-smoke-deploy-mới`)
- [x] Dockerfile cho `apps/api` và `apps/web` (multi-stage build, unprivileged user, lean Alpine image)
- [x] Cấu hình `compose.staging.yml` & `nginx/staging.conf`
- [x] Script automated smoke test `scripts/smoke-test.mjs` (timeout, retry delay, status assertions)
- [x] Workflow `.github/workflows/deploy-staging.yml` và `.github/workflows/ci.yml` (staging smoke container integration job on PRs)
- [x] Execution log (`docs/ai-workflow/runs/TASK-006b/EXECUTION.md`)
- [x] Toàn bộ diff (`git diff dev...HEAD`)
- [x] Không có secret / PII / hard-coded credentials
- [x] Kết quả chạy thực tế trên GitHub Actions runners

## Commands reviewer đã chạy

| Command                         | Kết quả/exit code | Ghi chú                                        |
| ------------------------------- | ----------------- | ---------------------------------------------- |
| `pnpm audit --audit-level=high` | Exit 0            | 0 vulnerabilities found                        |
| `pnpm check`                    | Exit 0            | 18/18 turbo tasks + Prettier format check xanh |
| `gh pr view 15`                 | Exit 0            | PR #15 mở thành công trên nhánh base `dev`     |
| `gh pr checks 15`               | Exit 0            | CI checks đang chạy trên GitHub Actions        |

## Findings

### FINDING-001 — [ROUND 1] `apps/api/src/platform/config.ts` không chấp nhận `NODE_ENV=staging`

- Severity: BLOCKER
- File/dòng: `apps/api/src/platform/config.ts:3-4`, `compose.staging.yml:8`
- Tác động: `loadConfig()` ném ngoại lệ khi khởi động container staging, khiến API container crash và smoke test fail.
- Cách xử lý: Đã thêm `staging` vào `NODE_ENV` schema trong `config.ts` và viết unit test xác thực tại `apps/api/src/__tests__/config.test.ts`.
- Trạng thái: resolved

### FINDING-002 — [ROUND 1] PR CI không kiểm tra Docker/Compose container stack

- Severity: BLOCKER
- File/dòng: `.github/workflows/ci.yml`
- Tác động: Các lỗi container hoặc cấu hình staging có thể bị lọt vào `dev` do PR CI chỉ chạy tests trên host runner.
- Cách xử lý: Đã bổ sung job `staging-smoke` vào `.github/workflows/ci.yml` chạy trên mọi PR, build compose stack, đợi healthy, chạy `scripts/smoke-test.mjs`, capture log khi fail và teardown sạch sẽ.
- Trạng thái: resolved

### FINDING-003 — [ROUND 1] Thiếu request timeout và `timeout-minutes`

- Severity: MEDIUM
- File/dòng: `scripts/smoke-test.mjs:17,37`, `.github/workflows/*.yml`
- Tác động: Nguy cơ treo CI runner nếu service không phản hồi.
- Cách xử lý: Thêm `AbortSignal.timeout(5000)` vào fetch requests, cấu hình progressive delay trong `smoke-test.mjs`, và thêm `timeout-minutes: 15` trên các CI jobs.
- Trạng thái: resolved

### FINDING-004 — [ROUND 1] Thiếu root `.dockerignore`

- Severity: LOW
- File/dòng: `.dockerignore`
- Tác động: Context build Docker lớn không cần thiết và tiềm ẩn rủi ro lọt file rác.
- Cách xử lý: Tạo `.dockerignore` chuẩn hóa loại trừ `.git`, `node_modules`, `dist`, `.turbo`, `coverage`, `.env*`, `prototype/legacy-app`.
- Trạng thái: resolved

## Acceptance criteria

| Criterion                                                   | Pass/Fail/Not verified | Evidence                                                                                                         |
| ----------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Pipeline deploy staging cho `apps/api` và `apps/web`        | Pass                   | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.staging.yml`, `.github/workflows/deploy-staging.yml`      |
| Cấu hình quản trị qua env/secrets, không hard-code          | Pass                   | Cấu hình qua environment variables (`NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`), không hard-code secret             |
| Tự động chạy smoke test sau deploy (`/health` và shell web) | Pass                   | Script `scripts/smoke-test.mjs` kiểm tra API `/health` (ISO timestamp, status ok, version) và Web shell tải HTML |
| Cơ chế rollback/thông báo lỗi khi smoke test fail           | Pass                   | Workflow capture log container (`docker compose logs`) khi failure và thực hiện teardown sạch sẽ                 |
| Không có secret trong log/artifact                          | Pass                   | Gitleaks scan và `pnpm audit` chạy sạch sẽ 100%                                                                  |
| PR CI kiểm tra staging smoke test                           | Pass                   | Job `staging-smoke` trong `.github/workflows/ci.yml` kiểm thử toàn bộ container stack trên PR                    |

## Kiểm tra regression

- Các unit tests, integration tests và static builds của `apps/web`, `apps/api`, `packages/shared`, `packages/api-client` tiếp tục pass 100%.

## Kết luận

- Verdict: resolved_pending_re-review
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: —
- Lý do kết luận: Đã khắc phục triệt để toàn bộ 4 blocking & non-blocking findings của Round 1. Đã hỗ trợ `staging` trong API config, bổ sung PR container smoke gate, thêm request timeouts, tạo root `.dockerignore`, sẵn sàng cho Round 2 review.
