# AGENTS.md — features/auth

> Backend auth feature slice for `apps/api`. Quản lý xác thực người dùng, băm mật khẩu, phiên đăng nhập opaque server-side, cookie an toàn, và audit log.

## 0. Nguyên tắc

1. **Password Hashing:** Sử dụng `scrypt` với random salt 16-byte cryptographically secure (`node:crypto`), so sánh thời gian cố định bằng `crypto.timingSafeEqual`.
2. **Session Security:** Token phiên được sinh ngẫu nhiên 32-byte (64 hex characters), lưu trong database dưới dạng SHA-256 hash (`token_hash`).
3. **Cookie Attributes:** Cookie `vlxd_session` bắt buộc có `HttpOnly; Path=/; SameSite=Lax; Max-Age=...`, và `Secure` khi `NODE_ENV === "production"`.
4. **Instant Revocation:** Khi logout hoặc tài khoản bị khóa, session bị vô hiệu hóa ngay lập tức (`revoked_at` được set).
5. **Audit Logging:** Mọi hành vi đăng nhập thành công, đăng nhập thất bại, và đăng xuất đều phải được ghi nhận vào bảng `audit_logs`.
6. **Encapsulation:** Chỉ export public API thông qua `index.ts`. Không import trực tiếp file nội bộ từ feature khác.
