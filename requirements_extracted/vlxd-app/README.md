# VLXD Manager — Web app quản lý cửa hàng vật liệu xây dựng

Phiên bản **frontend + backend tách riêng**, có đăng nhập và phân quyền.

## Chạy app

Chỉ cần Node.js >= 22 (không cần `npm install`, không phụ thuộc package ngoài):

```bash
cd vlxd-app
node server.js
```

Mở trình duyệt: **http://localhost:3000**

## Tài khoản mẫu

| Tên đăng nhập | Mật khẩu | Quyền |
|---|---|---|
| `admin` | `admin123` | Quản trị (toàn quyền + quản lý người dùng + reset dữ liệu) |
| `banhang` | `banhang123` | Chỉnh sửa (ghi đơn, đổi giá, thêm mặt hàng) |
| `khach` | `xem123` | Chỉ xem (dashboard, danh sách, lịch sử — không sửa được gì) |

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
| Thêm người dùng, đổi quyền | ❌ | ❌ | ✅ |
| Reset dữ liệu mẫu | ❌ | ❌ | ✅ |

- Quyền được **kiểm tra ở backend** (viewer gọi API ghi sẽ nhận 403) — không chỉ ẩn nút trên giao diện.
- Frontend tự ẩn các nút sửa khi đăng nhập bằng tài khoản chỉ xem.
- Admin thêm user mới ở mục **Người dùng** → chọn quyền `viewer` (chỉ xem) hoặc `editor` (chỉnh sửa).

## API chính

- `POST /api/login` — đăng nhập, trả về token
- `GET /api/bootstrap` — toàn bộ dữ liệu (mọi quyền đều xem được)
- `POST /api/products` — thêm mặt hàng (editor+)
- `POST /api/products/:id/price` — cập nhật giá, tự ghi lịch sử giá cũ → mới (editor+)
- `POST /api/sales` — ghi đơn, tự trừ tồn kho (editor+)
- `GET/POST /api/users`, `POST /api/users/:id/role` — quản lý người dùng (admin)
- `POST /api/reset` — reset dữ liệu mẫu (admin)

## Triển khai thật

- Đổi mật khẩu tài khoản mẫu trước khi dùng thật.
- Đặt sau HTTPS (Caddy/Nginx) nếu mở ra internet.
- Muốn nhiều máy cùng dùng: chạy `node server.js` trên một máy chủ, các máy khác truy cập qua IP/tên miền.
- Muốn scale lên: thay `node:sqlite` bằng PostgreSQL/Supabase, session in-memory bằng JWT/Redis.
