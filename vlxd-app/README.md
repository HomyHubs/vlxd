# VLXD Manager — Web app quản lý cửa hàng vật liệu xây dựng

Phiên bản **frontend + backend tách riêng**, có đăng nhập và phân quyền.

## Chạy app

Chỉ cần Node.js >= 22 (không cần `npm install`, không phụ thuộc package ngoài):

```bash
cd vlxd-app
node server.js
```

Mở trình duyệt: **http://localhost:3000**

## Tài khoản & Khởi tạo (Bootstrap)

- Trong môi trường phát triển (`NODE_ENV !== 'production'`), hệ thống tự tạo các tài khoản mẫu: `admin / admin123`, `banhang / banhang123`, `khach / xem123`.
- Trong môi trường sản xuất (`NODE_ENV=production`), hệ thống chỉ khởi tạo tài khoản `admin` bằng mật khẩu cung cấp qua biến môi trường `ADMIN_INITIAL_PASSWORD`. Nếu không cung cấp, hệ thống sẽ tự sinh mật khẩu ngẫu nhiên an toàn và ghi log lúc khởi động.

## Cấu trúc

```
vlxd-app/
├── server.js        # Backend: API + xác thực + phân quyền + SQLite (node:sqlite)
├── vlxd.db          # Database SQLite (tự tạo & tự seed dữ liệu mẫu lần đầu)
└── public/          # Frontend tĩnh, giao tiếp backend qua REST API
    ├── index.html
    ├── styles.css
    └── app.js
```

## Phân quyền (RBAC)

| Hành động | Chỉ xem | Chỉnh sửa | Quản trị |
|---|---|---|---|
| Xem dashboard, sản phẩm, đơn hàng, lịch sử giá | ✅ | ✅ | ✅ |
| Ghi đơn bán hàng | ❌ | ✅ | ✅ |
| Cập nhật giá / thêm mặt hàng | ❌ | ✅ | ✅ |
| Quản lý người dùng (thêm mới, đổi quyền, đổi MK, xóa) | ❌ | ❌ | ✅ |
| Reset dữ liệu mẫu | ❌ | ❌ | ✅ |

- Quyền được **kiểm tra ở backend** (viewer gọi API ghi sẽ nhận 403, editor gọi API quản trị user sẽ nhận 403) — không chỉ ẩn nút trên giao diện.
- Frontend tự ẩn các nút sửa khi đăng nhập bằng tài khoản chỉ xem.
- Quản trị viên truy cập mục **Người dùng** để xem danh sách, lọc theo quyền, thêm tài khoản mới, phân quyền trực tiếp, đổi mật khẩu và xóa tài khoản nhân viên.

## API chính

- `POST /api/login` — đăng nhập, trả về token
- `GET /api/bootstrap` — toàn bộ dữ liệu (mọi quyền đều xem được)
- `POST /api/products` — thêm mặt hàng (editor+)
- `POST /api/products/:id/price` — cập nhật giá, tự ghi lịch sử giá cũ → mới (editor+)
- `POST /api/sales` — ghi đơn, tự trừ tồn kho (editor+)
- `POST /api/stock-in` — nhập kho tăng tồn kho (editor+)
- `POST /api/payments` — ghi nhận thanh toán thu nợ (editor+)
- `GET /api/users` — danh sách người dùng (admin)
- `POST /api/users` — thêm người dùng mới (admin)
- `POST /api/users/:id/role` — cập nhật quyền hạn người dùng (admin)
- `POST /api/users/:id/password` — đổi mật khẩu người dùng (admin)
- `DELETE /api/users/:id` — xóa người dùng (admin)
- `POST /api/reset` — reset dữ liệu mẫu (admin)

## Triển khai thật

- Đổi mật khẩu tài khoản mẫu trước khi dùng thật.
- Đặt sau HTTPS (Caddy/Nginx) nếu mở ra internet.
- Muốn nhiều máy cùng dùng: chạy `node server.js` trên một máy chủ, các máy khác truy cập qua IP/tên miền.
- Muốn scale lên: thay `node:sqlite` bằng PostgreSQL/Supabase, session in-memory bằng JWT/Redis.
