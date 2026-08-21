# vlxd — Web app quản lý cửa hàng Vật liệu Xây dựng

Hệ thống quản lý bán hàng, kho bãi, công nợ và chuỗi vận hành chuyên biệt cho ngành Vật liệu Xây dựng.

## Trạng thái Repository

- **Prototype tham khảo:** Đã cô lập tại `prototype/legacy-app/` (bản AI Studio standalone prototype sử dụng LocalStorage mock, đánh dấu **Read-Only**).
- **Mã nguồn Production:** Đang trong lộ trình triển khai theo mô hình Clean Architecture & Contract-First tại `apps/web` và `apps/api` (chi tiết tại `docs/tasks/MVP-BACKLOG.md`).

## Mục tiêu nghiệp vụ

- Quản lý sản phẩm, quy đổi đơn vị tính đặc thù (m³, kg, tấn, viên, cây), nhóm hàng, lịch sử giá.
- Quản lý bãi vật liệu (Yard), kho hàng, tồn kho, kiểm kê, nhập/xuất/chuyển kho qua Sổ cái kho (Inventory Ledger).
- Quản lý khách hàng, nhà cung cấp, hạn mức tín dụng và sổ nợ kép (Debit/Credit).
- Bán hàng nhanh (POS), quản lý báo giá, đơn hàng, hóa đơn, phiếu giao hàng, trả hàng.
- Báo cáo doanh thu, lợi nhuận thực tế, giá trị tồn kho, hiệu suất kinh doanh.
- Phân quyền theo capability và chức danh kinh doanh thực tế (Role Management).
- Phân tầng gói dịch vụ: Free, Standard, Premium, Enterprise.
- Giao diện song ngữ Việt / Anh, tối ưu và ưu tiên tiếng Việt trước.

## Tài liệu chính

- `AGENTS.md` — Quy chuẩn vận hành bắt buộc cho AI coding agent và cấu trúc monorepo.
- `docs/tasks/MVP-BACKLOG.md` — Lộ trình triển khai MVP theo milestone (M0–M4) và lane song song.
- `docs/tasks/CURRENT.md` — Bảng theo dõi task active thời gian thực.
- `docs/ai-workflow/README.md` — Quy trình phát triển và review 2-bot tuần tự.
- `docs/requirements/prototype-feature-inventory.md` — Bảng đối soát chi tiết tính năng giữa prototype và production.
- `docs/requirements/role-management.md` — Thiết kế role, title, user và ma trận quyền.
- `docs/requirements/service-plans.md` — Gói dịch vụ và giới hạn sản phẩm/kho bãi.
- `docs/requirements/i18n.md` — Yêu cầu đa ngôn ngữ `vi` (mặc định) và `en`.

## Kiến trúc mục tiêu (Production)

- **Frontend:** `apps/web` — React 19 + TypeScript + Vite + MUI v6.
- **Backend:** `apps/api` — Node.js 24 + TypeScript ESM + Fastify 5 + `fastify-type-provider-zod` + Kysely.
- **Database:** PostgreSQL do Supabase cung cấp + dbmate migration.
- **Contract:** OpenAPI 3.1 (`contracts/http/openapi.yaml`) + Generated API Client (`packages/api-client`).
- **Monorepo:** pnpm workspace + Turbo.
- **Auth & Session:** Opaque server-side session + capability-based authorization.

