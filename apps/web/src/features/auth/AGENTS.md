# AGENTS.md — apps/web/src/features/auth

> Feature slice quản lý xác thực người dùng, session state reactive, và form đăng nhập frontend.

## 1. Trạng thái và phạm vi

- **Trạng thái:** Đang triển khai (TASK-010b).
- **Mục tiêu:** Login shell, reactive session management với TanStack Query, HttpOnly cookie authentication, không lưu token trong `localStorage`.
- **Ngôn ngữ:** Song ngữ `vi` (mặc định) và `en` qua namespace `auth`.

## 2. Cấu trúc feature

```text
apps/web/src/features/auth/
├── AGENTS.md
├── index.ts                     # Public entry point duy nhất
├── api/
│   └── auth-api.ts              # TanStack Query hooks bọc @vlxd/api-client
├── context/
│   └── auth-context.tsx         # AuthContext & AuthProvider reactive session
├── components/
│   ├── LoginForm.tsx            # Form đăng nhập với MUI v6 & Zod validation
│   └── UserProfileCard.tsx      # Card thông tin user đã đăng nhập & nút Logout
├── pages/
│   └── LoginPage.tsx            # Trang đăng nhập hoàn chỉnh
└── __tests__/
    ├── LoginForm.test.tsx
    ├── LoginPage.test.tsx
    └── auth-context.test.tsx
```

## 3. Quy tắc bảo mật

- **Không lưu token nhạy cảm ở `localStorage` hoặc `sessionStorage`:** Mọi authentication dựa trên HttpOnly cookie `vlxd_session` đồng bộ với backend.
- Khi app load, `useAuthMeQuery` (`GET /api/v1/auth/me`) tự động khôi phục session.
- Khi logout, gọi `POST /api/v1/auth/logout` và invalidate React Query cache để dọn sạch state.
