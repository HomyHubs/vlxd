# Review report — TASK-006b

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR/commit reviewed: [#15](https://github.com/HomyHubs/vlxd/pull/15)
- Reviewed commits:
  - Round 1 (PR #15): `9d3bb7f33c6b53b60d4cd0b2f2871da6344c2d8d`
  - Round 2 (PR #15): `004ec0d665b9e7a0bd7a6d0b4a478c9ee2e6e977`
- Reviewed at (UTC): 2026-08-22T20:15:00Z
- Review round: 2
- Verdict: changes_required (Round 2) -> pending re-review (Round 3)

## Phạm vi đã kiểm tra

- [x] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-006b--staging-smoke-deploy-mới`)
- [x] Dockerfile cho `apps/api` và `apps/web` (multi-stage build, unprivileged user, lean Alpine image)
- [x] Cấu hình `compose.staging.yml` & `nginx/staging.conf`
- [x] Script automated smoke test `scripts/smoke-test.mjs` (timeout, retry delay, concurrent status assertions)
- [x] Workflow `.github/workflows/deploy-staging.yml` (immutable artifacts, post-deploy verification, automated rollback on failure)
- [x] Workflow `.github/workflows/ci.yml` (PR staging smoke container integration job)
- [x] Execution log (`docs/ai-workflow/runs/TASK-006b/EXECUTION.md`)
- [x] Toàn bộ diff (`git diff dev...HEAD`)
- [x] Không có secret / PII / hard-coded credentials
- [x] Kết quả chạy thực tế trên GitHub Actions runners

## Commands reviewer đã chạy

| Command                         | Kết quả/exit code | Ghi chú                                                                                            |
| ------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm audit --audit-level=high` | Exit 0            | 0 vulnerabilities found                                                                            |
| `pnpm check`                    | Exit 0            | 18/18 turbo tasks + Prettier format check xanh                                                     |
| `gh pr view 15`                 | Exit 0            | PR #15 mở thành công trên nhánh base `dev`                                                         |
| `gh pr checks 15`               | Exit 0            | 4/4 jobs (`repo-hygiene`, `quality-gates`, `security-scan`, `staging-smoke`) pass trên Action runs |

## Findings

### FINDING-001 — [ROUND 1] `apps/api/src/platform/config.ts` không chấp nhận `NODE_ENV=staging`

- Severity: BLOCKER
- File/dòng: `apps/api/src/platform/config.ts:3-4`, `compose.staging.yml:8`
- Tác động: `loadConfig()` ném ngoại lệ khi khởi động container staging.
- Cách xử lý: Đã thêm `staging` vào `NODE_ENV` schema trong `config.ts` và viết unit test xác thực tại `apps/api/src/__tests__/config.test.ts`.
- Trạng thái: resolved

### FINDING-002 — [ROUND 1] PR CI không kiểm tra Docker/Compose container stack

- Severity: BLOCKER
- File/dòng: `.github/workflows/ci.yml`
- Tác động: Nguy cơ lọt lỗi cấu hình container staging lên nhánh `dev`.
- Cách xử lý: Đã bổ sung job `staging-smoke` vào `.github/workflows/ci.yml` chạy trên mọi PR, build compose stack, đợi healthy, chạy `scripts/smoke-test.mjs`, capture log khi fail và teardown sạch sẽ.
- Trạng thái: resolved

### FINDING-003 — [ROUND 2] Pipeline deploy staging cần cơ chế release artifact và rollback rõ ràng

- Severity: BLOCKER
- File/dòng: `.github/workflows/deploy-staging.yml`
- Tác động: Workflow deploy trước đây chưa cấu hình build artifact theo commit SHA và thiếu kịch bản rollback khi smoke test thất bại.
- Cách xử lý: Đã nâng cấp `deploy-staging.yml` thành 3 jobs tách biệt (`pre-deploy-check`, `build-and-publish-artifacts`, `deploy-and-verify-staging`), gắn tag image bất biến theo `${{ github.sha }}`, tích hợp cơ chế rollback tự động khi deploy smoke test không đạt.
- Trạng thái: resolved

### FINDING-004 — [ROUND 2] Kiểm thử smoke test cần xác thực đồng thời cả 2 services

- Severity: MEDIUM
- File/dòng: `scripts/smoke-test.mjs`
- Tác động: Latching flags độc lập có thể bỏ sót trường hợp một service crash sau khi đã pass tạm thời.
- Cách xử lý: Cập nhật `smoke-test.mjs` yêu cầu đồng thời cả API `/health` và Web shell HTML đều phải hợp lệ trong cùng 1 lần kiểm tra.
- Trạng thái: resolved

## Acceptance criteria

| Criterion                                                   | Pass/Fail/Not verified | Evidence                                                                                                                 |
| ----------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Pipeline deploy staging cho `apps/api` và `apps/web`        | Pass                   | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.staging.yml`, `.github/workflows/deploy-staging.yml`              |
| Cấu hình quản trị qua env/secrets, không hard-code          | Pass                   | Cấu hình qua environment variables (`NODE_ENV=production`, `DEPLOY_ENV=staging`, `PORT`, `HOST`), không hard-code secret |
| Tự động chạy smoke test sau deploy (`/health` và shell web) | Pass                   | Script `scripts/smoke-test.mjs` kiểm tra đồng thời API `/health` và Web shell HTML                                       |
| Cơ chế rollback/thông báo lỗi khi smoke test fail           | Pass                   | `deploy-staging.yml` tự động capture diagnostic logs và thực thi rollback sequence khi failure                           |
| Không có secret trong log/artifact                          | Pass                   | Gitleaks scan và `pnpm audit` chạy sạch sẽ 100%                                                                          |
| PR CI kiểm tra staging smoke test                           | Pass                   | Job `staging-smoke` trong `.github/workflows/ci.yml` kiểm thử toàn bộ container stack trên PR                            |

## Kiểm tra regression

- Các unit tests, integration tests và static builds của `apps/web`, `apps/api`, `packages/shared`, `packages/api-client` tiếp tục pass 100%.

## Kết luận

- Verdict: resolved_pending_re-review
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: —
- Lý do kết luận: Đã hoàn thiện toàn diện pipeline staging deployment với immutable artifacts theo SHA, cơ chế rollback khi smoke fail, kiểm thử đồng thời trong smoke test script, sẵn sàng cho Round 3 re-review.
