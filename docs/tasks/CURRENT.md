# Current tasks

> Theo mô hình milestone + lane trong `docs/tasks/MVP-BACKLOG.md`. Mỗi lane tối đa một task `active`; LANE-CORE triển khai tuần tự nghiêm ngặt.

- Milestone hiện tại: **M1 — Platform core**
- Base branch: `dev`
- Last updated: 2026-08-25

## Bảng lane

| Lane | Task active | Tiêu đề | Status | PR | Reviewer |
| --- | --- | --- | --- | --- | --- |
| `LANE-CORE` | `TASK-011a` | Capability authorization engine | `in_progress` | — | Codex / Agent B |
| `LANE-CATALOG` | — | — | `blocked` (chờ M1) | — | — |
| `LANE-CRM` | — | — | `blocked` (chờ TASK-013) | — | — |
| `LANE-COMMERCE` | — | — | `blocked` (chờ M2) | — | — |
| `LANE-PLATFORMUI` | — | — | `idle` (TASK-010b accepted và merged) | [#22](https://github.com/HomyHubs/vlxd/pull/22) | AI Bot 2 (Reviewer) |
| `LANE-QUALITY` | — | — | `blocked` (chạy tăng dần theo UI slice) | — | — |

### Chi tiết task active

- **`TASK-011a` · `LANE-CORE`**
  - Task packet: `docs/tasks/MVP-BACKLOG.md` — TASK-011, Authorization engine.
  - Prerequisite: TASK-010 accepted (`TASK-010a` và `TASK-010b` đã merge).
  - Implementer branch: `task/TASK-011a-authorization-engine`.
  - Status: `in_progress`.

## Quy tắc cập nhật

- Mỗi lane chỉ một task `active` tại một thời điểm.
- LANE-CORE tuần tự nghiêm ngặt; không mở lane khác khi prerequisite chưa accepted.
- Bot 1 cập nhật trạng thái đến `ready_for_review` / `ready_for_re_review`.
- Bot 2 cập nhật `changes_requested`, `accepted` hoặc `blocked`.
- Chỉ mở task tiếp theo sau khi PR task hiện tại được accepted và merged.
