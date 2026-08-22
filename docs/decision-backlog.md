# Decision Backlog — Danh mục Quyết định Nghiệp vụ & Kiến trúc

> Nguồn sự thật quản trị các quyết định kiến trúc, vận hành và nghiệp vụ cho hệ thống `vlxd`.
> Được thiết lập theo yêu cầu tại `TASK-002` (`docs/tasks/MVP-BACKLOG.md`).
>
> **Quy tắc SLA:** Mọi quyết định ở trạng thái `Open` bắt buộc phải có **`Temporary Assumption` (Giả định tạm thời)** an toàn để không chặn tiến độ kỹ thuật. Human Owner sẽ chốt trong vòng **≤ 2 ngày làm việc**; quá hạn sẽ áp dụng giả định tạm thời cho đến khi có quyết định chính thức. AI bot **tuyệt đối không** tự chuyển `Open` thành `Accepted`.

---

## 1. Bảng tóm tắt danh mục quyết định

| ID | Quyết định | Phân loại | Trạng thái | Owner | Trigger / Milestone | Blocker cho Feature |
| --- | --- | --- | --- | --- | --- | --- |
| **DEC-001** | Platform Admin vs Tenant Admin Scope | Kiến trúc / Auth | `Open` (Assumption) | CEO / Architect | M1 (TASK-009, 010a) | `auth`, `role-management`, `service-plan` |
| **DEC-002** | Branch & Multi-Warehouse Scope | Nghiệp vụ / Core | `Open` (Assumption) | CEO / Ops Lead | M2 (TASK-014a, 015), M4 (TASK-025) | `warehouse`, `inventory`, `yard-map` |
| **DEC-003** | Thời điểm Reserve và Trừ Tồn kho | Nghiệp vụ / Ledger | `Open` (Assumption) | CEO / Warehouse Lead | M3 (TASK-016c, 018c) | `inventory`, `order`, `pos` |
| **DEC-004** | Cho phép Xuất âm & Xử lý Đơn đặt trước (Backorder) | Nghiệp vụ / Kho | `Open` (Assumption) | CEO / Sales Lead | M3 (TASK-016b, 018b) | `inventory`, `order` |
| **DEC-005** | State Machine và Vòng đời Đơn hàng | Nghiệp vụ / Bán hàng | `Open` (Assumption) | CEO / Sales Lead | M3 (TASK-018b, 018c) | `order`, `invoice`, `pos` |
| **DEC-006** | Chính sách Hủy chứng từ, Hoàn tác & Ghi sổ bù trừ | Nghiệp vụ / Ledger | `Accepted` | CEO / Accountant | M3 (TASK-016c, 018d) | `inventory`, `order`, `finance` |
| **DEC-007** | Thanh toán từng phần & Quản lý Sổ nợ Công nợ | Nghiệp vụ / Tài chính | `Open` (Assumption) | CEO / Accountant | M3 (TASK-020a, 020b) | `order`, `customer`, `supplier`, `finance` |
| **DEC-008** | Xử lý Thuế VAT trên Báo giá và Đơn hàng | Nghi vụ / Thuế | `Open` (Assumption) | CEO / Accountant | M3 (TASK-018a, 018b), M4 (TASK-024) | `product`, `order`, `invoice`, `settings` |
| **DEC-009** | Phương pháp Tính giá vốn Hàng tồn kho | Kế toán / Kho | `Open` (Assumption) | CEO / Accountant | M3 (TASK-016a, 021), M4 (TASK-022) | `inventory`, `purchase`, `report`, `finance` |
| **DEC-010** | Phân cấp Phê duyệt Chiết khấu & Giảm giá | Nghiệp vụ / Bán hàng | `Open` (Assumption) | CEO / Sales Lead | M3 (TASK-018d) | `order`, `role-management` |
| **DEC-011** | Kiểm soát Hạn mức Công nợ Khách hàng (Credit Limit) | Nghiệp vụ / Rủi ro | `Open` (Assumption) | CEO / Risk Lead | M2 (TASK-017), M3 (TASK-018b) | `customer`, `order` |
| **DEC-012** | Quy trình Chuyển kho Nội bộ (Stock Transfer) | Nghiệp vụ / Kho | `Open` (Assumption) | CEO / Warehouse Lead | M3 (TASK-016b, 016c) | `warehouse`, `inventory` |
| **DEC-013** | Chính sách Lưu trữ, Soft-delete & Archive Dữ liệu | Kỹ thuật / DB | `Open` (Assumption) | Architect | M1 (TASK-008a) | Toàn bộ các module, `platform`, `db` |

---

## 2. Chi tiết từng quyết định

### DEC-001 — Platform Admin vs Tenant Admin Scope

- **Bối cảnh:** Cần phân tách rõ quyền hạn giữa đội ngũ quản trị nền tảng SaaS (`vlxd`) và người dùng quản trị cửa hàng/doanh nghiệp thuê bao.
- **Các phương án:**
  - *Option A:* Gộp chung 1 bảng role, dùng flag `is_superadmin` trên bảng `users`.
  - *Option B (Chọn):* Tách biệt rõ ràng ở cấp dữ liệu: Platform Super Admin quản trị tenant, billing, hạn mức gói; Tenant Admin (Chủ cửa hàng) chỉ quản trị người dùng, chi nhánh, phân quyền trong phạm vi tenant của mình.
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Backend enforce phân quyền theo capability và tenant isolation. Super admin ở cấp Tenant quản lý nhân sự và cửa hàng của mình; Platform Admin quản trị hệ thống SaaS.
- **Blocker:** M1 (`TASK-009`, `TASK-010a`).

---

### DEC-002 — Branch & Multi-Warehouse Scope

- **Bối cảnh:** Cửa hàng vật liệu xây dựng thường có bãi chứa chính, bãi phụ và các cửa hàng/chi nhánh bán lẻ.
- **Các phương án:**
  - *Option A (Đơn giản):* Mỗi chi nhánh chỉ có duy nhất 1 kho vật lý (quan hệ 1-1).
  - *Option B (Linh hoạt):* Một công ty (Tenant) có nhiều Chi nhánh; mỗi Chi nhánh sở hữu hoặc liên kết 1 hoặc nhiều Kho/Bãi vật liệu (quan hệ 1-N).
- **Recommendation:** Option B để phản ánh đúng thực tế cửa hàng VLXD (1 chi nhánh có thể có bãi cát đá riêng và kho xi măng/sắt thép kế bên).
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Áp dụng mô hình Tenant $\rightarrow$ Chi nhánh (Branch) $\rightarrow$ Kho (Warehouse/Yard). Dữ liệu tồn kho được lưu và quản lý theo cấp độ từng Kho cụ thể. Gói Free/Standard giới hạn 1 kho; gói Premium/Enterprise không giới hạn.
- **Blocker:** M2 (`TASK-014a`, `TASK-015`), M4 (`TASK-025`).

---

### DEC-003 — Thời điểm Reserve và Trừ Tồn kho

- **Bối cảnh:** Khi nhân viên tạo đơn hàng bán, tồn kho có bị trừ ngay hay chỉ giữ chỗ tạm thời?
- **Các phương án:**
  - *Option A:* Trừ tồn kho thực tế ngay khi tạo Đơn hàng ở trạng thái bất kỳ. (Rủi ro: Khách chưa lấy hàng hoặc hủy đơn sẽ làm sai lệch tồn thực tế tại bãi).
  - *Option B (Chọn - Nhất quán toàn bộ các luồng bán):* Tách bạch giữa **Tồn thực tế (`on_hand`)** và **Tồn khả dụng (`available = on_hand - reserved`)**, luôn bảo đảm bất biến $0 \le \text{reserved} \le \text{on\_hand}$:
    - **Giữ chỗ (`RESERVE`):** Khi Đơn hàng chuyển sang `CONFIRMED`, hệ thống kiểm tra tồn khả dụng và tự động tăng `reserved += qty` (`available = on_hand - reserved`). Đơn ở trạng thái `BACKORDER` không thực hiện giữ chỗ.
    - **Sự kiện Trừ kho thực tế duy nhất (`EXPORT`):**
      - Đối với đơn giao hàng tận nơi: Trừ kho thực tế (`on_hand -= qty, reserved -= qty`) duy nhất tại thời điểm đơn hàng chuyển sang `DELIVERING` (hàng được bốc lên xe và xuất bãi).
      - Đối với đơn bán lẻ tại quầy / POS: Trừ kho thực tế (`on_hand -= qty, reserved -= qty`) duy nhất tại thời điểm chuyển sang `COMPLETED` (sau khi quét mã/kiểm đếm tại quầy và khách hoàn tất thanh toán nhận hàng).
    - **Giải phóng giữ chỗ (`UNRESERVE`):** Khi Đơn hàng từ `CONFIRMED` hoặc `PROCESSING` bị `CANCELLED` trước khi xuất kho, hệ thống giải phóng giữ chỗ `reserved -= qty`.
- **Recommendation:** Option B bảo đảm tính chính xác tuyệt đối, chuẩn hóa vòng đời bán hàng thống nhất qua 1 pipeline, loại trừ hoàn toàn nguy cơ rò rỉ (leak) hoặc trừ trùng lặp (double-deduction).
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Triển khai theo Option B. Tồn kho trong Sổ cái (`inventory_ledger`) ghi nhận theo từng sự kiện biến động (RESERVE, UNRESERVE, EXPORT, IMPORT).
- **Blocker:** M3 (`TASK-016c`, `TASK-018c`).

---

### DEC-004 — Cho phép Xuất âm & Xử lý Đơn đặt trước (Backorder)

- **Bối cảnh:** Trong ngành VLXD, hàng cồng kềnh (cát, đá, xi măng) đôi khi giao thẳng từ nhà máy đến công trình của khách trước khi kịp nhập chứng từ vào phần mềm.
- **Các phương án:**
  - *Option A (Lỏng):* Cho phép xuất âm tồn kho thoải mái; cảnh báo sau. (Hệ quả: Rối loạn giá vốn bình quân và sai lệch kiểm kê).
  - *Option B (Chặt):* Tuyệt đối không cho xuất âm (`Strict No-Negative Stock`).
  - *Option C (Chọn - Cân bằng):* Mặc định chặn xuất âm trên sổ kho. Nếu tồn khả dụng không đủ đáp ứng, đơn hàng chuyển sang trạng thái "Đặt trước / Chờ hàng về" (`BACKORDER`). Khi phiếu nhập hàng (`IMPORT`) tương ứng được duyệt vào kho, hệ thống tự động phân bổ và chuyển đơn hàng sang `CONFIRMED` (nơi thực hiện `reserved += qty`).
- **Recommendation:** Option C.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Mặc định áp dụng Strict No-Negative Stock cho giao dịch kho thông thường; tích hợp trạng thái đơn `BACKORDER` vào State Machine chuẩn của đơn hàng.
- **Blocker:** M3 (`TASK-016b`, `TASK-018b`).

---

### DEC-005 — State Machine và Vòng đời Đơn hàng

- **Bối cảnh:** Cần quy định luồng chuyển đổi trạng thái của Đơn hàng bán (Sales Order) để backend enforce chặt chẽ bằng Finite State Machine (FSM).
- **Trạng thái và Luồng chuyển đổi (8 trạng thái):**
  1. `DRAFT`: Đơn nháp / Báo giá, chưa giữ tồn kho.
  2. `CONFIRMED`: Khách đã chốt đơn, hàng có sẵn trong kho, hệ thống tự động giữ chỗ tồn kho (`reserved += qty`).
  3. `BACKORDER`: Khách đặt hàng nhưng kho chưa đủ tồn khả dụng; không giữ chỗ tồn kho thực tế, chờ nhập hàng để phân bổ.
  4. `PROCESSING`: Đang bốc dỡ hàng tại bãi / chuẩn bị hàng tại quầy / phân công phương tiện vận tải.
  5. `DELIVERING`: Xe đang vận chuyển hàng tới công trình. **Đây là điểm trừ tồn kho thực tế (`on_hand -= qty, reserved -= qty`)** cho đơn giao hàng.
  6. `COMPLETED`: Giao hàng thành công (khách ký nhận) hoặc hoàn tất bán lẻ tại quầy/bãi (trừ kho thực tế `on_hand -= qty, reserved -= qty`).
  7. `CANCELLED`: Hủy đơn (nếu hủy từ `CONFIRMED`/`PROCESSING`, hệ thống tự động giải phóng `reserved -= qty`; nếu hủy sau khi đã xuất kho, phải đi qua quy trình ghi nhận hoàn trả).
  8. `RETURNED`: Đơn hàng bị khách trả lại một phần hoặc toàn bộ; sinh phiếu nhập hoàn kho bù trừ.
- **Sơ đồ chuyển đổi trạng thái (FSM):**
  - `DRAFT` $\rightarrow$ `CONFIRMED` (đủ tồn, `reserved += qty`) | `BACKORDER` (thiếu tồn) | `CANCELLED`
  - `BACKORDER` $\rightarrow$ `CONFIRMED` (khi hàng nhập về, tự động `reserved += qty`) | `CANCELLED`
  - `CONFIRMED` $\rightarrow$ `PROCESSING` | `CANCELLED` (giải phóng `reserved -= qty`)
  - `PROCESSING` $\rightarrow$ `DELIVERING` (đơn giao tận nơi, trừ `on_hand` & `reserved`) | `COMPLETED` (bán lẻ tại quầy, trừ `on_hand` & `reserved`) | `CANCELLED` (giải phóng `reserved -= qty`)
  - `DELIVERING` $\rightarrow$ `COMPLETED` (giao thành công) | `RETURNED` / `CANCELLED` (giao thất bại, sinh phiếu nhập hoàn trả)
  - `COMPLETED` $\rightarrow$ `RETURNED` (khách trả hàng sau giao)
- **Recommendation:** Triển khai Finite State Machine bất biến ở backend, trả mã lỗi `INVALID_STATE_TRANSITION` nếu vi phạm luồng chuyển đổi.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Áp dụng luồng 8 trạng thái và ma trận chuyển đổi tuần tự nghiêm ngặt trên.
- **Blocker:** M3 (`TASK-018b`, `TASK-018c`).

---

### DEC-006 — Chính sách Hủy chứng từ, Hoàn tác & Ghi sổ bù trừ

- **Bối cảnh:** Xử lý sai sót kế toán, kho bãi hoặc đơn hàng đã phát sinh giao dịch.
- **Các phương án:**
  - *Option A:* Xóa cứng record (`DELETE FROM orders...`). (Vi phạm kiểm toán, mất dấu vết tiền và hàng).
  - *Option B (Chọn):* Tuyệt đối không xóa cứng giao dịch đã hoàn tất. Sử dụng cơ chế ghi sổ bù trừ (Reverse Transaction / Credit Note): Hủy đơn sẽ sinh phiếu nhập hoàn kho bù trừ và phiếu điều chỉnh công nợ, đồng thời ghi nhận Audit Log đầy đủ lý do hủy và người thực hiện.
- **Recommendation:** Option B.
- **Trạng thái:** `Accepted`.
- **Ghi nhận quyết định:** Đã quy định tại `/AGENTS.md` (mục 4.1 & 9).
- **Blocker:** M3 (`TASK-016c`, `TASK-018d`).

---

### DEC-007 — Thanh toán từng phần & Quản lý Sổ nợ Công nợ

- **Bối cảnh:** Khách hàng công trình xây dựng thường đặt cọc trước một phần, nhận hàng nhiều đợt và thanh toán gối đầu theo tiến độ.
- **Các phương án:**
  - *Option A:* Chỉ ghi nhận 1 trường `debt_amount` trên bảng `customers`. (Rất dễ sai lệch, không đối soát được nợ của từng đơn hàng).
  - *Option B (Chọn):* Sổ cái công nợ kép (`debt_ledger`): Mỗi đơn hàng phát sinh một khoản nợ phải thu (Debit). Mỗi lần thanh toán tiền mặt/chuyển khoản sinh một phiếu thu (Credit) gán vào đơn hàng hoặc tài khoản khách hàng. Tổng nợ = $\sum \text{Debit} - \sum \text{Credit}$.
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Triển khai Sổ nợ công nợ theo Option B. Cho phép 1 đơn hàng nhận nhiều phiếu thu (Partial Payment).
- **Blocker:** M3 (`TASK-020a`, `TASK-020b`).

---

### DEC-008 — Xử lý Thuế VAT trên Báo giá và Đơn hàng

- **Bối cảnh:** Trong ngành VLXD, một số khách lẻ mua không lấy hóa đơn VAT, trong khi nhà thầu và doanh nghiệp bắt buộc phải có thuế VAT.
- **Các phương án:**
  - *Option A:* Giá bán toàn hệ thống mặc định chưa bao gồm thuế; cộng thêm % VAT ở cuối đơn.
  - *Option B (Chọn):* Cấu hình thuế suất VAT linh hoạt theo từng mặt hàng (0%, 5%, 8%, 10%); đơn hàng hỗ trợ cờ `is_vat_invoice`. Giá bán có thể hiển thị trước thuế / sau thuế rõ ràng.
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Hỗ trợ cấu hình VAT theo từng sản phẩm và tính toán chi tiết thuế trên từng dòng đơn hàng khi xuất hóa đơn VAT.
- **Blocker:** M3 (`TASK-018a`, `TASK-018b`), M4 (`TASK-024`).

---

### DEC-009 — Phương pháp Tính giá vốn Hàng tồn kho

- **Bối cảnh:** Giá vật liệu xây dựng (đặc biệt là sắt thép, cát đá) biến động liên tục theo ngày.
- **Các phương án:**
  - *Option A:* FIFO (Nhập trước xuất trước). (Phức tạp khi chuyển kho và tách lô đối với hàng xả đống như cát đá).
  - *Option B (Chọn):* Bình quân gia quyền liên hoàn (Moving Weighted Average). Sau mỗi lần nhập kho, giá vốn được tính lại tự động:
    $$\text{Giá vốn mới} = \frac{(\text{Tồn cũ} \times \text{Giá vốn cũ}) + (\text{Số lượng nhập} \times \text{Giá nhập mới})}{\text{Tồn cũ} + \text{Số lượng nhập}}$$
- **Recommendation:** Option B tối ưu cho ngành VLXD, dễ vận hành và độ chính xác tài chính cao.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Áp dụng phương pháp Bình quân gia quyền liên hoàn cho toàn bộ danh mục vật liệu.
- **Blocker:** M3 (`TASK-016a`, `TASK-021`), M4 (`TASK-022`).

---

### DEC-010 — Phân cấp Phê duyệt Chiết khấu & Giảm giá

- **Bối cảnh:** Ngăn ngừa tình trạng nhân viên tự ý giảm giá quá sâu gây thất thoát lợi nhuận.
- **Các phương án:**
  - *Option A:* Bất kỳ nhân viên nào cũng được quyền nhập % giảm giá tùy ý.
  - *Option B (Chọn):* Phân tầng hạn mức chiết khấu theo capability thẩm quyền (không hard-code theo title):
    - Capability `sales.discount.tier1` (mặc định gán nhân viên bán hàng): Chiết khấu tối đa **$\le 3\%$**.
    - Capability `sales.discount.tier2` (mặc định gán quản lý cửa hàng / chi nhánh): Chiết khấu tối đa **$\le 10\%$**.
    - Capability `sales.discount.override` (mặc định gán chủ cửa hàng / super admin): Chiết khấu vượt quá $10\%$ (yêu cầu phê duyệt Approval OTP / Xác nhận trực tiếp).
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Triển khai hạn mức chiết khấu theo capabilities như Option B. Backend trả mã lỗi `DISCOUNT_LIMIT_EXCEEDED` nếu người dùng không có capability tương ứng.
- **Blocker:** M3 (`TASK-018d`).

---

### DEC-011 — Kiểm soát Hạn mức Công nợ Khách hàng (Credit Limit)

- **Bối cảnh:** Quản lý rủi ro nợ xấu đối với các nhà thầu xây dựng mua nợ khối lượng lớn.
- **Các phương án:**
  - *Option A:* Chỉ hiển thị cảnh báo đỏ trên giao diện khi khách vượt hạn mức nợ, vẫn cho phép tạo đơn tiếp.
  - *Option B (Chọn - Kiểm soát chặt):* Khi tổng nợ hiện tại + giá trị đơn mới $>$ `credit_limit`, hệ thống chặn hoàn tất đơn hàng và yêu cầu quyền Quản lý/Chủ cửa hàng duyệt ghi đè (`Override Credit Limit`).
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Triển khai theo Option B. Khách hàng mới/khách lẻ có `credit_limit = 0` (bắt buộc thanh toán 100%). Nhà thầu được cấu hình hạn mức riêng.
- **Blocker:** M2 (`TASK-017`), M3 (`TASK-018b`).

---

### DEC-012 — Quy trình Chuyển kho Nội bộ (Stock Transfer)

- **Bối cảnh:** Điều chuyển vật liệu giữa bãi chính và các chi nhánh bán lẻ cần phản ánh chính xác thời gian vận chuyển trên đường, đối soát hao hụt và đảm bảo tính toàn vẹn số liệu kế toán kho.
- **Các phương án:**
  - *Option A (1 bước):* Trừ kho xuất và cộng ngay vào kho nhập trong 1 giao dịch database duy nhất. (Nhược điểm: Không phản ánh thời gian hàng đang trên xe vận chuyển, dễ thất thoát nếu có sự cố dọc đường, không đối soát được trách nhiệm tài xế).
  - *Option B (2 bước - Chọn):* Quy trình Chuyển kho 2 bước độc lập với đảm bảo Giao dịch nguyên tử (Atomic Transactions) & Bất biến bảo toàn tồn kho (Inventory Conservation):
    - **Bước 1 — Xuất chuyển (`DISPATCH`):** Thực thi 1 Atomic DB Transaction: Trừ tồn kho nguồn (`source_on_hand -= qty`) và ghi nhận vào trạng thái đang đi đường (`in_transit += qty`), sinh bút toán xuất chuyển trên `inventory_ledger`.
    - **Bước 2 — Xác nhận nhập (`RECEIVE`):** Thực thi 1 Atomic DB Transaction: Trừ hàng đang chuyển (`in_transit -= qty`), cộng tồn kho đích theo số lượng thực nhận (`destination_on_hand += received_qty`). Nếu phát sinh chênh lệch hao hụt (`shrinkage_qty = qty - received_qty > 0`), hệ thống tự động sinh bút toán hao hụt chuyển kho (`TRANSFER_SHRINKAGE`) trên `inventory_ledger`.
    - **Bất biến Bảo toàn Tồn kho (Inventory Conservation Invariant):** Tại mọi thời điểm $t$, hệ thống luôn bảo đảm:
      $$\text{source\_on\_hand} + \text{in\_transit} + \text{destination\_on\_hand} + \text{shrinkage} = \text{Tổng số lượng ban đầu}$$
    - **Tính lũy biến & Chống trùng lặp (Idempotency):** Mọi thao tác xác nhận chuyển/nhập kho đều enforce Idempotency qua `transfer_id` và version lock (ngăn chặn double-receive khi mạng chập chờn); hỗ trợ hoàn tác hủy phiếu xuất (`CANCEL_DISPATCH`) khi hàng chưa nhập kho đích.
- **Recommendation:** Option B phản ánh đúng nghiệp vụ vận tải VLXD thực tế, loại trừ sai lệch kiểm kê và đảm bảo an toàn giao dịch cấp ledger.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Áp dụng quy trình Chuyển kho 2 bước (Xuất chuyển nguyên tử $\rightarrow$ Đang đi đường $\rightarrow$ Xác nhận nhập nguyên tử kèm ghi nhận hao hụt) theo Option B.
- **Blocker:** M3 (`TASK-016b`, `TASK-016c`).

---

### DEC-013 — Chính sách Lưu trữ, Soft-delete & Archive Dữ liệu

- **Bối cảnh:** Đảm bảo toàn vẹn dữ liệu kế toán, hóa đơn và lịch sử giao dịch nhiều năm.
- **Các phương án:**
  - *Option A:* Cho phép xóa record vật lý sau khi đơn hoàn tất. (Cấm tuyệt đối theo quy chuẩn AGENTS.md).
  - *Option B (Chọn):* Toàn bộ bảng dữ liệu master data và giao dịch (`products`, `warehouses`, `customers`, `suppliers`, `orders`, `invoices`, `ledger`) áp dụng Soft-delete (`deleted_at`, `is_archived`). Dữ liệu giao dịch kế toán/kho được lưu trữ vĩnh viễn trong MVP; chiến lược chuyển dữ liệu lịch sử trên 2 năm sang bảng lưu trữ lạnh (Cold Archive) được định hướng cho giai đoạn vận hành sau MVP (Post-MVP).
- **Recommendation:** Option B.
- **Trạng thái:** `Open` (Assumption).
- **Temporary Assumption:** Áp dụng cơ chế Soft-delete (`deleted_at`, `is_archived`) ở cấp độ schema DB cho master data và transactions trong MVP; Cold Archive được hoãn lại sau MVP.
- **Blocker:** M1 (`TASK-008a`).

---

## 3. Ma trận Blocker theo Milestone & Feature (M1 – M4)

```mermaid
graph TD
    subgraph M1_PlatformCore [Milestone M1: Platform Core]
        DEC001[DEC-001: Platform vs Tenant Admin] --> F_Auth[Feature: Auth & Role (TASK-009, 010a)]
        DEC013[DEC-013: Soft-delete Master Data] --> F_DB[Feature: Platform DB (TASK-008a)]
    end

    subgraph M2_MasterData [Milestone M2: Master Data]
        DEC002[DEC-002: Branch & Warehouse Scope] --> F_Warehouse[Feature: Warehouse & Yard (TASK-014a, 015)]
        DEC011[DEC-011: Customer Credit Limit] --> F_Customer[Feature: Customer Management (TASK-017)]
    end

    subgraph M3_CommerceFinance [Milestone M3: Commerce & Finance]
        DEC003[DEC-003: Inventory Reserve Timing] --> F_InvReserve[Feature: Ledger Reserve & Safety (TASK-016c)]
        DEC003 --> F_OrderReserve[Feature: Order Reserve Integration (TASK-018c)]
        DEC004[DEC-004: No-Negative Stock & Backorder] --> F_InvMove[Feature: Inventory Movements (TASK-016b)]
        DEC004 --> F_OrderFSM[Feature: Order State Machine (TASK-018b)]
        DEC005[DEC-005: 8-State Order FSM] --> F_OrderFSM
        DEC005 --> F_OrderReserve
        DEC006[DEC-006: Reversal & Cancellation] --> F_InvReserve
        DEC006 --> F_OrderDiscount[Feature: Discount & Lifecycle (TASK-018d)]
        DEC007[DEC-007: Partial Payment & Debt Ledger] --> F_Finance[Feature: Debt & Payment (TASK-020a, 020b)]
        DEC008[DEC-008: VAT Calculation] --> F_Quotation[Feature: Quotation & Pricing (TASK-018a)]
        DEC008 --> F_OrderFSM
        DEC009[DEC-009: Moving Weighted Average Cost] --> F_InvBalance[Feature: Balance & Schema (TASK-016a)]
        DEC009 --> F_Purchase[Feature: Purchase & Receiving (TASK-021)]
        DEC010[DEC-010: Discount Approval Limit] --> F_OrderDiscount
        DEC011 --> F_OrderFSM
        DEC012[DEC-012: 2-Step Stock Transfer] --> F_InvMove
        DEC012 --> F_InvReserve
    end

    subgraph M4_HardeningReporting [Milestone M4: Operations, Hardening & Launch]
        DEC009 --> F_Report[Feature: Reporting & Analytics (TASK-022)]
        DEC008 --> F_Settings[Feature: Settings & Print Templates (TASK-024)]
        DEC002 --> F_Yard[Feature: Yard Map Hardening (TASK-025)]
    end
```

---

## 4. Quy trình Cập nhật & Quyết định

1. **Khi Human Owner phê duyệt một mục `Open`:**
   - Cập nhật trường `Trạng thái` từ `Open (Assumption)` $\rightarrow$ `Accepted`.
   - Ghi nhận `Decision Record` với ngày phê duyệt, người phê duyệt và các điều chỉnh (nếu có).
2. **Nếu Human Owner điều chỉnh phương án khác giả định tạm thời:**
   - Cập nhật `Temporary Assumption` thành phương án mới.
   - Kiểm tra các task liên quan trong `docs/tasks/MVP-BACKLOG.md` để điều chỉnh requirement tương ứng trước khi code.
