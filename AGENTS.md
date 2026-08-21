# AGENTS.md — vlxd (Quản lý Vật liệu xây dựng)

> Chỉ dẫn bắt buộc cho AI coding agent làm việc trên repo `HomyHubs/vlxd`. Repo hiện có bản prototype tham khảo tại `prototype/legacy-app/` (read-only); code production (`apps/web`, `apps/api`) được triển khai từng bước theo backlog. Không scaffold code khi chưa có task triển khai rõ ràng.

## 0. Nguyên tắc bất biến

1. **Memory nằm trong file, không nằm trong context.** Mọi trạng thái, quyết định, tiến độ ghi vào `AGENTS.md`, `docs/`, ADR.
2. **Inspect trước khi assume.** Không giả định service, biến môi trường, script, API, bảng DB hoặc code đã tồn tại.
3. **Plan trước, code sau.** Repo này hiện ưu tiên làm rõ business model, role, permission, data model, API contract.
4. **Contract-first.** Khi bắt đầu code API, `contracts/http/openapi.yaml` là nguồn sự thật duy nhất.
5. **Feature encapsulation.** Cross-feature import chỉ qua public entry point `index.ts`.
6. **Frontend không truy cập DB trực tiếp.** Mọi DB access đi qua backend `apps/api`.
7. **Không có secret trong repo**, image, log, fixture hoặc tài liệu.
8. **Không giữ tài liệu rác.** Repo plan phải gọn: chỉ giữ tài liệu có quyết định, yêu cầu, kiến trúc, ADR, hoặc hướng dẫn vận hành.

---

## 1. Bối cảnh dự án

- **Dự án:** vlxd — Web app quản lý cửa hàng/doanh nghiệp vật liệu xây dựng.
- **Mục tiêu:** quản lý sản phẩm, nhà kho, tồn kho, nhập/xuất, bán hàng, đơn hàng, hóa đơn, khách hàng, nhà cung cấp, công nợ, báo cáo, phân quyền nhân sự.
- **Kiến trúc:** Backend và frontend tách biệt, giao tiếp qua REST theo OpenAPI.
- **Database:** Supabase Postgres.
- **Mô hình kinh doanh:** dịch vụ theo gói Free, Standard, Premium, Enterprise.
- **Ngôn ngữ sản phẩm:** song ngữ **Việt / Anh**, ưu tiên tiếng Việt trước.
- **Trạng thái repo:** Chứa prototype giao diện tham khảo tại `prototype/legacy-app/` (read-only). Code production (`apps/web`, `apps/api`) đang trong lộ trình triển khai theo `docs/tasks/MVP-BACKLOG.md`.

---

## 2. Cấu trúc repo chuẩn

> Cấu trúc dưới đây là **đích đến khi bắt đầu scaffold**. Vì repo hiện chưa có code, chỉ tạo thư mục/file khi task triển khai cần đến.

```text
repo/
├── AGENTS.md
├── README.md
├── Makefile
├── turbo.json
├── pnpm-workspace.yaml
├── .nvmrc
├── compose.dev.yml
├── prototype/
│   └── legacy-app/                  # AI Studio prototype (read-only reference)
├── docs/
│   ├── README.md
│   ├── decision-backlog.md
│   ├── adr/
│   ├── architecture/
│   └── requirements/
│       ├── prototype-feature-inventory.md
│       ├── service-plans.md
│       ├── role-management.md
│       └── i18n.md
├── standards/
├── contracts/
│   └── http/
│       └── openapi.yaml
├── apps/
│   ├── web/
│   │   ├── AGENTS.md
│   │   └── src/
│   │       ├── app/                 # app bootstrap, router, providers
│   │       ├── features/            # frontend chia theo nghiệp vụ
│   │       │   ├── auth/
│   │       │   ├── role-management/
│   │       │   ├── product/
│   │       │   ├── warehouse/
│   │       │   ├── inventory/
│   │       │   ├── order/
│   │       │   ├── invoice/
│   │       │   ├── customer/
│   │       │   ├── supplier/
│   │       │   ├── report/
│   │       │   └── service-plan/
│   │       ├── components/          # shared UI only, không chứa business logic
│   │       ├── lib/
│   │       ├── i18n/
│   │       ├── theme/
│   │       ├── utils/
│   │       ├── test/
│   │       └── generated/           # code sinh tự động, không sửa tay
│   └── api/
│       ├── AGENTS.md
│       └── src/
│           ├── main.ts
│           ├── platform/            # config, db, auth, logger, http, observability
│           └── features/            # backend chia theo nghiệp vụ
│               ├── auth/
│               ├── role-management/
│               ├── product/
│               ├── warehouse/
│               ├── inventory/
│               ├── order/
│               ├── invoice/
│               ├── customer/
│               ├── supplier/
│               ├── report/
│               └── service-plan/
├── packages/
│   ├── shared/                      # Zod schemas, domain types, error codes
│   ├── api-client/                  # generated từ OpenAPI, không sửa tay
│   ├── config-eslint/
│   ├── config-ts/
│   └── config-prettier/
├── db/
│   ├── AGENTS.md
│   ├── migrations/
│   └── seeds/
├── e2e/
├── infra/
├── nginx/
└── compose.*.yml
```

### 2.1 Quy ước vertical slice

Backend feature:

```text
apps/api/src/features/warehouse/
├── AGENTS.md
├── index.ts        # public entry point
├── routes.ts       # HTTP layer, khớp OpenAPI
├── service.ts      # business logic, không biết HTTP
├── repository.ts   # Kysely queries
├── schema.ts       # Zod validation
└── __tests__/
```

Frontend feature:

```text
apps/web/src/features/warehouse/
├── AGENTS.md
├── index.ts
├── api/            # React Query hooks bọc api-client
├── components/     # component riêng của feature
├── pages/          # route pages
├── hooks/
└── __tests__/
```

### 2.2 Quy tắc chia module

- `apps/web` là frontend, `apps/api` là backend.
- Mỗi nghiệp vụ có thư mục riêng trong `apps/api/src/features/<feature>` và/hoặc `apps/web/src/features/<feature>`.
- Không đặt business logic trực tiếp trong `app`, `platform`, `components`, `lib`, hoặc `utils`.
- Không tổ chức theo kiểu global `controllers/`, `services/`, `repositories/` vì dễ làm business logic rải rác.
- Import chéo feature chỉ qua `index.ts`.
- Feature mới phải có `AGENTS.md` con để ghi trạng thái riêng.

---

## 3. Tech stack đã chốt

### Backend — `apps/api`

| Hạng mục | Lựa chọn |
| --- | --- |
| Ngôn ngữ | TypeScript 5.9+, ESM |
| Runtime | Node 24.x, pin qua `.nvmrc` |
| Package manager | pnpm 11.x + pnpm workspace |
| HTTP framework | Fastify 5 + `fastify-type-provider-zod` |
| Database | PostgreSQL do Supabase cung cấp |
| Data access | Kysely trên `pg` |
| Migration | dbmate, SQL thuần, reversible |
| Validation | Zod 4 dùng chung qua `packages/shared` |
| Auth | Opaque server-side session + capability-based authorization |
| Logging | pino, redact PII, request-id |
| Test | Vitest 4 + testcontainers |

### Frontend — `apps/web`

| Hạng mục | Lựa chọn |
| --- | --- |
| Framework | React 19 + TypeScript + Vite |
| UI | MUI v6+, x-date-pickers, material-react-table |
| Server state | TanStack React Query 5 |
| Form | react-hook-form + Zod resolver |
| Router | react-router-dom 7 |
| i18n | i18next + react-i18next, mặc định `vi`, hỗ trợ `en` |
| API client | Sinh từ OpenAPI vào `packages/api-client` |
| Test | Vitest + Testing Library, Playwright + axe-core |

---

## 4. Role Management — định hướng CEO

> Role Management là nền móng vận hành. Thiết kế phải phục vụ cửa hàng thật: kiểm soát tiền, hàng tồn, đơn hàng, công nợ, nhân sự, báo cáo và phân quyền theo trách nhiệm.

Chi tiết đầy đủ đặt tại `docs/requirements/role-management.md`.

### 4.1 Nguyên tắc thiết kế

- **Title là chức danh kinh doanh**, ví dụ Giám đốc, Quản lý cửa hàng, Kế toán, Thủ kho, Nhân viên bán hàng.
- **Role group là quyền hệ thống**, ví dụ Super admin, System admin, Support admin, User.
- Một title được gán vào một role group mặc định, nhưng có thể override bằng permission matrix sau này.
- Không hard-code quyền theo title. Backend kiểm tra bằng capability/permission.
- Mọi thao tác nhạy cảm phải có audit log: ai làm, lúc nào, trước/sau ra sao.
- Quyền xóa dữ liệu thật phải hạn chế; ưu tiên archive/cancel/reverse thay vì hard delete.

### 4.2 Role group tạm thời

| Role group | Ý nghĩa | Phạm vi quyền mặc định |
| --- | --- | --- |
| Super admin | Chủ hệ thống / chủ tenant cao nhất | Toàn quyền, bao gồm billing, plan, cấu hình hệ thống, phân quyền cấp cao |
| System admin | Quản trị vận hành | Thêm/sửa/xem record, quản lý user, gán quyền trong phạm vi tenant, cấu hình cửa hàng |
| Support admin | Quản lý hỗ trợ / vận hành | Thêm/sửa/xem record, xem thống kê/báo cáo, hỗ trợ xử lý nghiệp vụ, không toàn quyền user/billing |
| User | Nhân viên sử dụng hằng ngày | Tạo đơn hàng, xem record được phân quyền, xem tồn kho, thao tác nghiệp vụ được giao |

### 4.3 Title đề xuất cho cửa hàng vật liệu xây dựng

| Nhóm chức danh | Title | Role group mặc định | Lý do kinh doanh |
| --- | --- | --- | --- |
| Chủ sở hữu | Chủ cửa hàng / Giám đốc | Super admin | Quyết định tiền, người, gói dịch vụ, dữ liệu và quyền cao nhất |
| Quản trị | Quản trị hệ thống | System admin | Cài đặt hệ thống, user, quyền, danh mục, cấu hình |
| Quản lý | Quản lý cửa hàng / Quản lý chi nhánh | Support admin | Điều phối bán hàng, tồn kho, báo cáo, xử lý sai lệch |
| Bán hàng | Nhân viên bán hàng | User | Tạo báo giá, đơn hàng, hóa đơn bán, xem tồn kho để tư vấn |
| Kho | Thủ kho / Nhân viên kho | User | Nhập/xuất/chuyển kho/kiểm kho; không cần quyền tài chính đầy đủ |
| Kế toán | Kế toán bán hàng / Kế toán công nợ | Support admin | Theo dõi hóa đơn, thu chi, công nợ, báo cáo tài chính vận hành |
| Mua hàng | Nhân viên mua hàng | User | Tạo đơn nhập, làm việc với nhà cung cấp, theo dõi hàng về |
| Giao hàng | Nhân viên giao hàng | User | Xem đơn cần giao, cập nhật trạng thái giao, bằng chứng giao hàng |
| Thu ngân | Thu ngân | User | Ghi nhận thanh toán, in hóa đơn/phiếu thu theo quyền |
| CSKH | Nhân viên chăm sóc khách hàng | User | Xem lịch sử mua, hỗ trợ đổi trả/khiếu nại theo quyền |
| Kiểm toán | Kiểm soát nội bộ / Auditor | Support admin | Xem báo cáo, audit log, phát hiện sai lệch; hạn chế sửa dữ liệu |

### 4.4 Module quyền cần chuẩn bị cho permission matrix

- User & Role: user, title, role group, custom permission.
- Product: sản phẩm, đơn vị tính, giá bán, nhóm hàng.
- Warehouse: kho, vị trí, tồn kho.
- Inventory: nhập kho, xuất kho, chuyển kho, kiểm kho, điều chỉnh tồn.
- Sales/Order: báo giá, đơn hàng, hóa đơn bán hàng, trả hàng.
- Purchase: nhà cung cấp, đơn nhập, hóa đơn mua.
- Customer: khách hàng, hạn mức công nợ, lịch sử mua.
- Finance: thanh toán, phiếu thu/chi, công nợ, chiết khấu.
- Report: doanh thu, lợi nhuận, tồn kho, công nợ, hiệu suất nhân viên.
- Settings: chi nhánh, thuế, mẫu in, số chứng từ, cấu hình tenant.
- Audit: nhật ký thao tác, khôi phục/đối soát.

---

## 5. Song ngữ Việt / Anh

> Quyết định sản phẩm: Web app `vlxd` hỗ trợ song ngữ **Tiếng Việt / English**, trong đó **Tiếng Việt là ngôn ngữ mặc định và ưu tiên trước**.

Chi tiết đầy đủ đặt tại `docs/requirements/i18n.md`.

### 5.1 Quyết định đã chốt

| Hạng mục | Quyết định |
| --- | --- |
| Ngôn ngữ mặc định | `vi` |
| Ngôn ngữ hỗ trợ thêm | `en` |
| Ưu tiên nội dung | Viết tiếng Việt trước, dịch tiếng Anh sau |
| Fallback | Nếu thiếu bản dịch `en`, fallback sang `vi` |
| UI copy source of truth | i18next resource files trong `apps/web/src/i18n/` |
| Backend error code | Trả error code ổn định; frontend dịch message |
| Dữ liệu người dùng nhập | Giữ nguyên theo người dùng nhập, không tự dịch |

### 5.2 Quy tắc frontend

- Dùng `i18next + react-i18next`.
- Mặc định locale là `vi`.
- Mọi text hiển thị trong UI phải đi qua translation key.
- Không viết trực tiếp text tiếng Việt/Anh trong JSX trừ dữ liệu động từ backend/user.
- Key đặt theo module/feature để dễ quản lý.

Ví dụ cấu trúc:

```text
apps/web/src/i18n/
├── index.ts
├── locales/
│   ├── vi/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── product.json
│   │   ├── warehouse.json
│   │   ├── inventory.json
│   │   ├── order.json
│   │   ├── invoice.json
│   │   ├── role-management.json
│   │   └── service-plan.json
│   └── en/
│       ├── common.json
│       ├── auth.json
│       ├── product.json
│       ├── warehouse.json
│       ├── inventory.json
│       ├── order.json
│       ├── invoice.json
│       ├── role-management.json
│       └── service-plan.json
```

### 5.3 Quy tắc backend/API

Backend không trả message UI cố định theo ngôn ngữ nếu không cần. Backend nên trả error code ổn định:

```json
{
  "errorCode": "PRODUCT_LIMIT_REACHED",
  "details": {
    "limit": 80
  }
}
```

Frontend chịu trách nhiệm dịch:

- `vi`: `Bạn đã đạt giới hạn 80 sản phẩm của gói hiện tại.`
- `en`: `You have reached the 80-product limit for your current plan.`

### 5.4 Format theo locale

- Tiền tệ mặc định: VND.
- Ngày giờ mặc định: Việt Nam, timezone `Asia/Ho_Chi_Minh`.
- Số lượng vật liệu có thể cần đơn vị tính: viên, bao, tấn, kg, m³, cây, tấm, thùng.
- Format số/ngày/tiền phải dùng `Intl` hoặc utility tập trung, không tự format thủ công rải rác.

---

## 6. Gói dịch vụ

| Tính năng | Free | Standard | Premium | Enterprise |
| --- | --- | --- | --- | --- |
| Sử dụng ứng dụng | Có | Có | Có | Có |
| Giới hạn sản phẩm | 80 | 800 | Không giới hạn | Không giới hạn |
| Số nhà kho | 1 | 1 | Không giới hạn | Không giới hạn |
| AI agent chat/voice | Không | Không | Có | Có |
| OCR hóa đơn viết tay | Không | Không | Có | Có |
| DB riêng biệt | Không | Không | Không | Có |

- Gói gắn theo tenant/công ty.
- Nâng/hạ gói được phép; khi hạ gói mà vượt hạn mức thì giữ dữ liệu cũ, chặn tạo mới.
- Enterprise DB riêng cấu hình thủ công bởi admin.

---

## 7. Workflow bắt buộc cho AI Agent

### Trước khi code

1. Đọc `AGENTS.md` root.
2. Đọc `docs/README.md`, `docs/decision-backlog.md`, ADR liên quan.
3. Đọc `AGENTS.md` con của thư mục sẽ sửa nếu có.
4. Xác minh requirement/contract đã được chấp nhận.
5. Nếu đổi API: sửa `contracts/http/openapi.yaml` trước rồi regenerate client.

### Khi code

- Feature mới tạo slice đầy đủ theo mục 2.
- Chỉ import qua `index.ts` của feature khác.
- Input từ ngoài parse bằng Zod.
- Chuỗi UI đi qua i18next.
- Giới hạn gói và quyền role enforce ở backend.
- Không thêm dependency mới nếu chưa ghi lý do vào PR.

### Trước khi coi là xong

```bash
pnpm -r check
```

Gate gồm format, lint, typecheck, test, build, OpenAPI drift, bundle budget, secret scan.

---

## 8. Definition of Done

- [ ] Contract/API cập nhật trước khi code.
- [ ] Unit/integration test phù hợp.
- [ ] `pnpm -r check` xanh.
- [ ] Không secret, không `any` vô lý, không tắt lint thiếu lý do.
- [ ] Permission/plan enforce ở backend.
- [ ] Migration reversible nếu có đổi DB.
- [ ] Tài liệu/ADR cập nhật.
- [ ] Mục Trạng thái tiến độ cập nhật.

### 8.1 Definition of Done cho UI feature

Một UI feature chỉ được coi là xong khi:

- [ ] Có translation key tiếng Việt.
- [ ] Có translation key tiếng Anh hoặc fallback rõ ràng sang tiếng Việt.
- [ ] Không hard-code UI copy trong component.
- [ ] Error/empty/loading/success state đều có bản dịch.
- [ ] Button, menu, dialog, table header, form label, validation message đều đi qua i18n.
- [ ] Test hoặc review kiểm tra được locale `vi` mặc định.

---

## 9. Anti-pattern cấm

| Anti-pattern | Thay bằng |
| --- | --- |
| Giữ tiến độ trong chat | Ghi vào `AGENTS.md` |
| FE gọi Supabase trực tiếp | Gọi backend `apps/api` |
| Business logic nằm trong `utils`/`components` | Đưa vào feature slice |
| Global `controllers/services/repositories` | `features/<feature>/...` |
| Import vào file nội bộ feature khác | Import qua `index.ts` |
| Hard-code quyền theo title | Kiểm tra capability/permission |
| Xóa cứng dữ liệu nghiệp vụ | Archive/cancel/reverse + audit log |
| Sửa code generated | Sửa OpenAPI rồi regenerate |
| Hard-code UI text trong component | Dùng i18next translation key |
| Backend trả message UI theo ngôn ngữ cố định | Backend trả error code, frontend dịch |
| Giữ docs/html/csv xuất tạm không còn giá trị | Xóa hoặc chuẩn hóa vào `docs/requirements` |

---

## 10. Trạng thái tiến độ

### Đã xong

- [x] TASK-001 — Đối soát trạng thái repo, cô lập prototype sang `prototype/legacy-app/` (read-only), xuất bảng feature inventory (`docs/requirements/prototype-feature-inventory.md`).
- [x] Làm rõ cấu trúc repo tách `apps/web` và `apps/api`, mỗi bên chia `features/<feature>`.
- [x] Thêm định hướng Role Management cho cửa hàng vật liệu xây dựng (`docs/requirements/role-management.md`).
- [x] Chuẩn hóa yêu cầu gói dịch vụ ở mức root AGENTS và `docs/requirements/service-plans.md`.
- [x] Thêm yêu cầu song ngữ Việt / Anh, mặc định tiếng Việt (`docs/requirements/i18n.md`).
- [x] Viết lại MVP backlog theo milestone + lane song song (`docs/tasks/MVP-BACKLOG.md`, `docs/tasks/CURRENT.md`).
- [x] Thiết lập quy trình AI workflow 2-bot tuần tự (`docs/ai-workflow/README.md`).

### Đang làm

- [ ] `TASK-001`: Review và merge PR cô lập prototype.

### Bước tiếp theo

- [ ] `TASK-002` (M0): Xây dựng `docs/decision-backlog.md` và khóa quyết định nghiệp vụ trước khi code.
- [ ] `TASK-003` (M0): Hoàn thiện Requirements MVP theo capability (`docs/requirements/*.md`).
- [ ] `TASK-004` (M0): Viết ADR kiến trúc production (`docs/adr/`).
- [ ] `TASK-005` (M0): Scaffold monorepo skeleton (`apps/web`, `apps/api`, `packages/*`) và quality baseline.
