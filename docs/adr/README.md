# Architecture Decision Records (ADR) — vlxd

> Danh mục các quyết định kiến trúc cốt lõi, quan trọng và khó đảo ngược của dự án `vlxd`.
> Được thiết lập theo quy định tại `TASK-004` (`docs/tasks/MVP-BACKLOG.md`).
>
> Mọi ADR tuân thủ chuẩn cấu trúc MADR (Markdown Architectural Decision Records), phản ánh chính xác nguồn sự thật trong `AGENTS.md` và `docs/decision-backlog.md`.

---

## Danh mục Quyết định Kiến trúc

| ADR                                                                                                | Tiêu đề                                                   | Trạng thái | Ngày quyết định | Phạm vi ảnh hưởng                                  |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- | --------------- | -------------------------------------------------- |
| [ADR-0001](file:///f:/2.sources/b.vlxd/repo/docs/adr/0001-monorepo-structure.md)                   | Cấu trúc Monorepo với pnpm workspace                      | `Accepted` | 2026-08-22      | Toàn bộ codebase (`apps/*`, `packages/*`)          |
| [ADR-0002](file:///f:/2.sources/b.vlxd/repo/docs/adr/0002-vertical-slice-architecture.md)          | Tổ chức mã nguồn theo Vertical Slice Feature              | `Accepted` | 2026-08-22      | `apps/web`, `apps/api`                             |
| [ADR-0003](file:///f:/2.sources/b.vlxd/repo/docs/adr/0003-contract-first-openapi.md)               | Phát triển Contract-First với OpenAPI 3.1                 | `Accepted` | 2026-08-22      | `contracts/http`, `packages/api-client`            |
| [ADR-0004](file:///f:/2.sources/b.vlxd/repo/docs/adr/0004-database-and-data-access.md)             | Database Supabase Postgres, dbmate Migration & Kysely     | `Accepted` | 2026-08-22      | `apps/api`, `db/migrations`                        |
| [ADR-0005](file:///f:/2.sources/b.vlxd/repo/docs/adr/0005-multi-tenancy-isolation.md)              | Mô hình Phân lập Dữ liệu Đa thuê bao (Multi-Tenancy)      | `Accepted` | 2026-08-22      | `apps/api`, `db`, RLS Security                     |
| [ADR-0006](file:///f:/2.sources/b.vlxd/repo/docs/adr/0006-auth-and-authorization.md)               | Xác thực Server Session & Phân quyền Capability           | `Accepted` | 2026-08-22      | `apps/api/src/features/auth`, `role-management`    |
| [ADR-0007](file:///f:/2.sources/b.vlxd/repo/docs/adr/0007-immutable-ledgers-and-state-machines.md) | Sổ cái Bất biến (Immutable Ledgers) & State Machines      | `Accepted` | 2026-08-22      | `inventory`, `sales-order`, `finance-debt`         |
| [ADR-0008](file:///f:/2.sources/b.vlxd/repo/docs/adr/0008-i18n-vietnamese-first.md)                | Chiến lược Đa ngôn ngữ Vietnamese-First                   | `Accepted` | 2026-08-22      | `apps/web/src/i18n`, backend error codes           |
| [ADR-0009](file:///f:/2.sources/b.vlxd/repo/docs/adr/0009-service-plans-enforcement.md)            | Thực thi Rào chắn Gói Dịch vụ (Service Plans Enforcement) | `Accepted` | 2026-08-22      | `apps/api`, `service-plan`, `product`, `warehouse` |

---

## Nguyên tắc Quản trị ADR

1. **Bất biến theo thời gian:** Một khi ADR đã được phê duyệt (`Accepted`), không sửa đổi nội dung quyết định cũ trừ lỗi chính tả.
2. **Thay thế bằng ADR mới:** Nếu có sự thay đổi kiến trúc trong tương lai, tạo một ADR mới với trạng thái `Accepted` và đánh dấu ADR cũ thành `Superseded by ADR-XXXX`.
3. **Tuân thủ bắt buộc:** Mọi pull request triển khai code (`apps/web`, `apps/api`, `packages/*`) nếu vi phạm các nguyên tắc trong ADR sẽ bị từ chối trong review gate.
