# Feature: Tenant User Lifecycle (`apps/api/src/features/tenant-user`)

## 1. Trách nhiệm feature

Quản lý vòng đời thành viên trong tenant/cửa hàng và gán title/vai trò:

- Mời tài khoản người dùng đã có vào tenant (`user.account.create`).
- Cập nhật trạng thái thành viên: `ACTIVE`, `SUSPENDED`, `REVOKED` (`user.account.update`).
- Thay thế danh sách chức danh/title được gán cho thành viên (`user.role.assign`).

## 2. Invariants & Bảo mật

- Tenant isolation: Mọi thao tác đều bị ràng buộc bởi `tenant_id` từ session xác thực.
- Capability authorization: Backend bắt buộc kiểm tra capability (`user.account.create`, `user.account.update`, `user.role.assign`).
- Titles gán cho user chỉ được thuộc về system title hoặc title của chính tenant đó.
- Không thể mời user đã là thành viên của tenant (tránh duplicate membership).

## 3. Cấu trúc

```text
apps/api/src/features/tenant-user/
├── AGENTS.md
├── index.ts
├── routes.ts
├── service.ts
├── repository.ts
└── __tests__/
    ├── service.test.ts
    └── routes.test.ts
```
