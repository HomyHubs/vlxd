# ADR-0009: Thực thi Rào chắn Gói Dịch vụ (Service Plans Enforcement)

## 1. Metadata

- **Mã:** ADR-0009
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 6), `docs/requirements/service-plans.md`, `docs/decision-backlog.md` (DEC-001, DEC-002)

---

## 2. Context & Problem Statement

Mô hình kinh doanh của `vlxd` là phần mềm dạng dịch vụ (SaaS) theo các gói: **Free**, **Standard**, **Premium**, và **Enterprise**. Mỗi gói có các hạn mức kỹ thuật và tính năng khác nhau:
- **Free:** Tối đa 80 sản phẩm, 1 nhà kho.
- **Standard:** Tối đa 800 sản phẩm, 1 nhà kho.
- **Premium:** Không giới hạn sản phẩm, không giới hạn nhà kho, hỗ trợ AI Voice/Chat, OCR hóa đơn.
- **Enterprise:** Không giới hạn, hỗ trợ Dedicated Database riêng biệt.

Nếu việc kiểm tra hạn mức chỉ thực hiện ở Frontend (ví dụ ẩn nút "Thêm mới"), người dùng am hiểu kỹ thuật có thể dễ dàng gọi trực tiếp REST API để tạo vượt hạn mức gói dịch vụ (Bypass Tier Limit). Ngoài ra, cần xử lý nghiệp vụ khi một Tenant hạ gói (Downgrade) từ Premium xuống Standard trong khi số lượng sản phẩm hiện tại đã vượt 800.

Cần một cơ chế thực thi rào chắn gói dịch vụ (Plan Gates Enforcement) bảo mật, chặt chẽ tại Backend và có chính sách xử lý hạ gói văn minh.

---

## 3. Decision Drivers

- Bảo mật tuyệt đối: Backend là nơi thực thi rào chắn cuối cùng (Source of Truth).
- Không làm mất mát hoặc xóa dữ liệu của khách hàng khi họ hạ gói dịch vụ.
- Hỗ trợ nâng cấp (Upgrade) và hạ gói (Downgrade) linh hoạt.
- Thông báo lỗi rõ ràng kèm thông tin hạn mức để Frontend hiển thị modal nâng cấp gói phù hợp.

---

## 4. Considered Options

- **Option A: Client-side validation only:** Chỉ chặn trên giao diện UI. (Bị loại ngay lập tức vì không an toàn).
- **Option B: Backend Service Layer Plan Guard Middleware (Chọn):**
  - Mọi API tạo mới tài nguyên có giới hạn (`POST /products`, `POST /warehouses`) đều đi qua Plan Guard Service.
  - Plan Guard đếm số lượng tài nguyên hiện tại của Tenant và so sánh với `plan_limits`.
  - Nếu vượt hạn mức $\rightarrow$ Trả lỗi `PRODUCT_LIMIT_REACHED` hoặc `WAREHOUSE_LIMIT_REACHED` kèm status 403 Forbidden và metadata `{ current, limit, currentPlan }`.
- **Option C: Database Trigger chặn tự động:** Viết Trigger trên PostgreSQL. (Khó trả về thông điệp lỗi thân thiện cho client và khó cấu hình linh hoạt cho từng tenant).

---

## 5. Decision Outcome

**Chọn Option B: Backend Plan Guard Middleware & Service Layer kết hợp Chính sách Bảo lưu Dữ liệu khi Hạ gói (Preserve on Downgrade).**

### 1. Bảng Ma trận Hạn mức Gói Dịch vụ:
| Tính năng / Hạn mức | Free | Standard | Premium | Enterprise |
| --- | --- | --- | --- | --- |
| Sử dụng ứng dụng Web | Có | Có | Có | Có |
| Giới hạn Sản phẩm (`max_products`) | **80** | **800** | **Không giới hạn** | **Không giới hạn** |
| Giới hạn Nhà kho (`max_warehouses`) | **1** | **1** | **Không giới hạn** | **Không giới hạn** |
| AI Agent Chat / Voice | Không | Không | Có | Có |
| OCR Hóa đơn viết tay | Không | Không | Có | Có |
| Dedicated Database riêng | Không | Không | Không | Có |

### 2. Quy tắc Xử lý Khi Hạ Gói (Downgrade Policy):
- Khi một Tenant hạ gói từ Premium xuống Standard/Free mà số lượng sản phẩm hiện có vượt hạn mức (vd đang có 500 sản phẩm mà hạ về Free giới hạn 80):
  1. **Tuyệt đối không xóa hoặc ẩn sản phẩm cũ:** Toàn bộ 500 sản phẩm vẫn xem, xuất kho, bán hàng bình thường.
  2. **Chặn tạo mới:** Tenant không thể bấm tạo thêm sản phẩm thứ 501 cho đến khi nâng lại gói hoặc xóa bớt sản phẩm về dưới 80.

---

## 6. Consequences

### Positive Consequences
- **Không thể bypass:** Ngay cả khi gọi API bằng curl/Postman, backend vẫn chặn triệt để khi vượt hạn mức gói.
- **Trải nghiệm khách hàng an toàn:** Khách hàng không lo bị mất dữ liệu khi thay đổi gói dịch vụ kinh doanh.
- **Dễ dàng mở rộng:** Thêm gói mới (vd Starter hay Pro) chỉ cần thêm cấu hình trong bảng `service_plans` mà không cần sửa logic code phức tạp.

### Negative Consequences & Mitigations
- *Chi phí query đếm số lượng:* Tạo Partial Index `COUNT(*) WHERE tenant_id = ... AND deleted_at IS NULL` hoặc cache số lượng tài nguyên vào bảng `tenant_usage_stats`.

---

## 7. Compliance & Enforcement

- Mọi API tạo mới tài nguyên có giới hạn bắt buộc phải có bước kiểm tra `planGuard.assertCanCreate(tenantId, 'product')`.
- Mã lỗi trả về phải chuẩn hóa: `PRODUCT_LIMIT_REACHED`, `WAREHOUSE_LIMIT_REACHED` kèm HTTP 403.
