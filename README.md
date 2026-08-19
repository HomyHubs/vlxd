# vlxd — Web app quản lý cửa hàng Vật liệu Xây dựng

Repo `HomyHubs/vlxd` hiện ở giai đoạn **plan + hướng dẫn**, chưa có code sản phẩm.

## Mục tiêu

Xây dựng web app cho cửa hàng/doanh nghiệp vật liệu xây dựng:

- Quản lý sản phẩm, đơn vị tính, nhóm hàng, giá bán.
- Quản lý kho, tồn kho, nhập/xuất/chuyển kho/kiểm kho.
- Quản lý khách hàng, nhà cung cấp, công nợ.
- Tạo báo giá, đơn hàng, hóa đơn bán hàng, trả hàng.
- Báo cáo doanh thu, tồn kho, công nợ, hiệu suất nhân viên.
- Role Management và permission matrix cho từng chức năng.
- Gói dịch vụ Free, Standard, Premium, Enterprise.
- Giao diện song ngữ Việt / Anh, ưu tiên tiếng Việt trước.

## Tài liệu chính

- `AGENTS.md` — chỉ dẫn vận hành cho AI coding agent và trạng thái dự án.
- `docs/requirements/role-management.md` — thiết kế role, title, user và định hướng permission matrix.
- `docs/requirements/service-plans.md` — gói dịch vụ và giới hạn tính năng.
- `docs/requirements/i18n.md` — yêu cầu song ngữ Việt / Anh, mặc định tiếng Việt.

## Kiến trúc dự kiến

- Frontend: `apps/web` — React + Vite + MUI.
- Backend: `apps/api` — Node + Fastify + Kysely.
- Database: Supabase Postgres.
- API contract: `contracts/http/openapi.yaml`.
- Monorepo: pnpm workspace + turbo.
- i18n: `i18next + react-i18next`, mặc định `vi`, hỗ trợ `en`.

Chi tiết cấu trúc repo nằm trong `AGENTS.md`.
