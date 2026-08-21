# Feature Inventory — Đối soát tính năng Prototype AI Studio

> Tài liệu xuất từ kết quả đối soát mã nguồn trong `prototype/legacy-app/` (trước đây là `app/`) theo `TASK-001`.
> Mục tiêu: Xác định rõ tính năng nào đã có ở mức prototype (UI/localStorage), tính năng nào chỉ là demo tĩnh, và tính năng nào hoàn toàn thiếu so với yêu cầu production.

---

## 1. Tổng quan phân loại trạng thái

- **`implemented` (Mức Prototype):** Đã có giao diện tương tác và mô phỏng luồng dữ liệu thông qua `localStorage` / state React nội bộ.
- **`demo-only` (Giao diện tĩnh/Stub):** Có component hoặc visual placeholder hiển thị nhưng không có logic nghiệp vụ hoặc tích hợp thật.
- **`missing` (Chưa có trong prototype):** Yêu cầu sản phẩm/kiến trúc production bắt buộc nhưng hoàn toàn chưa xuất hiện trong prototype.

---

## 2. Bảng đối soát chi tiết tính năng

| Nghiệp vụ / Module | Thành phần trong Prototype | Trạng thái | Đánh giá hiện trạng Prototype | Yêu cầu bắt buộc cho Production (`apps/web` + `apps/api`) |
| --- | --- | --- | --- | --- |
| **Nền tảng & Kiến trúc** | `App.tsx`, `main.tsx`, Vite, TailwindCSS | `demo-only` | Ứng dụng React đơn lẻ (SPA monolithic), lưu toàn bộ dữ liệu vào `localStorage`. Không có backend. | Monorepo tách biệt `apps/web` (React 19 + MUI) và `apps/api` (Fastify 5 + Kysely + Supabase Postgres). |
| **Xác thực & Phiên làm việc** | Không có | `missing` | Không có trang đăng nhập, đăng ký, quên mật khẩu, quản lý session hay cơ chế bảo mật. | Opaque server-side session, cookie bảo mật qua Fastify, rate limiting, audit log đăng nhập. |
| **Phân quyền & Role Management** | Không có | `missing` | Không có phân quyền; người dùng truy cập toàn quyền mọi màn hình. | Phân quyền theo capability, role group (Super admin, System admin, Support admin, User), mapping theo title kinh doanh. |
| **Multi-Tenancy** | Không có | `missing` | Toàn bộ dữ liệu nằm chung trong 1 browser profile local. | Phân lập tenant nghiêm ngặt ở cấp database schema / tenant_id và backend middleware. |
| **Hạn mức Gói dịch vụ** | Không có | `missing` | Không kiểm tra giới hạn sản phẩm (80 / 800 / Unlimited) hay số lượng kho (1 / Unlimited). | Backend enforcement cho các gói Free, Standard, Premium, Enterprise. Giữ dữ liệu cũ khi hạ gói, chặn tạo mới vượt hạn mức. |
| **Đa ngôn ngữ (i18n)** | Toàn bộ text hard-coded tiếng Việt | `missing` | Không có cơ chế i18n; không hỗ trợ chuyển đổi ngôn ngữ. | `i18next + react-i18next`, mặc định `vi`, hỗ trợ `en`/fallback, backend trả error code ổn định. |
| **Quản lý Vật liệu & Sản phẩm** | `MaterialTable.tsx`, `MaterialModal.tsx` | `implemented` | Xem danh sách, tìm kiếm, lọc theo danh mục, thêm/sửa vật liệu, cảnh báo tồn kho tối thiểu. | CRUD qua REST API, validate schema Zod, quản lý mã SKU tự động/duy nhất, đơn vị tính chuẩn. |
| **Lịch sử Biến động Giá** | `PriceHistoryModal.tsx` | `implemented` | Lưu lịch sử thay đổi giá nhập/giá bán vào mảng `priceHistory` trong object vật liệu local. | Bảng lịch sử giá riêng biệt trong PostgreSQL, ghi nhận user ID thay đổi, lý do điều chỉnh, hỗ trợ audit. |
| **Nhập hàng loạt Vật liệu** | `ImportMaterialModal.tsx` | `implemented` | Paste dữ liệu dạng bảng/CSV và parse client-side vào `localStorage`. | File upload (Excel/CSV), batch validation ở backend, xử lý transaction an toàn, preview lỗi từng dòng. |
| **Quy đổi Đơn vị Xây dựng** | `UnitConverterModal.tsx` | `implemented` | Công cụ tính toán nhanh: Cát/đá ($m^3 \leftrightarrow tấn$), Gạch ($m^2 \leftrightarrow viên$), Thép ($cây \leftrightarrow kg$). | Bộ công thức chuẩn hóa trong `packages/shared`, hỗ trợ cấu hình tỷ trọng riêng cho từng sản phẩm. |
| **Quản lý Bãi & Sơ đồ Kho** | `YardMapManagement.tsx` | `implemented` | Grid trực quan hiển thị các bãi chứa (Yard A, B, C...), tính tỷ lệ lấp đầy %, gán vật liệu vào ô. | Quản lý kho đa chi nhánh (multi-warehouse), phân lô/vị trí chính xác, kiểm tra sức chứa theo khối lượng/thể tích. |
| **Quản lý Kho & Nhập/Xuất** | `WarehouseManagement.tsx` | `implemented` | Ghi nhận phiếu Nhập/Xuất/Chuyển kho, cập nhật trực tiếp số lượng tồn trong `localStorage`. | Sổ cái kho (Inventory Ledger) ghi nhận bất biến (immutable), không sửa trực tiếp tồn kho, hỗ trợ kiểm kê (Stocktake) và đối soát. |
| **Bán hàng Nhanh (POS)** | `PosQuickSales.tsx` | `implemented` | Chọn sản phẩm nhanh, tính tổng tiền, chiết khấu, tự động cộng nợ khách hàng, tạo đơn hàng. | Giao diện POS tối ưu thao tác nhanh, in hóa đơn nhiệt, khóa tồn kho theo phiên giao dịch (concurrency control). |
| **Quản lý Đơn hàng** | `OrderManagement.tsx` | `implemented` | Danh sách đơn hàng, chuyển trạng thái (DRAFT, PENDING, PROCESSING, DELIVERING, COMPLETED, CANCELLED), xem mẫu in đơn. | State machine đơn hàng chặt chẽ ở backend, sinh mã chứng từ theo quy tắc chuỗi liên tục, rollback tồn khi hủy đơn. |
| **Quản lý Công nợ & Đối tác** | `DebtManagement.tsx` | `implemented` | Bảng theo dõi công nợ Khách hàng và Nhà cung cấp, modal ghi nhận phiếu thu/chi tiền mặt. | Sổ nợ kép (Debit/Credit), chứng từ thu/chi có số hiệu, kiểm tra hạn mức tín dụng (credit limit), tính lãi/hạn trả. |
| **Báo cáo & Thống kê** | `ReportDashboard.tsx`, `HeaderMetrics.tsx` | `implemented` | Biểu đồ doanh thu ngày (CSS bars), top sản phẩm bán chạy, giá trị tồn kho theo danh mục, ước tính lợi nhuận. | Query tổng hợp từ DB PostgreSQL, lọc theo khoảng thời gian thực tế, xuất báo cáo PDF/Excel, phân quyền xem doanh thu. |
| **Cài đặt Cửa hàng** | `SettingsManagement.tsx` | `implemented` | Cài đặt thông tin cửa hàng, định mức tồn kho tối thiểu theo nhóm, hạn mức nợ, nút Reset Mock Data. | Cấu hình tenant lưu DB, cấu hình mẫu in, thông tin thuế, tài khoản ngân hàng QR VietQR động. |
| **Đổi Giao diện & Mật độ** | `ThemeConfig.ts`, `VariationPreviewModal.tsx` | `implemented` | Chuyển đổi theme (Cam, Xanh, Dark) và mật độ hiển thị (Compact/Comfortable) qua CSS class. | Tích hợp Design System chuẩn qua Material UI (MUI v6) Theme Provider, hỗ trợ Dark/Light mode và dense mode. |
| **AI OCR Hóa đơn & Trợ lý** | Cấu hình `@google/genai` trong `package.json` | `demo-only` | Chỉ có thư viện trong `package.json`, chưa có code thực thi OCR hóa đơn viết tay hay AI voice/chat. | AI Service tích hợp Gemini 2.5/Flash để trích xuất hóa đơn viết tay (OCR) và AI Voice Agent cho gói Premium/Enterprise. |
| **Nhật ký Hoạt động (Audit Log)** | Không có | `missing` | Không ghi nhận log thao tác nhạy cảm. | Audit log toàn diện ở backend: ai làm gì, vào thời điểm nào, dữ liệu trước/sau (diff), IP address, request ID. |

---

## 3. Bản đồ chuyển đổi từ Prototype sang Kiến trúc Monorepo

| Prototype Component (`prototype/legacy-app/src/components/`) | Target Backend Feature (`apps/api/src/features/`) | Target Frontend Feature (`apps/web/src/features/`) |
| --- | --- | --- |
| `MaterialTable.tsx`, `MaterialModal.tsx`, `PriceHistoryModal.tsx` | `product/` | `product/` |
| `UnitConverterModal.tsx` | `packages/shared/src/converters/` | `product/components/` & `lib/` |
| `WarehouseManagement.tsx`, `YardMapManagement.tsx` | `warehouse/`, `inventory/` | `warehouse/`, `inventory/` |
| `PosQuickSales.tsx`, `OrderManagement.tsx` | `order/`, `invoice/` | `order/`, `invoice/` |
| `DebtManagement.tsx` | `customer/`, `supplier/`, `finance/` | `customer/`, `supplier/` |
| `ReportDashboard.tsx`, `HeaderMetrics.tsx` | `report/` | `report/` |
| `SettingsManagement.tsx` | `settings/`, `service-plan/` | `settings/`, `service-plan/` |
| *(Mới - Chưa có trong prototype)* | `auth/`, `role-management/`, `audit/` | `auth/`, `role-management/` |

---

## 4. Kết luận đối soát

1. **Bản chất của `prototype/legacy-app/`:** Là bản mô hình tĩnh và kiểm thử trải nghiệm người dùng (UX Wireframe / Interactive Mockup), tập trung vào các nghiệp vụ đặc thù ngành vật liệu xây dựng (tỷ trọng, bãi vật liệu, đơn hàng nhanh, công nợ).
2. **Kế hoạch xử lý:** Toàn bộ prototype được giữ nguyên trạng tại `prototype/legacy-app/` làm tài liệu đối soát. Không sao chép trực tiếp code prototype vào production mà tiến hành xây dựng mới theo quy chuẩn Clean Architecture, OpenAPI Contract-first và TDD.
