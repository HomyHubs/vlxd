# ADR-0002: Tổ chức mã nguồn theo Vertical Slice Feature

## 1. Metadata

- **Mã:** ADR-0002
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 2.1 & 2.2), `MVP-BACKLOG.md` (TASK-005)

---

## 2. Context & Problem Statement

Mô hình kiến trúc truyền thống dạng phân tầng ngang (Layered / Horizontal Architecture) như gom toàn bộ `controllers/`, `services/`, `repositories/`, `models/` vào các thư mục toàn cục (global directories) thường dẫn tới các vấn đề nghiêm trọng khi hệ thống mở rộng:

- Thay đổi một tính năng (vd: thêm trường vào Đơn hàng) đòi hỏi phải nhảy qua 5–7 thư mục khác nhau trên cây dự án.
- Dễ sinh ra các "God Service" ôm đồm logic của nhiều nghiệp vụ khác nhau.
- Ranh giới giữa các module bị mờ nhạt, dẫn tới việc import chéo tùy tiện và coupling cao.

Cần một kiến trúc tổ chức mã nguồn giúp gom toàn bộ các thành phần của một nghiệp vụ vào một khối thống nhất (Vertical Slice), dễ bảo trì, dễ mở rộng và cô lập rủi ro.

---

## 3. Decision Drivers

- Độ gắn kết cao (High Cohesion) trong cùng một nghiệp vụ và độ phụ thuộc thấp (Low Coupling) giữa các nghiệp vụ.
- Dễ dàng giao việc và phát triển song song theo từng tính năng mà không bị xung đột merge code (merge conflicts).
- Dễ dàng kiểm thử độc lập (Feature-level testing).

---

## 4. Considered Options

- **Option A: Traditional Layered Architecture (Horizontal):** Phân chia theo tầng kỹ thuật `controllers/`, `services/`, `models/`. (Bị loại vì phân tán logic, khó scale khi có 10+ capability).
- **Option B: Vertical Slice Architecture (Chọn):** Mỗi nghiệp vụ là một thư mục độc lập đóng gói toàn bộ HTTP routes, service logic, repository queries, schemas và test cases.
- **Option C: Clean Architecture / Hexagonal thuần túy với nhiều layer trừu tượng:** Quá nhiều boilerplate và interface trung gian không cần thiết cho một ứng dụng monolithic web app hiện đại.

---

## 5. Decision Outcome

**Chọn Option B: Áp dụng kiến trúc Vertical Slice Feature cho cả `apps/api` và `apps/web`.**

### Cấu trúc Backend Slice (`apps/api/src/features/<feature>/`)

```text
apps/api/src/features/inventory/
├── AGENTS.md        # Tài liệu & ghi chú trạng thái riêng của feature
├── index.ts        # Public entry point duy nhất (export router / service API)
├── routes.ts       # HTTP layer (Fastify endpoints, OpenAPI contract binding)
├── service.ts      # Pure business logic (không phụ thuộc HTTP req/res)
├── repository.ts   # Database queries sử dụng Kysely
├── schema.ts       # Zod schemas cho input/output validation
└── __tests__/      # Unit & Integration tests cho riêng slice này
```

### Cấu trúc Frontend Slice (`apps/web/src/features/<feature>/`)

```text
apps/web/src/features/inventory/
├── AGENTS.md
├── index.ts        # Public exports (Pages, Navigation items, Public hooks)
├── api/            # TanStack React Query hooks bọc @vlxd/api-client
├── components/     # UI components nội bộ của feature
├── pages/          # React Router page components
├── hooks/          # Custom state/logic hooks của feature
└── __tests__/
```

---

## 6. Consequences

### Positive Consequences

- **Local Reasoning:** Mọi thứ liên quan đến một nghiệp vụ nằm trọn vẹn trong một thư mục.
- **Strict Boundaries:** Import chéo giữa các feature chỉ được phép thông qua `features/<other-feature>/index.ts`.
- **Dễ refactor & xóa bỏ:** Xóa hoặc nâng cấp một feature chỉ cần tác động vào đúng một thư mục.

### Negative Consequences & Mitigations

- _Trùng lặp một số logic tiện ích nhỏ:_ Đưa các tiện ích thuần túy (date format, money format, crypto) vào `packages/shared` hoặc `platform/`.
- _Quy tắc đóng gói cần kiểm soát:_ Cấu hình ESLint `no-restricted-imports` để chặn import vào file nội bộ của feature khác (chỉ cho phép import qua `index.ts`).

---

## 7. Compliance & Enforcement

- Tuyệt đối cấm tạo thư mục toàn cục `src/controllers/`, `src/services/`, `src/repositories/`.
- ESLint rule enforce cấm deep-import: `import ... from '../warehouse/service'` $\rightarrow$ Error (bắt buộc import từ `../warehouse`).
