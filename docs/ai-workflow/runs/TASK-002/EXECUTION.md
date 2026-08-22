# Execution log — TASK-002

## Metadata

- Task: TASK-002 — Decision backlog và phạm vi MVP
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-002-decision-backlog-and-mvp-scope`
- Base commit: `40c71b7b0a701977759ad23419992c90fbfa775d`
- Started at (UTC): 2026-08-21T16:04:00Z
- Completed at (UTC): 2026-08-22T07:05:00Z
- Status: completed

## Inputs đã đọc

- [x] Root `AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (tạo mới trong task này)
- [x] Requirement liên quan (`docs/requirements/role-management.md`, `service-plans.md`, `i18n.md`, `prototype-feature-inventory.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-002--decision-backlog-và-phạm-vi-mvp`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Thiết lập `docs/decision-backlog.md` đóng vai trò nguồn sự thật cho các quyết định kiến trúc và nghiệp vụ.
- Quy định chi tiết 13 quyết định cốt lõi: phân quyền SaaS platform vs tenant, phạm vi chi nhánh/kho, thời điểm reserve/trừ tồn, chính sách xuất âm/backorder, state machine đơn hàng, hủy/bù trừ chứng từ, thanh toán từng phần & sổ nợ kép, thuế VAT, phương pháp tính giá vốn bình quân gia quyền, phân quyền chiết khấu, hạn mức công nợ khách hàng, chuyển kho 2 bước, chính sách soft-delete.
- Mọi mục `Open` đều có **Temporary Assumption** an toàn để không chặn scaffold và code; thiết lập SLA duyệt ≤ 2 ngày làm việc.
- Ánh xạ rõ ma trận Blocker của các quyết định đối với các Milestone M1, M2, M3, M4.
- Cập nhật tài liệu dẫn chiếu `AGENTS.md`, `docs/README.md`, `CURRENT.md`.
- Ghi nhận Execution log và Review log theo đúng template quy chuẩn.
- Mở PR độc lập vào base `dev`.

### Ngoài phạm vi

- Không tự ý chuyển bất kỳ mục `Open` nào thành `Accepted` (chỉ ghi nhận `Accepted` cho các quyết định đã chốt trong `AGENTS.md`).
- Không scaffold code runtime hoặc sửa đổi DB/API trước khi có task triển khai tương ứng.

## Kế hoạch trước khi sửa

1. Tạo nhánh `task/TASK-002-decision-backlog-and-mvp-scope` từ `dev`.
2. Tạo mới `docs/decision-backlog.md` với 13 quyết định chuẩn hóa.
3. Cập nhật `docs/README.md` và `AGENTS.md`.
4. Tạo `docs/ai-workflow/runs/TASK-002/EXECUTION.md` và `docs/ai-workflow/runs/TASK-002/REVIEW.md`.
5. Cập nhật `docs/tasks/CURRENT.md` sang trạng thái `ready_for_review`.
6. Tự kiểm tra diff và liên kết markdown.

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                                                                         | Căn cứ                                                | Ảnh hưởng                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2026-08-21 | Đặt 12 quyết định nghiệp vụ/kiến trúc mở ở trạng thái `Open` kèm `Temporary Assumption`                                          | Quy định MVP-BACKLOG.md không được tự chốt thay owner | Đảm bảo tiến độ scaffold M0/M1 không bị đình trệ; owner có SLA 2 ngày để điều chỉnh |
| 2026-08-21 | Ghi nhận `DEC-006` là `Accepted` (Chính sách hủy/hoàn tác bù trừ không xóa cứng)                                                 | Đã được chốt trong quy chuẩn bất biến của AGENTS.md   | Đồng bộ nguồn sự thật immutable ledger và audit trail                               |
| 2026-08-22 | Đồng bộ State Machine 8 trạng thái (DEC-004 & DEC-005), khóa điểm trừ kho duy nhất (DEC-003) và mở rộng ma trận Blocker đủ M1-M4 | GPT Web Review Round 1                                | Đảm bảo tính tất định cho tầng nghiệp vụ và backend implementation                  |

## Thay đổi đã thực hiện

| File/khu vực                                  | Thay đổi                                                                                                                             | Lý do                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `docs/decision-backlog.md`                    | Tạo mới danh mục 13 quyết định kiến trúc/nghiệp vụ (FSM 8 trạng thái, điểm trừ kho duy nhất, ma trận blocker M1–M4 và quy trình SLA) | Hoàn thành output bắt buộc của TASK-002          |
| `docs/README.md`                              | Cập nhật mục 3 liên kết tới `docs/decision-backlog.md`                                                                               | Giữ bản đồ tài liệu nhất quán                    |
| `AGENTS.md`                                   | Cập nhật trạng thái tiến độ mục 10                                                                                                   | Phản ánh chính xác tiến độ repo                  |
| `docs/ai-workflow/runs/TASK-002/EXECUTION.md` | Tạo execution log                                                                                                                    | Theo dõi quá trình thực thi theo quy trình 2-bot |
| `docs/ai-workflow/runs/TASK-002/REVIEW.md`    | Tạo review log                                                                                                                       | Chuẩn bị hồ sơ cho Bot 2 review                  |
| `docs/tasks/CURRENT.md`                       | Cập nhật trạng thái `TASK-002`                                                                                                       | Cập nhật bảng task active                        |

## Migration/contract/generated artifacts

- OpenAPI: Chưa áp dụng (TASK-007).
- Migration: Chưa áp dụng (TASK-008).
- Generated client: Chưa áp dụng (TASK-007).
- Compatibility/rollback: Rollback an toàn 100% bằng cách revert commit trên branch task.

## Kiểm tra đã chạy

| Command                  | Kết quả/exit code | Ghi chú                                          |
| ------------------------ | ----------------- | ------------------------------------------------ |
| `git status`             | Exit 0            | Các file tài liệu được thêm và chỉnh sửa sạch sẽ |
| `git log -n 3 --oneline` | Exit 0            | Base commit từ `dev` tại commit `40c71b7`        |

## Self-review

- [x] Diff đúng phạm vi task.
- [x] Không có secret/PII.
- [x] Không tự ý đổi mục Open thành Accepted mà có temporary assumption bắt buộc.
- [x] Toàn bộ 13 quyết định được cấu trúc chi tiết, đầy đủ options, recommendation và blocker mapping.
- [x] Docs và trạng thái được cập nhật đồng bộ.

## Rủi ro và nợ còn lại

- Các mục `Open` cần được Human Owner rà soát trong SLA 2 ngày làm việc. Nếu owner có điều chỉnh, cập nhật assumption trước khi bước vào milestone tương ứng.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: [#8](https://github.com/HomyHubs/vlxd/pull/8)
- Final status: `ready_for_review`
- Output chính: `docs/decision-backlog.md`
- Reviewer cần tập trung:
  - Kiểm tra tính đầy đủ của 13 quyết định so với danh sách yêu cầu trong `MVP-BACKLOG.md`.
  - Kiểm tra tính hợp lý của các Temporary Assumption.
  - Kiểm tra ma trận blocker theo từng milestone.
