# Review report — TASK-002

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR: [#10](https://github.com/HomyHubs/vlxd/pull/10)
- Reviewed at (UTC): 2026-08-22T05:52:00Z
- Review round: 2 (re-review)
- Verdict: ready_for_re_review

## Phạm vi đã kiểm tra

- [x] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-002--decision-backlog-và-phạm-vi-mvp`)
- [x] Requirements liên quan (`docs/requirements/prototype-feature-inventory.md`, `role-management.md`, `service-plans.md`, `i18n.md`)
- [x] Execution log (`docs/ai-workflow/runs/TASK-002/EXECUTION.md`)
- [x] Toàn bộ diff (`git diff dev...HEAD`)
- [x] Tính đầy đủ của 13 quyết định trong `docs/decision-backlog.md`
- [x] Sự hiện diện bắt buộc của Temporary Assumption cho 12 mục Open
- [x] Quy tắc AI không tự ý chốt Open $\rightarrow$ Accepted
- [x] Tính nhất quán giữa DEC-004 và DEC-005 (FSM 8 trạng thái gồm BACKORDER $\rightarrow$ CONFIRMED $\rightarrow$ PROCESSING)
- [x] Tính tất định và không rò rỉ của sự kiện giữ chỗ và trừ kho thực tế trong DEC-003 và DEC-005 ($0 \le \text{reserved} \le \text{on\_hand}$)
- [x] Ma trận Blocker bao quát đủ Milestone M1–M4 khớp 100% mã task trong `docs/tasks/MVP-BACKLOG.md` (TASK-021, TASK-022, TASK-024, TASK-025, TASK-027)
- [x] Không có secret / PII / cấu hình ngoài phạm vi task (.agents/ đã được gitignore)
- [x] Tính nhất quán của tài liệu (`AGENTS.md`, `README.md`, `docs/README.md`)

## Commands reviewer đã chạy

| Command | Kết quả/exit code | Ghi chú |
| --- | --- | --- |
| `git diff dev...HEAD --stat` | Exit 0 | `docs/decision-backlog.md` và các tài liệu liên quan được cập nhật chính xác |
| `gh pr checks 10` | Exit 0 | GitHub Actions CI (Repo Integrity & Hygiene) 100% xanh |

## Findings & Resolutions

### FINDING-001 — [RESOLVED] Đồng bộ State Machine DEC-004 và DEC-005
- Severity: HIGH
- Nội dung: Tích hợp `BACKORDER` vào luồng 8 trạng thái chính thức của đơn hàng bán; luồng FSM yêu cầu `BACKORDER` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` (khi hàng nhập kho về, chuyển sang `CONFIRMED` sẽ tự động thực hiện `reserved += qty`).
- Trạng thái: resolved

### FINDING-002 — [RESOLVED] Chuẩn hóa duy nhất 1 điểm trừ kho thực tế DEC-003 & DEC-005 và giải phóng reserved tại POS
- Severity: HIGH
- Nội dung: Đơn giao hàng trừ kho thực tế (`on_hand -= qty, reserved -= qty`) duy nhất tại `DELIVERING`. Đơn bán lẻ tại quầy/POS đã qua giữ chỗ sẽ trừ đồng thời `on_hand -= qty, reserved -= qty` tại `COMPLETED`, loại bỏ hoàn toàn rò rỉ reserved.
- Trạng thái: resolved

### FINDING-003 — [RESOLVED] Khớp chính xác mã task Milestone M4 trong Ma trận Blocker
- Severity: HIGH
- Nội dung: Cập nhật mã task trong bảng tóm tắt và sơ đồ Mermaid khớp chính xác với `docs/tasks/MVP-BACKLOG.md`:
  - `TASK-021`: Purchase and receiving (M3)
  - `TASK-022`: Reporting (M4)
  - `TASK-024`: Settings, numbering and print templates (M4)
  - `TASK-025`: Yard map and unit converter hardening (M4)
  - `TASK-027`: Security, E2E, deployment readiness (M4)
- Trạng thái: resolved

### FINDING-004 — [RESOLVED] Hồ sơ Review và Provenance
- Severity: MEDIUM
- Nội dung: Ghi nhận PR #10 và các vòng review với bằng chứng kiểm tra đầy đủ.
- Trạng thái: resolved

## Acceptance criteria

| Criterion | Pass/Fail/Not verified | Evidence |
| --- | --- | --- |
| Không còn business blocker cứng làm gián đoạn scaffold | Pass | 12 mục Open đều có Temporary Assumption an toàn, khả thi |
| AI không tự ý chốt Open thành Accepted | Pass | Chỉ DEC-006 (quy chuẩn bất biến AGENTS.md) là Accepted |
| Danh mục bao quát đủ 13 quyết định cốt lõi ngành VLXD | Pass | `docs/decision-backlog.md` bao quát từ Auth, Kho, Đơn hàng, Kế toán, Thuế, Soft-delete |
| Có ma trận ánh xạ Blocker trước từng Feature/Milestone | Pass | Mermaid diagram và bảng ánh xạ Milestone M1–M4 đầy đủ 100% khớp MVP-BACKLOG.md |
| Toàn bộ liên kết tài liệu không bị hỏng (no broken links) | Pass | `docs/README.md`, `AGENTS.md`, `CURRENT.md` đồng bộ 100% |

## Kiểm tra regression

- Không có code logic nào bị thay đổi; toàn bộ 13 quyết định và ma trận chuyển đổi FSM nhất quán 100%.

## Kết luận

- Verdict: ready_for_re_review
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: —
- Lý do kết luận: Toàn bộ 4 phát hiện từ GPT Web Review Round 2 đã được khắc phục triệt để và đồng bộ.


