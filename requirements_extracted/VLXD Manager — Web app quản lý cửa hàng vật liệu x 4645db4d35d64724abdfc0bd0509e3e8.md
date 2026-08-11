# VLXD Manager — Web app quản lý cửa hàng vật liệu xây dựng

<aside>
🧱

Web app quản lý cửa hàng vật liệu xây dựng — chạy trực tiếp trên trình duyệt, không cần cài đặt server. Dữ liệu lưu bằng localStorage của trình duyệt.

</aside>

## Dùng thử ngay

[VLXD Manager — bấm vào để mở app](vlxd-app.html)

VLXD Manager — bấm vào để mở app

## Tính năng

- **Dashboard**: doanh thu tuần này / tháng này (kèm % so với kỳ trước), số đơn hàng, tổng sản lượng bán; biểu đồ doanh thu 8 tuần và 6 tháng gần nhất; top mặt hàng bán chạy và sản lượng theo chủng loại trong tháng.
- **Sản phẩm & Giá**: danh sách mặt hàng theo chủng loại (Xi măng, Sắt thép, Gạch, Cát & Đá, Sơn, Ống nước, Tôn & Tấm lợp), tìm kiếm theo tên, lọc theo chủng loại, thêm mặt hàng mới, cảnh báo tồn kho thấp.
- **Cập nhật giá**: mỗi lần đổi giá đều hiển thị giá cũ (gạch ngang) cạnh giá mới và tự động ghi vào lịch sử.
- **Lịch sử giá**: bảng giá cũ → giá mới kèm % tăng/giảm cho từng lần cập nhật.
- **Bán hàng**: ghi đơn nhiều mặt hàng, tự điền đơn giá theo giá hiện tại (có thể chỉnh), tự trừ tồn kho, xem lại lịch sử đơn với chi tiết từng mặt hàng.

## Dữ liệu mẫu

App đi kèm 16 mặt hàng thuộc 7 chủng loại và ~6 tháng dữ liệu bán hàng mẫu để xem ngay dashboard. Bấm **↺ Khôi phục dữ liệu mẫu** ở góc sidebar để reset về trạng thái ban đầu.

## Hướng phát triển tiếp

1. **Backend thật**: chuyển localStorage sang database (Supabase/Firebase/PostgreSQL) để đồng bộ nhiều thiết bị.
2. **Nhập hàng & tồn kho**: thêm phiếu nhập, giá vốn, báo cáo lãi gộp.
3. **Công nợ khách hàng**: ghi bán chịu, theo dõi thanh toán.
4. **Xuất báo cáo**: xuất Excel/PDF theo tuần, tháng.
5. **Phân quyền** ✅ *đã làm ở bản 2 bên dưới*: chủ cửa hàng (quản trị), nhân viên (chỉnh sửa), tài khoản chỉ xem.
6. **In hóa đơn**: mẫu hóa đơn bán lẻ in khổ A5/A4.

## Phối hợp multi-agent qua Planner board

Board **VLXD Planner Board** bên dưới chính là nơi planner tách việc và các agent phối hợp với nhau:

1. **Planner**: tách yêu cầu của bạn thành task, gán **Agent phụ trách**, đặt ưu tiên và tiêu chí nghiệm thu. Task ở trạng thái **Ready** là việc agent có thể nhận ngay.
2. **UI agent** (Gemini Pro / Antigravity / AI Studio): nhận task giao diện → code xong chuyển sang **Review**.
3. **Function agent** (Codex): nhận task logic/backend → code xong chuyển sang **Review**.
4. **Test agent** (DeepSeek API): kiểm thử các task ở **Review** → đạt thì chuyển **Done**, có lỗi thì quay lại **Doing** kèm ghi chú lỗi.

## Phiên bản 2 — tách Frontend / Backend + phân quyền

[vlxd-app.zip — source code đầy đủ bản 2](vlxd-app.zip)

vlxd-app.zip — source code đầy đủ bản 2

- **Backend** (`server.js`): Node.js thuần + SQLite (node:sqlite), không cần cài thêm package. REST API cho sản phẩm, giá, đơn hàng, người dùng.
- **Frontend** (`public/`): HTML/CSS/JS tĩnh gọi API — dữ liệu không còn lưu localStorage mà lưu chung trên server, nhiều máy cùng truy cập.
- **Phân quyền 3 cấp**, kiểm tra ở backend (không chỉ ẩn nút): **Quản trị** toàn quyền + quản lý người dùng; **Chỉnh sửa** ghi đơn/đổi giá/thêm hàng; **Chỉ xem** chỉ xem dashboard và danh sách — gọi API ghi sẽ bị từ chối (403).
- Tài khoản mẫu: `admin / admin123` (quản trị) · `banhang / banhang123` (chỉnh sửa) · `khach / xem123` (chỉ xem).
- Chạy: `cd vlxd-app && node server.js` → mở http://localhost:3000. Admin thêm user mới ở mục **Người dùng** và chọn quyền chỉ xem hoặc chỉnh sửa.

---

*Tạo bởi Tim — 07/08/2026. File HTML độc lập, có thể tải về và mở bằng bất kỳ trình duyệt nào.*

[VLXD Planner Board](VLXD%20Planner%20Board%20f0210ebf709443408d9e930fac8a2e5e.csv)