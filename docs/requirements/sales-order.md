# Requirements — Quản lý Bán hàng & Đơn hàng (`sales-order`)

> Tài liệu đặc tả yêu cầu nghiệp vụ chuẩn cho Module Bán lẻ (POS) và Đơn hàng thương mại (Sales Order).

---

## 1. Actors & Permissions

| Chức danh / Title | Quyền hạn trên module Bán hàng | Khả năng thực hiện (Capabilities) |
| --- | --- | --- |
| **Chủ cửa hàng (Super Admin)** | Toàn quyền tạo đơn, sửa đơn, duyệt chiết khấu đặc biệt $> 10\%$, hủy đơn hàng đã chốt, xem lợi nhuận đơn. | `order:create`, `order:read`, `order:update`, `order:cancel`, `order:discount_unlimited`, `order:margin_view` |
| **Quản lý chi nhánh (Support Admin)** | Duyệt đơn hàng, duyệt chiết khấu $\le 10\%$, duyệt ngoại lệ hạn mức nợ, xem báo cáo bán hàng chi nhánh. | `order:create`, `order:read`, `order:confirm`, `order:discount_manager`, `order:cancel` |
| **Nhân viên bán hàng (User)** | Tạo báo giá, tạo đơn hàng, áp dụng chiết khấu $\le 3\%$, in phiếu đặt hàng, theo dõi tiến độ giao hàng. | `order:create`, `order:read`, `order:discount_staff`, `order:quote_create` |
| **Thu ngân (User)** | Thu tiền đơn hàng (tiền mặt/chuyển khoản VietQR), in hóa đơn bán lẻ/phiếu thu tiền. | `order:read`, `order:payment_collect` |

---

## 2. Business Scope & Rules

- **Hai hình thức bán hàng đặc thù VLXD:**
  1. *Bán lẻ tại quầy (Quick POS):* Khách lấy hàng ngay tại bãi (vd 2 bao xi măng, 1 cuộn dây kẽm), thanh toán 100% $\rightarrow$ Tạo đơn và hoàn tất ngay lập tức trong 1 bước.
  2. *Đơn hàng giao công trình (Sales Order):* Lên báo giá/đơn hàng khối lượng lớn (vd 50 $m^3$ cát, 5 tấn thép) $\rightarrow$ Duyệt đơn $\rightarrow$ Điều xe giao nhiều chuyến $\rightarrow$ Thu tiền nhiều đợt.
- **Vòng đời State Machine 7 trạng thái (DEC-005):**
  `DRAFT` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `DELIVERING` $\rightarrow$ `COMPLETED` / `CANCELLED` / `RETURNED`.
- **Cơ chế Giữ chỗ Tồn kho — Reservation (DEC-003):**
  - Khi đơn ở trạng thái `DRAFT`: Không giữ chỗ tồn kho (khách mới hỏi giá).
  - Khi đơn chuyển sang `CONFIRMED`: Hệ thống tự động tăng `reserved` trong `inventory_balances` để đảm bảo có đủ hàng giao cho khách.
  - Khi xuất hàng `DELIVERING`/`COMPLETED`: Hệ thống giảm `reserved` và trừ `on_hand`.
  - Nếu hủy đơn `CANCELLED`: Hệ thống giải phóng `reserved` trở lại tồn khả dụng.
- **Phân cấp Phê duyệt Chiết khấu (DEC-010):**
  - Nhân viên bán hàng: Chiết khấu tối đa **$\le 3\%$** trên tổng đơn hoặc đơn giá.
  - Quản lý chi nhánh: Chiết khấu tối đa **$\le 10\%$**.
  - Vượt quá $10\%$: Bắt buộc có mã duyệt hoặc tài khoản Chủ cửa hàng (Super Admin) xác nhận trước khi lưu đơn.
- **Xử lý Thuế VAT (DEC-008):**
  - Mỗi dòng sản phẩm trên đơn hàng có cấu hình thuế suất riêng ($0\%, 5\%, 8\%, 10\%$).
  - Đơn hàng tính toán rõ: $\text{Tổng tiền trước thuế} + \text{Tổng tiền thuế VAT} - \text{Chiết khấu} + \text{Phí vận chuyển/bốc xếp} = \text{Tổng thanh toán}$.

---

## 3. State Machine & Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Tạo Báo giá / Đơn nháp (Chưa giữ tồn)
    DRAFT --> CONFIRMED: Khách chốt mua (Giữ chỗ tồn Reserved)
    CONFIRMED --> PROCESSING: Điều xe / Chuẩn bị bốc hàng tại bãi
    PROCESSING --> DELIVERING: Xe chở hàng rời bãi tới công trình
    DELIVERING --> COMPLETED: Giao thành công, ký biên bản (Trừ tồn On Hand)
    CONFIRMED --> CANCELLED: Khách hủy đơn (Giải phóng Reserved)
    PROCESSING --> CANCELLED: Hủy trước khi xuất bãi
    DELIVERING --> RETURNED: Xe hàng bị trả về (Hoàn trả tồn kho và công nợ)
    COMPLETED --> RETURNED: Đổi trả sau giao hàng (Tạo phiếu hoàn trả)
```

---

## 4. Invariants (Quy tắc bất biến)

1. **Order Code Unique:** Mã đơn hàng (`order_number`, vd: `DH-20260822-0001`) là duy nhất trong cùng một `tenant_id`.
2. **Valid State Transitions:** Trạng thái đơn hàng chỉ được phép chuyển dịch theo đúng đồ thị State Machine, không được nhảy cóc (vd từ `DRAFT` nhảy thẳng lên `DELIVERING`).
3. **Price & Quantity Positive:** Số lượng mua $> 0$, Đơn giá $\ge 0$.
4. **Discount Policy Enforced:** Chiết khấu không vượt quá thẩm quyền của người tạo đơn tại thời điểm xác nhận.

---

## 5. Happy Path

1. Nhân viên bán hàng tiếp nhận yêu cầu từ Công ty An Gia: Đặt $20 \text{ m}^3$ cát bê tông + $2 \text{ tấn}$ thép phi 10.
2. Chọn khách hàng `Công ty An Gia`, chọn công trình `Dự án Masteri`.
3. Thêm các dòng sản phẩm, chọn kho xuất `Kho Hóc Môn`.
4. Nhập chiết khấu $2\%$ (trong hạn mức nhân viên $3\%$), nhập cước xe ben $500,000$ đ.
5. Bấm "Xác nhận đơn hàng" $\rightarrow$ Đơn chuyển sang `CONFIRMED` $\rightarrow$ Tồn kho cát và thép được giữ chỗ ngay lập tức $\rightarrow$ In phiếu đặt hàng gửi khách.

---

## 6. Failure & Edge Cases

| Trường hợp | Phản hồi hệ thống | Mã lỗi backend |
| --- | --- | --- |
| Không đủ tồn kho khả dụng khi Confirm | Chặn xác nhận đơn, gợi ý chuyển sang Đơn đặt trước (Backorder) | `INSUFFICIENT_AVAILABLE_STOCK` |
| Nhân viên nhập chiết khấu $5\%$ ($> 3\%$) | Yêu cầu tài khoản Quản lý chi nhánh duyệt | `DISCOUNT_REQUIRES_APPROVAL` |
| Đơn hàng vượt hạn mức nợ của khách | Chặn xác nhận, yêu cầu duyệt ghi đè hạn mức nợ | `CREDIT_LIMIT_EXCEEDED` |
| Hủy đơn hàng khi xe đã xuất bãi (`DELIVERING`) | Chặn hủy trực tiếp, yêu cầu xử lý qua quy trình Trả hàng/Nhập hoàn | `CANNOT_CANCEL_IN_DELIVERY` |

---

## 7. Concurrency & Transaction Safety

- Khi chuyển trạng thái sang `CONFIRMED`, transaction phải kiểm tra và cập nhật `reserved_quantity` nguyên tử bằng Row-Level Locking để tránh oversell khi nhiều đơn hàng cùng xác nhận cùng lúc.

---

## 8. Audit & Observability

- Ghi nhận Audit Log cho: `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_DISCOUNT_APPROVED`, `ORDER_STATUS_CHANGED`, `ORDER_CANCELLED`.
- Log lưu vết đầy đủ ai đã duyệt chiết khấu hoặc duyệt vượt hạn mức nợ.

---

## 9. Service Plan Gates

- Tính năng Quản lý Bán hàng và Đơn hàng có mặt trên toàn bộ các gói dịch vụ.
- Gói Premium & Enterprise hỗ trợ AI Assistant tự động trích xuất đơn hàng từ tin nhắn Zalo/ảnh chụp hóa đơn viết tay (OCR).

---

## 10. Acceptance Criteria

- [ ] Hỗ trợ cả 2 luồng Bán lẻ nhanh tại quầy (POS) và Đơn hàng giao công trình (Sales Order).
- [ ] State Machine chuyển trạng thái mượt mà, chặn các bước chuyển vi phạm logic.
- [ ] Cơ chế giữ chỗ tồn kho (Reservation) hoạt động chính xác khi đơn `CONFIRMED`.
- [ ] Phân cấp hạn mức chiết khấu $3\% / 10\% / >10\%$ được enforce chặt chẽ.
- [ ] Hỗ trợ tính toán chi tiết thuế VAT và phí vận chuyển/bốc xếp trên đơn hàng.

---

## 11. Out of Scope

- Bán hàng đa kênh đồng bộ sàn thương mại điện tử Shopee/Lazada trong MVP.
- Tự động đấu nối cổng thanh toán thẻ quốc tế Visa/Mastercard trực tiếp trên POS (sử dụng VietQR và tiền mặt trong MVP).
