# Tài liệu dự án vlxd

Tài liệu thiết kế kiến trúc, yêu cầu nghiệp vụ và quy trình phát triển dự án `vlxd`.

## 1. Yêu cầu sản phẩm & Nghiệp vụ (`docs/requirements/`)

### Nền tảng & Quản trị chung
- `requirements/prototype-feature-inventory.md` — Bảng đối soát chi tiết tính năng giữa prototype AI Studio và production.
- `requirements/role-management.md` — Thiết kế role, title, user và ma trận phân quyền.
- `requirements/service-plans.md` — Phân tầng gói dịch vụ Free, Standard, Premium, Enterprise.
- `requirements/i18n.md` — Quy chuẩn song ngữ Việt / Anh, mặc định tiếng Việt.

### Đặc tả Yêu cầu Nghiệp vụ theo Capability (TASK-003)
- `requirements/product.md` — Quản lý Sản phẩm, vật liệu thô/xả đống, đơn vị tính quy đổi, bảng giá đa tầng.
- `requirements/warehouse.md` — Quản lý Kho kín, bãi lộ thiên (Yard Map), phân khu Zone/Slot và sức chứa.
- `requirements/inventory.md` — Sổ cái kho bất biến (`inventory_ledger`), kiểm kê, chuyển kho 2 bước, chặn xuất âm & backorder.
- `requirements/partner.md` — Quản lý Khách hàng, Nhà cung cấp, công trình và hạn mức công nợ (Credit Limit).
- `requirements/sales-order.md` — Bán lẻ (POS), Đơn hàng thương mại, State machine 7 trạng thái, giữ chỗ tồn kho (Reservation).
- `requirements/delivery-return.md` — Điều phối chuyến xe giao hàng, biên bản bàn giao (POD) và quy trình đổi trả hàng.
- `requirements/finance-debt.md` — Sổ nợ kép (`debt_ledger`), thu chi, thanh toán từng phần (Partial Payment) và hóa đơn VAT.
- `requirements/purchase.md` — Đơn đặt mua hàng (PO), nhập kho theo đợt từ nhà máy/mỏ và quản lý nợ phải trả NCC.
- `requirements/report.md` — Báo cáo doanh thu, lợi nhuận gộp theo giá vốn bình quân gia quyền, phân tích tuổi nợ.
- `requirements/audit.md` — Nhật ký kiểm toán bất biến (WORM), lưu vết mọi thao tác nhạy cảm và đối soát tuân thủ.

## 2. Kế hoạch & Quy trình triển khai (`docs/tasks/` & `docs/ai-workflow/`)

- `tasks/MVP-BACKLOG.md` — Lộ trình triển khai MVP chia theo 5 Milestone (M0–M4) và các Lane thực thi song song.
- `tasks/CURRENT.md` — Bảng theo dõi trạng thái task active của các lane theo thời gian thực.
- `ai-workflow/README.md` — Quy trình làm việc và review 2-bot tuần tự.
- `ai-workflow/runs/` — Lưu trữ Execution log và Review report cho từng task.

## 3. Kiến trúc & Quyết định

- `decision-backlog.md` — Danh mục 13 quyết định nghiệp vụ & kiến trúc cốt lõi, giả định tạm thời và ma trận blocker.
- `adr/README.md` — Danh mục Architecture Decision Records (ADR) chuẩn MADR (TASK-004):
  - `adr/0001-monorepo-structure.md` — Monorepo với pnpm workspace và Turborepo.
  - `adr/0002-vertical-slice-architecture.md` — Tổ chức mã nguồn theo Vertical Slice Feature.
  - `adr/0003-contract-first-openapi.md` — Phát triển Contract-First với OpenAPI 3.1.
  - `adr/0004-database-and-data-access.md` — Supabase Postgres, dbmate Migration & Kysely.
  - `adr/0005-multi-tenancy-isolation.md` — Mô hình Phân lập Dữ liệu Đa thuê bao.
  - `adr/0006-auth-and-authorization.md` — Xác thực Server Session & Phân quyền Capability.
  - `adr/0007-immutable-ledgers-and-state-machines.md` — Sổ cái Bất biến & State Machines.
  - `adr/0008-i18n-vietnamese-first.md` — Chiến lược Đa ngôn ngữ Vietnamese-First.
  - `adr/0009-service-plans-enforcement.md` — Thực thi Rào chắn Gói Dịch vụ.
- `architecture/` — Sơ đồ luồng dữ liệu, trust boundary và sơ đồ hệ thống tổng thể.

## 4. Nguyên tắc quản trị tài liệu

- Tài liệu Markdown trong `docs/` là nguồn sự thật duy nhất cho mọi quy tắc nghiệp vụ và kiến trúc.
- Không lưu trữ tài liệu rác, file HTML/CSV tạm hoặc thông tin mâu thuẫn.
- Mọi thay đổi logic hoặc thiết kế phải được cập nhật vào docs trước hoặc đồng thời với mã nguồn.
