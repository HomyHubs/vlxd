# ADR-0001: Cấu trúc Monorepo với pnpm workspace

## 1. Metadata

- **Mã:** ADR-0001
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 2 & 3), `MVP-BACKLOG.md` (TASK-005)

---

## 2. Context & Problem Statement

Hệ thống quản lý vật liệu xây dựng `vlxd` bao gồm cả ứng dụng giao diện người dùng (Frontend Web App), dịch vụ xử lý nghiệp vụ trung tâm (Backend REST API), và các thư viện dùng chung (Zod validation schemas, domain types, generated API client, cấu hình tooling lint/format).

Nếu phát triển theo mô hình multi-repo (tách repo riêng cho frontend, backend và shared packages):

- Rất khó đồng bộ hợp đồng API và schema validation khi có thay đổi nghiệp vụ.
- Tăng chi phí CI/CD, quản lý phiên bản (versioning) và phát hành packages nội bộ qua private registry (như Verdaccio hay npm private).
- Khó thực hiện các atomic PR (1 PR thay đổi cả schema, backend route, và frontend component).

Do đó, cần một cấu trúc monorepo tinh gọn, tốc độ cao, tiết kiệm dung lượng đĩa và hỗ trợ tốt TypeScript 5.9+ ESM.

---

## 3. Decision Drivers

- Tốc độ cài đặt dependency và tái sử dụng cache hiệu quả.
- Hỗ trợ TypeScript Project References và ESM native mượt mà.
- Chia sẻ trực tiếp các Zod schema và Type contracts giữa Backend và Frontend mà không cần publish lên npm registry.
- Tương thích tốt với Turbo build pipeline và CI gates.

---

## 4. Considered Options

- **Option A: npm / yarn workspaces:** Quản lý workspace cơ bản, nhưng tốc độ cài đặt chậm hơn, cơ chế hoisting phẳng dễ gây phantom dependencies (import dependency mà không khai báo).
- **Option B: Turborepo kết hợp pnpm workspace (Chọn):** pnpm sử dụng hard links và content-addressable storage cực kỳ tiết kiệm đĩa, cô lập dependency nghiêm ngặt chống phantom dependencies; Turborepo tối ưu hóa song song hóa task build/lint/test.
- **Option C: Nx:** Mạnh mẽ cho enterprise lớn nhưng cấu hình nặng nề, phức tạp và overhead cao so với nhu cầu dự án MVP.

---

## 5. Decision Outcome

**Chọn Option B: Sử dụng pnpm 11.x workspace kết hợp Turborepo.**

Cấu trúc thư mục chuẩn hóa:

```text
repo/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── apps/
│   ├── web/                     # Frontend React 19 + Vite + MUI
│   └── api/                     # Backend Fastify 5 + Kysely
└── packages/
    ├── shared/                  # Zod schemas, domain types, error codes
    ├── api-client/              # Generated TypeScript API client từ OpenAPI
    ├── config-eslint/           # Shared ESLint rules
    ├── config-ts/               # Shared tsconfig bases
    └── config-prettier/         # Shared Prettier rules
```

---

## 6. Consequences

### Positive Consequences

- **Zero Phantom Dependencies:** pnpm symlink structure đảm bảo project chỉ import được các dependency đã khai báo trong `package.json`.
- **Type Sharing:** `apps/api` và `apps/web` đều có thể import trực tiếp `@vlxd/shared` để dùng chung Zod schema và validation logic.
- **Tốc độ build vượt trội:** Tận dụng cache của Turbo cho lint, typecheck và unit test.

### Negative Consequences & Mitigations

- _Phức tạp khi setup tooling ban đầu:_ Đã có `packages/config-*` chuẩn hóa cấu hình cho toàn bộ workspace.
- _Yêu cầu cài đặt pnpm:_ Ghim phiên bản Node qua `.nvmrc` và quản lý phiên bản pnpm qua `packageManager` trong root `package.json`.

---

## 7. Compliance & Enforcement

- Mọi package nội bộ phải đặt scope `@vlxd/*` (vd: `@vlxd/shared`, `@vlxd/api-client`).
- CI pipeline chạy `pnpm -r check` để kiểm tra toàn bộ workspace trước khi merge.
