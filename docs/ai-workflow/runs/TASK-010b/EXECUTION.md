# Execution log — TASK-010b

## Metadata

- Task: TASK-010b — Frontend login shell & reactive session management
- Lane: LANE-PLATFORMUI
- Milestone: M1 — Platform core
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-010b-frontend-login-shell`
- Base commit: `1dd315e`
- Started at (UTC): 2026-08-23T08:15:00Z
- Status: ready_for_review

## Inputs đã đọc

- [x] Root `AGENTS.md` (Mục 0, 1, 2, 3, 5, 8, 9)
- [x] `apps/web/AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (DEC-001, DEC-004, DEC-005, DEC-006, DEC-007, DEC-013)
- [x] `docs/adr/0006-auth-and-authorization.md`
- [x] `docs/requirements/i18n.md`
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-010--authentication-v%C3%A0-session--lane-core-ch%E1%BA%BB-2-pr`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`
- [x] Contract `contracts/http/openapi.yaml` và `@vlxd/api-client`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- **Vertical Slice Architecture:**
  - `apps/web/src/features/auth/` gồm: `AGENTS.md`, `index.ts`, `api/`, `context/`, `components/`, `pages/`, `hooks/`, `__tests__/`.
- **API Client & TanStack React Query Hooks:**
  - Bọc `@vlxd/api-client` với TanStack Query (`useAuthMeQuery`, `useLoginMutation`, `useLogoutMutation`).
- **Reactive Session Management:**
  - `AuthContext` & `AuthProvider` cung cấp trạng thái reactive: `user`, `tenant`, `isOwner`, `titles`, `isAuthenticated`, `isLoading`, `login`, `logout`.
  - Không lưu token nhạy cảm trong `localStorage` hay `sessionStorage`. Session dựa vào HttpOnly cookie `vlxd_session` đồng bộ với backend.
- **Login UI & Form Experience:**
  - `LoginForm` với email, password, optional tenant code, validate bằng Zod schema từ `@vlxd/shared`.
  - Hiển thị loading spinner, disabled button khi submitting, thông báo lỗi song ngữ tương ứng với `ErrorCode` (`INVALID_CREDENTIALS`, `USER_SUSPENDED`, `TENANT_SUSPENDED`, `VALIDATION_ERROR`, v.v.).
  - `LoginPage` giao diện chuẩn Material UI v6, hiện đại, hỗ trợ chuyển đổi ngôn ngữ Việt / Anh tức thì.
- **Authenticated State & Logout Flow:**
  - Khi đã đăng nhập, hiển thị thông tin người dùng, tenant, badge quyền và nút Đăng xuất.
  - Khi bấm Đăng xuất, gọi backend thu hồi session, xóa cookie, reset query cache và quay về trạng thái chưa đăng nhập.
- **Vietnamese-First & i18n Bắt buộc:**
  - Thêm translation keys tiếng Việt và tiếng Anh cho feature auth (`auth.json` hoặc trong `i18n/locales/*/auth.json`).
  - Toàn bộ form label, button, error message, badge đều qua `t("...")`.
- **Automated Tests:**
  - Kiểm thử render form, tương tác submit hợp lệ/không hợp lệ, hiển thị lỗi API, login thành công cập nhật UI, logout thu hồi session.

### Ngoài phạm vi

- Router điều hướng đa trang toàn hệ thống (thuộc `TASK-013`).
- Phân quyền UI RBAC / Permission matrix chi tiết (thuộc `TASK-011d`).

## Kế hoạch trước khi sửa

1. Bổ sung translation resources (`apps/web/src/i18n/locales/vi/auth.json` và `en/auth.json`), đăng ký vào `apps/web/src/i18n/index.ts`.
2. Tạo React Query hooks tại `apps/web/src/features/auth/api/auth-api.ts`.
3. Tạo Auth Context & Provider tại `apps/web/src/features/auth/context/auth-context.tsx`.
4. Xây dựng component `LoginForm.tsx` và `LoginPage.tsx` tại `apps/web/src/features/auth/`.
5. Tạo `UserMenu` / `AuthenticatedView` hiển thị thông tin session khi đã đăng nhập.
6. Xuất public API tại `apps/web/src/features/auth/index.ts`.
7. Tích hợp `AuthProvider` và `LoginPage` vào `apps/web/src/App.tsx`.
8. Viết bộ kiểm thử toàn diện Testing Library tại `apps/web/src/features/auth/__tests__/`.
9. Chạy toàn bộ quality gates (`pnpm test`, `pnpm run check`, `pnpm audit`).

## Giả định và quyết định

| Thời điểm  | Nội dung                                                                       | Căn cứ                               | Ảnh hưởng                                    |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------- |
| 2026-08-23 | Không lưu session token trong `localStorage`; dựa vào HttpOnly cookie          | ADR-0006 & AGENTS.md Mục 0, 9        | Bảo vệ triệt để chống XSS đánh cắp session   |
| 2026-08-23 | Dùng TanStack Query `useQuery` (`queryKey: ["auth", "me"]`) để quản lý session | ADR-0006 & React Query best practice | Dễ dàng invalidate cache khi login/logout    |
| 2026-08-23 | Ngôn ngữ mặc định `vi`, fallback `vi`, hỗ trợ chuyển đổi sang `en`             | ADR-0008 & docs/requirements/i18n.md | Chuẩn song ngữ toàn diện cho mọi UI elements |

## Thay đổi đã thực hiện

| File/khu vực                                                | Thay đổi                                                      | Lý do                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/src/i18n/locales/vi/auth.json`                    | Tạo bản dịch tiếng Việt cho feature auth                      | Song ngữ tiếng Việt mặc định theo ADR-0008           |
| `apps/web/src/i18n/locales/en/auth.json`                    | Tạo bản dịch tiếng Anh cho feature auth                       | Hỗ trợ tiếng Anh cho feature auth                    |
| `apps/web/src/i18n/index.ts`                                | Đăng ký `auth` namespace vào cấu hình i18next                 | Nạp tài nguyên ngôn ngữ                              |
| `apps/web/src/features/auth/AGENTS.md`                      | Tài liệu kiến trúc và quy ước của feature slice `auth`        | Feature encapsulation documentation                  |
| `apps/web/src/features/auth/api/auth-api.ts`                | React Query hooks (`useAuthMeQuery`, `useLogin`, `useLogout`) | Giao tiếp API và quản lý cache                       |
| `apps/web/src/features/auth/context/auth-context.tsx`       | `AuthContext`, `AuthProvider`, `useAuth` hook                 | Trạng thái reactive session toàn ứng dụng            |
| `apps/web/src/features/auth/components/LoginForm.tsx`       | Component form đăng nhập với MUI v6 & Zod validation          | UI đăng nhập và xử lý lỗi bản địa hóa                |
| `apps/web/src/features/auth/components/UserProfileCard.tsx` | Component hiển thị thông tin người dùng và nút Đăng xuất      | UI authenticated view                                |
| `apps/web/src/features/auth/pages/LoginPage.tsx`            | Trang đăng nhập với layout responsive và language toggle      | Shell trang đăng nhập                                |
| `apps/web/src/features/auth/index.ts`                       | Public entry point cho module `features/auth`                 | Feature encapsulation                                |
| `apps/web/src/App.tsx`                                      | Tích hợp `LoginPage` và `UserProfileCard` theo session        | Điều hướng hiển thị login / authenticated view       |
| `apps/web/src/main.tsx`                                     | Bọc ứng dụng với `AuthProvider`                               | Cung cấp auth context toàn cây component             |
| `apps/web/src/features/auth/__tests__/*.test.tsx`           | Viết test suites Testing Library cho toàn bộ auth UI slice    | Quality verification (16 tests frontend, 89 tổng số) |

## Migration/contract/generated artifacts

- Không thay đổi contract OpenAPI hay database migration.

## Kiểm tra đã chạy

| Command                         | Kết quả/exit code                    | Ghi chú                                                                          |
| ------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `pnpm test`                     | Exit code 0 (6/6 turbo tasks passed) | 16 tests in `apps/web`, 58 tests in `apps/api`, 9 in `api-client`, 6 in `shared` |
| `pnpm run check`                | Exit code 0                          | 18/18 turbo tasks + drift check 0% + Prettier format checks                      |
| `pnpm audit --audit-level=high` | Exit code 0                          | 0 lỗ hổng bảo mật                                                                |

## Self-review

- [x] Không lưu bất kỳ token/secret nào vào `localStorage` hay `sessionStorage`.
- [x] Session restore hoạt động mượt mà qua cookie khi tải lại trang.
- [x] Form login kiểm tra tính hợp lệ bằng Zod schema từ `@vlxd/shared`.
- [x] Các mã lỗi backend (`INVALID_CREDENTIALS`, `USER_SUSPENDED`, `TENANT_SUSPENDED`, v.v.) được dịch thân thiện sang tiếng Việt/Anh.
- [x] Đăng xuất xóa session trên server và dọn sạch trạng thái frontend.
- [x] 100% UI copy đi qua `i18next` translation key.
- [x] Tất cả quality gates (`pnpm check`, `pnpm test`, `pnpm audit`) xanh 100%.

## Feedback đã xử lý

| Review finding                        | Cách sửa | Commit/test bằng chứng |
| ------------------------------------- | -------- | ---------------------- |
| (Chưa có feedback — chờ Bot 2 review) | —        | —                      |

## Kết quả bàn giao

- PR: Sẵn sàng mở PR hướng vào `dev`
- Final status: `ready_for_review`
- Output chính:
  - `apps/web/src/features/auth/`: Feature slice hoàn chỉnh (api, context, components, pages, tests).
  - `apps/web/src/i18n/locales/*/auth.json`: Tài nguyên song ngữ cho feature auth.
  - `apps/web/src/App.tsx` & `main.tsx`: Tích hợp reactive session management.
