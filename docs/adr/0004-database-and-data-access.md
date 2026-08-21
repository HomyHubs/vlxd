# ADR-0004: Database Supabase Postgres, dbmate Migration & Kysely

## 1. Metadata

- **Mã:** ADR-0004
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 0 & 3), `MVP-BACKLOG.md` (TASK-008)

---

## 2. Context & Problem Statement

Hệ thống quản lý vật liệu xây dựng `vlxd` yêu cầu tính toàn vẹn dữ liệu cực kỳ khắt khe: Sổ cái tồn kho bất biến (Inventory Ledger), Sổ nợ kép (Debt Ledger), kiểm soát xuất âm (No-negative stock), khóa dòng (Row-Level Locking) và các giao dịch tài chính ACID.

Các vấn đề thường gặp với các ORM thế hệ cũ (TypeORM, Prisma, Sequelize):
- Tạo ra các câu lệnh SQL tự động cồng kềnh, N+1 query tiềm ẩn và khó tối ưu hóa hiệu năng cho các truy vấn phức tạp.
- Khó kiểm soát trực tiếp các tính năng mạnh mẽ của PostgreSQL (như Partial Indexes, Generated Columns, Trigger, Advisory Locks, CTEs).
- Hệ thống migration của một số ORM tự động sinh code khó kiểm soát, khó rollback an toàn (non-reversible).

Cần một kiến trúc cơ sở dữ liệu mạnh mẽ, công cụ migration thuần SQL minh bạch và thư viện truy vấn Type-safe không che giấu SQL.

---

## 3. Decision Drivers

- Cơ sở dữ liệu quan hệ chuẩn công nghiệp hỗ trợ ACID mạnh mẽ.
- Migration viết bằng SQL thuần túy (Pure SQL), kiểm soát 100% DDL và bắt buộc phải đảo ngược được (Up & Down reversible).
- Data access layer type-safe, không overhead, viết query trực quan như SQL.
- Phân tách rõ ràng: Frontend không bao giờ kết nối DB trực tiếp; mọi truy cập DB phải qua Backend `apps/api`.

---

## 4. Considered Options

- **Database Engine:**
  - *Option A: MySQL / MariaDB:* Hỗ trợ tốt, nhưng tính năng Row-level security, JSONB và CTE yếu hơn PostgreSQL.
  - *Option B: PostgreSQL do Supabase cung cấp (Chọn):* Hệ quản trị CSDL quan hệ mạnh mẽ nhất hiện nay, hỗ trợ RLS, JSONB tối ưu, ACID tuyệt đối, sẵn sàng mở rộng cho Enterprise DB riêng.
- **Migration Tool:**
  - *Option A: Prisma Migrate:* Sinh migration tự động, nhưng cú pháp schema riêng (DSL), khó viết SQL nâng cao.
  - *Option B: dbmate (Chọn):* Công cụ migration độc lập, siêu nhẹ, viết bằng SQL thuần túy, hỗ trợ transactional migrations và bắt buộc có cả block `-- migrate:up` và `-- migrate:down`.
- **Data Access Layer:**
  - *Option A: Prisma Client / TypeORM:* ORM nặng, sinh query phức tạp, tốn tài nguyên.
  - *Option B: Kysely trên `pg` driver (Chọn):* Type-safe SQL query builder cho TypeScript, zero-overhead runtime, syntax khớp 1-1 với SQL, autocomplete hoàn hảo dựa trên DB schema interfaces.

---

## 5. Decision Outcome

**Chọn bộ giải pháp: Supabase PostgreSQL + dbmate (SQL Migration) + Kysely Data Access.**

### Quy ước triển khai:
1. **Migrations (`db/migrations/`):**
   - Mọi thay đổi cấu trúc bảng, index, trigger đều phải được viết trong file `.sql` có timestamp.
   - Luôn luôn có cả phần `-- migrate:up` và `-- migrate:down` để đảm bảo rollback an toàn 100%.
2. **Schema Type Generation:**
   - Dùng công cụ `kysely-codegen` để sinh TypeScript Database interfaces tự động từ database thực tế vào `apps/api/src/platform/db/types.ts`.
3. **Repository Pattern:**
   - Mọi truy vấn database trong backend nằm trong `features/<feature>/repository.ts`, sử dụng instance `Kysely<Database>`.

---

## 6. Consequences

### Positive Consequences
- **Kiểm soát tuyệt đối SQL:** Kỹ sư nhìn thấy chính xác câu lệnh SQL chạy trên database, dễ dàng EXPLAIN ANALYZE và thêm index tối ưu.
- **An toàn giao dịch:** Hỗ trợ transaction đầy đủ: `db.transaction().execute(async (trx) => { ... })`.
- **Reversible Migrations:** Bất kỳ migration nào gặp sự cố trên môi trường staging/production đều có thể rollback ngay lập tức qua `dbmate rollback`.

### Negative Consequences & Mitigations
- *Phải tự viết SQL migration:* Kỹ sư cần nắm vững SQL DDL tiêu chuẩn. Đã có hướng dẫn viết migration mẫu trong `db/README.md`.
- *Cần đồng bộ type sau khi migrate:* Tích hợp lệnh `pnpm db:migrate && pnpm db:codegen` vào quy trình local development.

---

## 7. Compliance & Enforcement

- Tuyệt đối cấm Frontend gọi trực tiếp Supabase client để đọc/ghi DB (vi phạm quy tắc AGENTS.md mục 0).
- Mọi PR có thay đổi database bắt buộc phải có migration file hợp lệ với cả `up` và `down`.
