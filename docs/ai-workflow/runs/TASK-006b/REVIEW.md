# Review report — TASK-006b

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR/commit reviewed: [#15](https://github.com/HomyHubs/vlxd/pull/15)
- Reviewed commits:
  - Round 1 (PR #15): `9d3bb7f33c6b53b60d4cd0b2f2871da6344c2d8d`
  - Round 2 (PR #15): `004ec0d665b9e7a0bd7a6d0b4a478c9ee2e6e977`
  - Round 3 (PR #15): `b5746417cabf71c61c88ef5807cb84a28e9d925b`
  - Round 4 (PR #15): `0024f45191105df59eee1eb691756193633d1910`
  - Round 5 (PR #15): `5ced05dec7661a9ff1c81221e642117d02314ece`
  - Round 6 (PR #15): `e2e35b2ec629851075599fdec15b36127e0bcc86`
  - Round 7 (PR #15): `c0c1299a2232435618d8eafcf453e64003a5e03d`
  - Round 8 (PR #15): `a0c9a39021a96bd268108a5be5d48f2f84089d2d`
  - Round 9 (PR #15): `21c83e2d0ebb3f5f018990d8ebd24cf225b2aabf`
  - Round 10 (PR #15): `ff59b9bb574f23d48ece544443d1456dd7d93ea5`
  - Round 11 (PR #15): `d1a75fdc634e200fcee77638a7387dd92453acd6`
  - Round 12 (PR #15): `fc0d19531150248ff89038706fa5db603839677c`
- Reviewed at (UTC): 2026-08-23T01:46:00Z
- Review round: 12
- Verdict: changes_required (Round 12) -> pending re-review (Round 13)

## Phạm vi đã kiểm tra

- [x] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-006b--staging-smoke-deploy-m0-baseline`)
- [x] Dockerfile cho `apps/api` và `apps/web` (multi-stage build, unprivileged user, lean Alpine image)
- [x] Cấu hình `compose.staging.yml` (parameterized `image: ${API_IMAGE}` / `${WEB_IMAGE}`) & `nginx/staging.conf`
- [x] Script automated smoke test `scripts/smoke-test.mjs` (timeout, retry delay, concurrent status assertions qua `Promise.allSettled`)
- [x] Workflow `.github/workflows/deploy-staging.yml` (GHCR image candidate publishing, explicit image passing to Compose, verified rollback không nuốt lỗi, OCI imagetools manifest promotion có compensation recovery, release manifest artifact upload, và strict sorted image set assertion)
- [x] Workflow `.github/workflows/ci.yml` (PR staging smoke container integration job)
- [x] Execution log (`docs/ai-workflow/runs/TASK-006b/EXECUTION.md`)
- [x] Toàn bộ diff (`git diff dev...HEAD`)
- [x] Không có secret / PII / hard-coded credentials / shell injection
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

### FINDING-003 — [ROUND 2 & 3] Pipeline deploy staging cần publish registry image bất biến và pull-based deploy

- Severity: BLOCKER
- File/dòng: `.github/workflows/deploy-staging.yml`
- Tác động: Workflow deploy trước đây chỉ build local trên runner tách biệt khiến downstream job không truy cập được và thiếu rollback thực sự.
- Cách xử lý: Đã nâng cấp `deploy-staging.yml` publish ảnh bất biến lên GHCR (`ghcr.io/.../api:${{ github.sha }}` và `web:${{ github.sha }}`), pull ảnh chính xác trong job deploy, và hỗ trợ rollback an toàn bằng commit SHA hoặc previous staging release tag.
- Trạng thái: resolved

### FINDING-004 — [ROUND 4] Cấu hình `image:` trong `compose.staging.yml` và tag promotion an toàn

- Severity: BLOCKER
- File/dòng: `compose.staging.yml:1-32`, `.github/workflows/deploy-staging.yml`
- Tác động: `compose.staging.yml` thiếu `image:`, Compose mặc định tìm `:latest` khi chạy `--no-build`. Tag `:staging` bị ghi đè trước khi kiểm thử khiến không thể rollback.
- Cách xử lý: Thêm `image: ${API_IMAGE}` / `image: ${WEB_IMAGE}`, gắn tag candidate `:staging-candidate` khi build, loại bỏ `|| true` trong bước rollback và thực hiện tái kiểm tra smoke test.
- Trạng thái: resolved

### FINDING-005 — [ROUND 5-12] OCI Imagetools manifest promotion có compensation recovery, release manifest artifact và least-privilege permissions

- Severity: BLOCKER
- File/dòng: `.github/workflows/deploy-staging.yml:155-265`
- Tác động: Hoàn thiện quy trình tag promotion sang `docker buildx imagetools create` có compensation recovery, lưu release manifest bằng `actions/upload-artifact@v4`, thu gọn permissions về `contents: read`, `packages: write`, và so khớp toàn bộ tập images bằng sorted comparison.
- Cách xử lý: Sử dụng `docker buildx imagetools create` cho OCI manifest promotion có compensation recovery, tạo và upload release manifest artifact, so khớp toàn bộ tập images bằng sorted comparison, và chuẩn hóa endpoint smoke test thống nhất.
- Trạng thái: resolved

## Acceptance criteria

| Criterion                                                   | Pass/Fail/Not verified | Evidence                                                                                                                 |
| ----------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Pipeline deploy staging cho `apps/api` và `apps/web`        | Pass                   | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.staging.yml`, `.github/workflows/deploy-staging.yml`              |
| Cấu hình quản trị qua env/secrets, không hard-code          | Pass                   | Cấu hình qua environment variables (`NODE_ENV=production`, `DEPLOY_ENV=staging`, `PORT`, `HOST`), không hard-code secret |
| Tự động chạy smoke test sau deploy (`/health` và shell web) | Pass                   | Script `scripts/smoke-test.mjs` kiểm tra đồng thời API `/health` và Web shell HTML qua `Promise.allSettled`              |
| Cơ chế rollback/thông báo lỗi khi smoke test fail           | Pass                   | `deploy-staging.yml` tự động rollback về `:staging` hoặc 40-char SHA và compensation rollback khi promotion lỗi          |
| Không có secret trong log/artifact                          | Pass                   | Gitleaks scan và `pnpm audit` chạy sạch sẽ 100%                                                                          |
| PR CI kiểm tra staging smoke test                           | Pass                   | Job `staging-smoke` trong `.github/workflows/ci.yml` kiểm thử toàn bộ container stack trên PR                            |

## Kiểm tra regression

- Các unit tests, integration tests và static builds của `apps/web`, `apps/api`, `packages/shared`, `packages/api-client` tiếp tục pass 100%.

## Kết luận

- Verdict: resolved_pending_re-review
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: —
- Lý do kết luận: Đã hoàn thiện toàn diện pipeline staging deployment với OCI imagetools manifest promotion có compensation recovery, release manifest artifact upload, sẵn sàng cho Round 13 re-review.
