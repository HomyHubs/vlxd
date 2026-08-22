# AGENTS.md — apps/web (Frontend Application)

> Chỉ dẫn cho AI coding agent làm việc trong module frontend `apps/web`.

## 1. Nguyên tắc cốt lõi

1. **Vertical Slice Architecture:** Mỗi nghiệp vụ nằm trong `src/features/<feature>/`. Shared UI thuần túy đặt trong `src/components/`.
2. **Vietnamese-First & i18n Bắt buộc:** Không hard-code text tiếng Việt/Anh trực tiếp trong JSX. Mọi chuỗi hiển thị phải qua translation keys (`i18next`). Locale mặc định là `vi`, fallback sang `vi` nếu thiếu `en`.
3. **API Client Duy Nhất:** Gọi backend API thông qua `@vlxd/api-client` và TanStack React Query. Tuyệt đối không gọi trực tiếp Supabase client từ frontend.
4. **Form & Validation:** Dùng `react-hook-form` kết hợp Zod schema từ `@vlxd/shared`.
5. **UI & Theme:** Dùng MUI v6+ với theme chuẩn tại `src/theme/`.

## 2. Cấu trúc chuẩn của một frontend feature slice

```text
src/features/<feature>/
├── AGENTS.md        # Trạng thái và quy tắc riêng của feature
├── index.ts         # Public entry point
├── api/             # React Query hooks bọc @vlxd/api-client
├── components/      # Component riêng của feature
├── pages/           # Route pages
├── hooks/           # Custom React hooks
└── __tests__/       # Testing Library unit/integration tests
```

## 3. Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **UI System:** MUI v6+ (@mui/material, @emotion/react, @emotion/styled)
- **Data Fetching:** TanStack React Query 5
- **Routing:** React Router 7
- **i18n:** i18next + react-i18next
- **Forms:** react-hook-form + Zod resolver
- **Test:** Vitest + Testing Library + jsdom
