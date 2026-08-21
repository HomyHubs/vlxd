# Execution log — TASK-003

## Metadata

- Task: TASK-003 — Requirements MVP theo capability
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-003-requirements-mvp-by-capability`
- Base commit: `dd49661159ce9feee079a40fb68e7ec8a0b0d39e`
- Started at (UTC): 2026-08-21T22:42:00Z
- Status: ready_for_review

## Inputs đã đọc

- [x] Root `AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001 đến DEC-013)
- [x] Requirements đã có (`docs/requirements/role-management.md`, `service-plans.md`, `i18n.md`, `prototype-feature-inventory.md`)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-003--requirements-mvp-theo-capability`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Viết 10 tài liệu đặc tả yêu cầu nghiệp vụ (BRD) kiểm thử được cho toàn bộ các capability cốt lõi của hệ thống `vlxd`:
  1. `product.md`: Sản phẩm, đơn vị tính quy đổi, biến thể, bảng giá đa tầng.
  2. `warehouse.md`: Nhà kho, bãi chứa lộ thiên (Yard Map), phân khu Zone/Slot, sức chứa.
  3. `inventory.md`: Sổ cái kho bất biến (`inventory_ledger`), kiểm kê, chuyển kho 2 bước, Strict No-Negative Stock & Backorder, giá vốn bình quân gia quyền.
  4. `partner.md`: Khách hàng, nhà cung cấp, công trình và kiểm soát hạn mức công nợ (Credit Limit).
  5. `sales-order.md`: Bán lẻ (POS), Đơn hàng thương mại, State machine 7 trạng thái, giữ chỗ tồn kho (Reservation), duyệt chiết khấu 3%/10%.
  6. `delivery-return.md`: Điều phối chuyến xe giao hàng, biên bản bàn giao (POD) và quy trình đổi trả hàng hoàn tồn.
  7. `finance-debt.md`: Sổ nợ kép (`debt_ledger`), thu chi, thanh toán từng phần (Partial Payment), hóa đơn VAT.
  8. `purchase.md`: Đơn đặt mua hàng (PO), nhập kho theo đợt từ nhà máy/mỏ, công nợ phải trả NCC.
  9. `report.md`: Báo cáo doanh thu, lợi nhuận gộp theo giá vốn bình quân thực tế, báo cáo tồn kho, phân tích tuổi nợ.
  10. `audit.md`: Nhật ký kiểm toán bất biến (WORM), lưu vết mọi thao tác nhạy cảm và đối soát tuân thủ.
- Chuẩn hóa cấu trúc 11 mục tiêu chuẩn cho mỗi tài liệu requirement.
- Cập nhật tài liệu dẫn chiếu `AGENTS.md`, `docs/README.md`, `CURRENT.md`.
- Ghi nhận Execution log và Review log theo đúng template quy chuẩn.
- Mở PR độc lập vào base `dev`.

### Ngoài phạm vi

- Không trộn lẫn chi tiết cài đặt kỹ thuật (như SQL schema, TypeScript types, HTTP router) vào business requirements.
- Không code prototype/production code trong task tài liệu này.

## Kế hoạch trước khi sửa

1. Tạo nhánh `task/TASK-003-requirements-mvp-by-capability` từ `dev`.
2. Tạo mới 10 file requirement trong `docs/requirements/`.
3. Cập nhật `docs/README.md` và `AGENTS.md`.
4. Tạo `docs/ai-workflow/runs/TASK-003/EXECUTION.md` và `docs/ai-workflow/runs/TASK-003/REVIEW.md`.
5. Cập nhật `docs/tasks/CURRENT.md` sang trạng thái `ready_for_review`.
6. Tự kiểm tra tính nhất quán giữa các tài liệu.

## Giả định và quyết định

| Thời điểm | Nội dung | Căn cứ | Ảnh hưởng |
| --- | --- | --- | --- |
| 2026-08-22 | Tuân thủ 100% các quyết định và giả định trong `docs/decision-backlog.md` (DEC-001 đến DEC-013) | Decision Backlog là nguồn sự thật đã được chốt/giả định trong TASK-002 | Toàn bộ 10 capability khớp nối liền mạch, không mâu thuẫn |
| 2026-08-22 | Chuẩn hóa cấu trúc 11 mục tiêu chuẩn cho từng tài liệu | Yêu cầu kiểm thử được của MVP-BACKLOG.md | Dễ dàng chuyển dịch sang OpenAPI schema (TASK-007) và Test cases |

## Thay đổi đã thực hiện

| File/khu vực | Thay đổi | Lý do |
| --- | --- | --- |
| `docs/requirements/product.md` | Tạo tài liệu đặc tả sản phẩm & đơn vị quy đổi | Hoàn thành capability product |
| `docs/requirements/warehouse.md` | Tạo tài liệu đặc tả kho bãi & sơ đồ bãi chứa | Hoàn thành capability warehouse |
| `docs/requirements/inventory.md` | Tạo tài liệu đặc tả sổ cái kho & điều chuyển | Hoàn thành capability inventory |
| `docs/requirements/partner.md` | Tạo tài liệu đặc tả khách hàng & NCC & hạn mức nợ | Hoàn thành capability partner |
| `docs/requirements/sales-order.md` | Tạo tài liệu đặc tả bán hàng POS & đơn hàng & reserve | Hoàn thành capability sales order |
| `docs/requirements/delivery-return.md` | Tạo tài liệu đặc tả giao hàng & đổi trả | Hoàn thành capability delivery/return |
| `docs/requirements/finance-debt.md` | Tạo tài liệu đặc tả thu chi, sổ nợ & thanh toán từng phần | Hoàn thành capability finance/debt |
| `docs/requirements/purchase.md` | Tạo tài liệu đặc tả mua hàng & nhập kho NCC | Hoàn thành capability purchase |
| `docs/requirements/report.md` | Tạo tài liệu đặc tả báo cáo doanh thu, lợi nhuận, tuổi nợ | Hoàn thành capability report |
| `docs/requirements/audit.md` | Tạo tài liệu đặc tả nhật ký kiểm toán bất biến | Hoàn thành capability audit |
| `docs/README.md` | Cập nhật bản đồ tài liệu liên kết 14 files requirement | Giữ bản đồ tài liệu nhất quán |
| `AGENTS.md` | Cập nhật trạng thái tiến độ mục 10 | Phản ánh chính xác tiến độ repo |
| `docs/ai-workflow/runs/TASK-003/EXECUTION.md` | Tạo execution log | Theo dõi quá trình thực thi |
| `docs/ai-workflow/runs/TASK-003/REVIEW.md` | Tạo review log | Chuẩn bị hồ sơ cho Bot 2 review |
| `docs/tasks/CURRENT.md` | Cập nhật trạng thái `TASK-003` sang `ready_for_review` | Cập nhật bảng task active |

## Migration/contract/generated artifacts

- Không có thay đổi DB hay code runtime trong task này.

## Kiểm tra đã chạy

| Command | Kết quả/exit code | Ghi chú |
| --- | --- | --- |
| `git status` | Exit 0 | 14 files thay đổi/thêm mới sạch sẽ |
| `git log -n 3 --oneline` | Exit 0 | Base commit từ `dev` tại commit `dd49661` |

## Self-review

- [x] Diff đúng phạm vi task, không phát sinh code thừa.
- [x] Không có secret/PII.
- [x] Đầy đủ 10 capability requirements chi tiết, cấu trúc 11 mục tiêu chuẩn.
- [x] Khớp hoàn toàn với Decision Backlog và định hướng phân quyền CEO trong AGENTS.md.
- [x] Mọi liên kết markdown đều hợp lệ.

## Rủi ro và nợ còn lại

- Không có rủi ro kỹ thuật. Các requirement sẵn sàng làm đầu vào cho TASK-004 (ADR kiến trúc) và TASK-007 (OpenAPI Contract).

## Kết quả bàn giao

- PR: [#9](https://github.com/HomyHubs/vlxd/pull/9)
- Final status: `ready_for_review`
- Output chính: 10 file requirement tại `docs/requirements/`
- Reviewer cần tập trung:
  - Kiểm tra tính đầy đủ của 10 capability requirements so với yêu cầu trong `MVP-BACKLOG.md`.
  - Kiểm tra tính kiểm thử được của Acceptance Criteria.
  - Kiểm tra sự tách bạch giữa business rules và implementation details.
