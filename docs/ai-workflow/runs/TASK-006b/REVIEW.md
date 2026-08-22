# Review report — TASK-006b

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR/commit reviewed:
- Reviewed at (UTC):
- Review round: 1
- Verdict: pending

## Phạm vi đã kiểm tra

- [ ] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-006b--staging-smoke-deploy-mới`)
- [ ] Dockerfile cho `apps/api` và `apps/web` (multi-stage build, unprivileged user, lean image)
- [ ] Cấu hình `compose.staging.yml` & `nginx/staging.conf`
- [ ] Script kiểm tra smoke test `scripts/smoke-test.mjs`
- [ ] Workflow `.github/workflows/deploy-staging.yml` (triggers, steps, secret handling, rollback/failure handling)
- [ ] Execution log (`docs/ai-workflow/runs/TASK-006b/EXECUTION.md`)
- [ ] Toàn bộ diff (`git diff dev...HEAD`)
- [ ] Không có secret / PII / hard-coded credentials

## Commands reviewer đã chạy

| Command | Kết quả/exit code | Ghi chú |
| ------- | ----------------- | ------- |
|         |                   |         |

## Findings

### FINDING-001 — [PENDING]

- Severity: LOW
- File/dòng hoặc bằng chứng:
- Tác động:
- Cách tái hiện/phân tích:
- Yêu cầu sửa:
- Trạng thái: open
- Bằng chứng re-review:

## Acceptance criteria

| Criterion                                                   | Pass/Fail/Not verified | Evidence |
| ----------------------------------------------------------- | ---------------------- | -------- |
| Pipeline deploy staging cho `apps/api` và `apps/web`        | Not verified           |          |
| Cấu hình quản trị qua env/secrets, không hard-code          | Not verified           |          |
| Tự động chạy smoke test sau deploy (`/health` và shell web) | Not verified           |          |
| Cơ chế rollback/thông báo lỗi khi smoke test fail           | Not verified           |          |
| Không có secret trong log/artifact                          | Not verified           |          |

## Kiểm tra regression

-

## Kết luận

- Verdict: pending
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: —
- Lý do kết luận: Đang chờ hoàn tất implementation.
