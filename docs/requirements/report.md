# Requirements — Báo cáo & Phân tích Quản trị (`report`)

> Tài liệu đặc tả yêu cầu nghiệp vụ chuẩn cho Module Báo cáo Doanh thu, Lợi nhuận, Tồn kho và Phân tích Tuổi nợ.

---

## 1. Actors & Permissions

| Chức danh / Title | Quyền hạn trên module Báo cáo | Khả năng thực hiện (Capabilities) |
| --- | --- | --- |
| **Chủ cửa hàng (Super Admin)** | Toàn quyền xem mọi báo cáo tài chính, doanh thu, lợi nhuận gộp toàn hệ thống, hiệu suất từng chi nhánh. | `report:read_all`, `report:financial_view`, `report:margin_view`, `report:export` |
| **Quản lý chi nhánh (Support Admin)** | Xem báo cáo doanh số, tồn kho, công nợ thuộc phạm vi chi nhánh mình quản lý. | `report:read_branch`, `report:export` |
| **Kế toán bán hàng (Support Admin)** | Xem báo cáo doanh thu, sổ chi tiết công nợ, đối soát hóa đơn, báo cáo thuế. | `report:read_accounting`, `report:export` |
| **Nhân viên bán hàng (User)** | Xem báo cáo doanh số cá nhân, số lượng đơn hàng đã bán trong tháng. | `report:read_own_sales` |

---

## 2. Business Scope & Rules

- **Báo cáo Doanh thu & Bán hàng (Sales Report):**
  - Thống kê doanh thu theo ngày, tuần, tháng, quý, năm.
  - Phân tích doanh số theo: Chi nhánh, Nhân viên bán hàng, Nhóm sản phẩm (Cát đá, Sắt thép, Xi măng...), Khách hàng lớn.
  - Tách bạch: $\text{Doanh thu gộp} - \text{Chiết khấu} - \text{Hàng trả lại} = \text{Doanh thu thuần}$.
- **Báo cáo Lợi nhuận gộp (Gross Profit Margin Report — DEC-009):**
  - Tính toán dựa trên Giá bán thực tế trừ đi Giá vốn hàng bán (COGS) theo phương pháp Bình quân gia quyền liên hoàn:
    $$\text{Lợi nhuận gộp} = \text{Doanh thu thuần} - \text{Giá vốn hàng xuất (COGS)}$$
    $$\text{Tỷ suất lợi nhuận gộp (\%)} = \frac{\text{Lợi nhuận gộp}}{\text{Doanh thu thuần}} \times 100\%$$
- **Báo cáo Giá trị Tồn kho & Cảnh báo (Inventory Valuation & Alerts):**
  - Tổng giá trị tồn kho tại từng kho/bãi = $\sum (\text{Số lượng tồn} \times \text{Giá vốn bình quân})$.
  - Danh sách mặt hàng sắp hết (dưới định mức tối thiểu) cần nhập gấp.
  - Danh sách mặt hàng tồn kho lâu ngày / chậm luân chuyển (Dead Stock).
- **Báo cáo Phân tích Tuổi nợ (Aging Debt Report):**
  - Phân loại nợ phải thu của khách hàng theo các mốc thời gian:
    - Trong hạn (0 – 15 ngày).
    - Quá hạn nhẹ (16 – 30 ngày).
    - Quá hạn trung bình (31 – 60 ngày).
    - Quá hạn nghiêm trọng ($> 60$ ngày / Nguy cơ nợ xấu).
  - Cảnh báo các nhà thầu sắp chạm hoặc đã vượt hạn mức nợ (Credit Limit).

---

## 3. Invariants (Quy tắc bất biến)

1. **Reconciled Totals:** Doanh thu báo cáo phải khớp 100% với tổng các hóa đơn và đơn hàng hoàn tất trong kỳ.
2. **Tenant Isolation:** Dữ liệu báo cáo chỉ tổng hợp từ các giao dịch thuộc đúng `tenant_id` của người dùng.
3. **Role Scope Enforcement:** Nhân viên thông thường tuyệt đối không được xem báo cáo Lợi nhuận hoặc Doanh thu toàn công ty.

---

## 4. Happy Path

1. Chủ cửa hàng mở mục "Báo cáo Quản trị" $\rightarrow$ Chọn kỳ: "Tháng này", Chi nhánh: "Tất cả chi nhánh".
2. Hệ thống hiển thị:
   - Thẻ tóm tắt: Doanh thu thuần $1.2 \text{ tỷ đ}$, Lợi nhuận gộp $210 \text{ triệu đ}$ ($17.5\%$), Tổng nợ phải thu $450 \text{ triệu đ}$, Giá trị tồn kho $820 \text{ triệu đ}$.
   - Biểu đồ cột Doanh thu theo ngày.
   - Biểu đồ tròn Cơ cấu doanh số theo nhóm hàng (Sắt thép 45%, Cát đá 30%, Xi măng 15%, Khác 10%).
   - Bảng phân tích tuổi nợ khách hàng.
3. Bấm nút "Xuất file Excel" $\rightarrow$ Hệ thống xuất báo cáo định dạng XLSX chuẩn để gửi họp ban giám đốc.

---

## 5. Failure & Edge Cases

| Trường hợp | Phản hồi hệ thống | Mã lỗi backend |
| --- | --- | --- |
| Nhân viên cố tình gọi API báo cáo lợi nhuận | Chặn truy cập, trả lỗi 403 Forbidden | `INSUFFICIENT_REPORT_PERMISSIONS` |
| Chọn khoảng thời gian báo cáo không hợp lệ (Ngày bắt đầu > Ngày kết thúc) | Báo lỗi khoảng thời gian không hợp lệ | `INVALID_DATE_RANGE` |
| Báo cáo khoảng thời gian quá lớn ($> 5$ năm) trên môi trường realtime | Yêu cầu thu hẹp khoảng thời gian hoặc xuất báo cáo nền | `REPORT_RANGE_TOO_LARGE` |

---

## 6. Performance & Scalability

- Các truy vấn báo cáo tổng hợp lớn được tối ưu bằng Index thích hợp trên các cột `(tenant_id, created_at, status)` và sử dụng Materialized Views hoặc Aggregate Tables nếu dữ liệu vượt $100,000$ dòng giao dịch.

---

## 7. Audit & Observability

- Ghi nhận Audit Log cho hành vi xuất dữ liệu báo cáo: `REPORT_EXPORTED` (ai xuất, loại báo cáo nào, thời gian nào, bộ lọc nào) để ngăn ngừa rò rỉ dữ liệu kinh doanh mật.

---

## 8. Service Plan Gates

- **Free & Standard Plan:** Cung cấp Báo cáo Doanh thu và Tồn kho cơ bản trong 30 ngày gần nhất.
- **Premium & Enterprise Plan:** Báo cáo Lợi nhuận gộp chuyên sâu, Báo cáo Tuổi nợ đa chiều, Phân tích dự báo xu hướng, Lưu trữ và truy xuất lịch sử báo cáo không giới hạn thời gian.

---

## 9. Acceptance Criteria

- [ ] Tổng hợp chính xác Doanh thu thuần và Lợi nhuận gộp theo giá vốn bình quân thực tế.
- [ ] Báo cáo giá trị tồn kho khớp hoàn toàn với số dư Sổ cái kho.
- [ ] Báo cáo Phân tích Tuổi nợ chia đúng 4 khoảng thời gian (0-15, 16-30, 31-60, >60 ngày).
- [ ] Hỗ trợ xuất dữ liệu ra định dạng Excel/PDF với tiếng Việt có dấu chuẩn Unicode.

---

## 10. Out of Scope

- Báo cáo tài chính kiểm toán nhà nước theo chuẩn quốc tế IFRS trong MVP.
- Hệ thống Business Intelligence (BI) tự kéo thả biểu đồ tùy biến tự do (Custom Ad-hoc Dashboard Builder).
