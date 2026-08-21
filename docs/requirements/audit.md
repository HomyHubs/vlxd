# Requirements — Nhật ký Kiểm toán & Truy vết (`audit`)

> Tài liệu đặc tả yêu cầu nghiệp vụ chuẩn cho Module Nhật ký Kiểm toán (Audit Trail) và Giám sát tuân thủ.

---

## 1. Actors & Permissions

| Chức danh / Title | Quyền hạn trên module Kiểm toán | Khả năng thực hiện (Capabilities) |
| --- | --- | --- |
| **Chủ cửa hàng (Super Admin)** | Xem toàn bộ nhật ký thao tác hệ thống, lọc theo người dùng/thời gian/loại hành động, xuất báo cáo kiểm toán. | `audit:read_all`, `audit:export` |
| **Kiểm soát nội bộ / Auditor (Support Admin)** | Xem nhật ký kiểm toán, đối soát lịch sử thay đổi giá/hạn mức nợ/hủy đơn, phát hiện bất thường. | `audit:read`, `audit:export` |
| **Nhân viên thông thường (User)** | Không có quyền xem nhật ký kiểm toán hệ thống. | `None` |

---

## 2. Business Scope & Rules

- **Nguyên tắc Kiểm toán Bất biến (Immutable Audit Log — DEC-006, DEC-013):**
  - Mọi thao tác nhạy cảm, giao dịch tài chính, kho bãi hoặc thay đổi dữ liệu cấu hình đều phải được ghi nhận tự động vào bảng `audit_logs`.
  - Bảng `audit_logs` là **Append-only tuyệt đối**: Không có API hoặc quyền nào (kể cả Super Admin) được phép sửa (`UPDATE`) hoặc xóa (`DELETE`) các dòng nhật ký đã ghi.
- **Danh mục sự kiện bắt buộc ghi nhận Audit Log:**
  1. *Xác thực & Người dùng:* Đăng nhập, Đăng xuất thất bại liên tiếp (chống Brute-force), Đổi mật khẩu, Gán quyền/Role.
  2. *Sản phẩm & Giá:* Tạo sản phẩm, Thay đổi giá bán, Thay đổi giá vốn thủ công, Xóa mềm sản phẩm.
  3. *Tồn kho & Kho bãi:* Nhập kho, Xuất kho, Điều chuyển kho, Duyệt phiếu kiểm kê điều chỉnh tồn.
  4. *Bán hàng & Đơn hàng:* Tạo đơn, Duyệt đơn, Duyệt chiết khấu vượt thẩm quyền, Hủy đơn hàng, Duyệt trả hàng.
  5. *Tài chính & Công nợ:* Ghi nhận phiếu thu/chi, Điều chỉnh số dư nợ, Duyệt ghi đè hạn mức nợ (Credit Limit Override).
- **Cấu trúc một bản ghi Audit Log:**
  - `id`: UUID định danh duy nhất.
  - `tenant_id`: ID của Tenant.
  - `actor_id`: ID của người dùng thực hiện (hoặc `SYSTEM` nếu là tác vụ ngầm).
  - `actor_email`: Email/Tên người thực hiện.
  - `action`: Tên hành động chuẩn hóa (vd `ORDER_DISCOUNT_APPROVED`, `STOCK_ADJUSTED`).
  - `entity_type`: Bảng/Thực thể bị tác động (`orders`, `products`, `customers`, `inventory_ledger`).
  - `entity_id`: ID của bản ghi bị tác động.
  - `before_state`: Snapshot dữ liệu JSON trước khi sửa đổi.
  - `after_state`: Snapshot dữ liệu JSON sau khi sửa đổi.
  - `ip_address`: Địa chỉ IP của client gửi request.
  - `user_agent`: Thông tin trình duyệt/thiết bị.
  - `request_id`: Mã truy vết tương quan (Correlation Request ID) để liên kết với logs hệ thống backend.
  - `created_at`: Thời gian thực hiện (UTC timestamp).

---

## 3. Invariants (Quy tắc bất biến)

1. **Write-Once, Read-Many (WORM):** Bản ghi `audit_logs` một khi đã tạo không thể bị thay đổi dưới bất kỳ hình thức nào.
2. **Non-Repudiation (Không thể chối bỏ):** Mọi thao tác ghi đè nghiệp vụ bắt buộc phải gắn liền với danh tính `actor_id` xác thực hợp lệ.
3. **No Sensitive PII Leakage:** Mật khẩu, mã token bí mật, số thẻ thanh toán bắt buộc phải được lọc bỏ (redact/masking) trước khi lưu vào `before_state`/`after_state`.

---

## 4. Happy Path

1. Nhân viên bán hàng A tạo đơn hàng cho khách với mức chiết khấu $12\%$ (vượt hạn mức $3\%$).
2. Quản lý B đăng nhập $\rightarrow$ Xem yêu cầu duyệt chiết khấu $\rightarrow$ Nhập lý do: `Khách hàng thân thiết VIP dự án Masteri` $\rightarrow$ Bấm "Phê duyệt chiết khấu".
3. Hệ thống lưu đơn hàng và tự động ghi một dòng vào `audit_logs`:
   - `action`: `ORDER_DISCOUNT_APPROVED`
   - `actor_id`: ID của Quản lý B
   - `entity_type`: `orders`
   - `entity_id`: `DH-20260822-0001`
   - `before_state`: `{"discount_percent": 0}`
   - `after_state`: `{"discount_percent": 12, "reason": "Khách hàng thân thiết VIP dự án Masteri"}`
   - `ip_address`: `14.241.22.85`
4. Cuối tháng, Kiểm soát nội bộ mở Nhật ký kiểm toán $\rightarrow$ Lọc sự kiện `ORDER_DISCOUNT_APPROVED` $\rightarrow$ Thấy rõ toàn bộ lịch sử ai đã duyệt, lúc nào, cho đơn hàng nào.

---

## 5. Failure & Edge Cases

| Trường hợp | Phản hồi hệ thống | Mã lỗi backend |
| --- | --- | --- |
| Người dùng gửi request sửa đổi audit log | Chặn tuyệt đối, trả lỗi 403 / Không có endpoint | `ACTION_NOT_SUPPORTED` |
| Lỗi ghi audit log khi thực hiện giao dịch chính | Giao dịch chính bị Rollback để đảm bảo tính toàn vẹn kiểm toán | `AUDIT_LOG_WRITE_FAILED` |

---

## 6. Retention & Performance

- Dữ liệu `audit_logs` được lưu trữ trực tuyến (Hot Storage) trong 12 tháng gần nhất để phục vụ tra cứu tức thì trên giao diện quản trị.
- Sau 12 tháng, dữ liệu có thể được nén và chuyển vào Cold Archive (S3 / Parquet) đáp ứng yêu cầu lưu trữ kiểm toán theo quy định pháp luật (5–10 năm).

---

## 7. Service Plan Gates

- Tính năng Ghi nhận Audit Log hoạt động ngầm trên toàn bộ các gói dịch vụ (đảm bảo an ninh hệ thống).
- Giao diện Xem & Xuất báo cáo Nhật ký kiểm toán (Audit Trail UI & Export) áp dụng cho gói Premium và Enterprise.

---

## 8. Acceptance Criteria

- [ ] Toàn bộ các thao tác nhạy cảm (sửa giá, duyệt nợ, duyệt chiết khấu, hủy đơn, cân kho) đều sinh audit log đầy đủ.
- [ ] Lưu trữ chi tiết `before_state` và `after_state` dưới dạng JSON diff.
- [ ] Bảo mật tuyệt đối: Bảng audit log không có endpoint update/delete.
- [ ] Redact sạch sẽ mật khẩu và thông tin nhạy cảm trước khi ghi log.

---

## 9. Out of Scope

- Lưu trữ nhật ký trên mạng lưới Blockchain phân tán (Hyperledger / Ethereum) trong MVP.
- Tự động phát hiện gian lận bằng mô hình AI Anomaly Detection thời gian thực.
