# Current tasks

> Theo mô hình milestone + lane trong `docs/tasks/MVP-BACKLOG.md`. Mỗi lane tối đa **1 task `active`**; nhiều lane có thể active đồng thời sau khi nền tảng (LANE-CORE) mở khóa. Giai đoạn M0–M1 (LANE-CORE) là **tuần tự nghiêm ngặt**.

- Milestone hiện tại: **M1 — Platform core**
- Base branch: `dev`
- Last updated: 2026-08-23

## Bảng lane

| Lane              | Task active | Tiêu đề                                            | Status                                  | PR                                            | Reviewer             |
| ----------------- | ----------- | -------------------------------------------------- | --------------------------------------- | --------------------------------------------- | -------------------- |
| `LANE-CORE`       | —           | —                                                  | `idle` (chờ TASK-011a)                  | —                                             | —                    |
| `LANE-CATALOG`    | —           | —                                                  | `blocked` (chờ M1)                      | —                                             | —                    |
| `LANE-CRM`        | —           | —                                                  | `blocked` (chờ TASK-013)                | —                                             | —                    |
| `LANE-COMMERCE`   | —           | —                                                  | `blocked` (chờ M2)                      | —                                             | —                    |
| `LANE-PLATFORMUI` | `TASK-010b` | Frontend login shell & reactive session management | `ready_for_review`                      | [#22](https://github.com/HomyHubs/vlxd/pull/22) | AI Bot 2 (Reviewer) |
| `LANE-QUALITY`    | —           | —                                                  | `blocked` (chạy tăng dần theo UI slice) | —                                             | —                    |

### Chi tiết task active

- **`TASK-010b` · `LANE-PLATFORMUI`**
  - Task packet: `docs/tasks/MVP-BACKLOG.md#task-010--authentication-v%C3%A0-session--lane-core-ch%E1%BA%BB-2-pr`
  - Prerequisite: `TASK-010a` (merged via [#21](https://github.com/HomyHubs/vlxd/pull/21))
  - Implementer PR: [#22](https://github.com/HomyHubs/vlxd/pull/22) (`task/TASK-010b-frontend-login-shell`)
  - Reviewer: AI Bot 2 (Reviewer)

## Quy tắc cập nhật

- Mỗi lane chỉ một task `active` tại một thời điểm (WIP limit = 1/lane).
- LANE-CORE tuần tự nghiêm ngặt; không mở task lane khác khi prerequisite chưa `accepted`.
- Task đã chẻ (008, 010, 011, 014, 016, 018, 020...) được giao theo sub-ID (vd `TASK-016a`), không giao cả epic.
- Bot 1 (implementer) cập nhật trạng thái đến `ready_for_review` / `ready_for_re_review`.
- Bot 2 (reviewer) cập nhật `changes_requested`, `accepted` hoặc `blocked`.
- Chỉ sau khi PR của task hiện tại merge, owner hoặc bot được chỉ định mới mở task kế tiếp trong lane tương ứng theo `MVP-BACKLOG.md`.
- Khi một prerequisite được `accepted` làm mở khóa một lane, chuyển lane đó từ `blocked` sang task active tương ứng.
