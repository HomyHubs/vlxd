# Current tasks

> Theo mô hình milestone + lane trong `docs/tasks/MVP-BACKLOG.md`. Mỗi lane tối đa **1 task `active`**; nhiều lane có thể active đồng thời sau khi nền tảng (LANE-CORE) mở khóa. Giai đoạn M0–M1 (LANE-CORE) là **tuần tự nghiêm ngặt**.

- Milestone hiện tại: **M0 — Foundation guardrails**
- Base branch: `dev`
- Last updated: 2026-08-21

## Bảng lane

| Lane | Task active | Tiêu đề | Status | PR | Reviewer |
| --- | --- | --- | --- | --- | --- |
| `LANE-CORE` | `TASK-002` | Decision backlog và phạm vi MVP | `ready_for_review` | [#8](https://github.com/HomyHubs/vlxd/pull/8) | AI Bot 2 / GPT Web Review |
| `LANE-CATALOG` | — | — | `blocked` (chờ M1) | — | — |
| `LANE-CRM` | — | — | `blocked` (chờ TASK-013) | — | — |
| `LANE-COMMERCE` | — | — | `blocked` (chờ M2) | — | — |
| `LANE-PLATFORMUI` | — | — | `blocked` (chờ TASK-007 + TASK-010b) | — | — |
| `LANE-QUALITY` | — | — | `blocked` (chạy tăng dần theo UI slice) | — | — |

### Chi tiết task active

- **`TASK-002` · `LANE-CORE`**
  - Task packet: `docs/tasks/MVP-BACKLOG.md#task-002--decision-backlog-và-phạm-vi-mvp`
  - Prerequisite: `TASK-001` (accepted & merged via [#6](https://github.com/HomyHubs/vlxd/pull/6))
  - Implementer PR: [#8](https://github.com/HomyHubs/vlxd/pull/8) (`task/TASK-002-decision-backlog-and-mvp-scope` -> `dev`)
  - Reviewer: AI Bot 2 (Reviewer) / GPT Web Review

## Quy tắc cập nhật

- Mỗi lane chỉ một task `active` tại một thời điểm (WIP limit = 1/lane).
- LANE-CORE tuần tự nghiêm ngặt; không mở task lane khác khi prerequisite chưa `accepted`.
- Task đã chẻ (008, 010, 011, 014, 016, 018, 020...) được giao theo sub-ID (vd `TASK-016a`), không giao cả epic.
- Bot 1 (implementer) cập nhật trạng thái đến `ready_for_review` / `ready_for_re_review`.
- Bot 2 (reviewer) cập nhật `changes_requested`, `accepted` hoặc `blocked`.
- Chỉ sau khi PR của task hiện tại merge, owner hoặc bot được chỉ định mới mở task kế tiếp trong lane tương ứng theo `MVP-BACKLOG.md`.
- Khi một prerequisite được `accepted` làm mở khóa một lane, chuyển lane đó từ `blocked` sang task active tương ứng.
