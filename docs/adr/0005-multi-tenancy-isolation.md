# ADR-0005: Mô hình Phân lập Dữ liệu Đa thuê bao (Multi-Tenancy)

## 1. Metadata

- **Mã:** ADR-0005
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 1 & 6), `docs/decision-backlog.md` (DEC-001, DEC-002)

---

## 2. Context & Problem Statement

Hệ thống `vlxd` vận hành theo mô hình SaaS B2B phục vụ đồng thời hàng nghìn cửa hàng và doanh nghiệp vật liệu xây dựng (Tenants). Rủi ro rò rỉ dữ liệu giữa các tenant (Cross-Tenant Data Leakage) — ví dụ cửa hàng A nhìn thấy giá bán, khách hàng hoặc công nợ của cửa hàng B — là lỗi nghiêm trọng nhất ở cấp độ an ninh và uy tín kinh doanh.

Cần một chiến lược phân lập dữ liệu đa thuê bao đảm bảo:

- Chi phí hạ tầng tối ưu cho các gói Free, Standard, Premium (chia sẻ DB dùng chung).
- Bảo mật tầng sâu (Defense-in-depth) chống rò rỉ dữ liệu ngay cả khi lập trình viên quên thêm điều kiện `WHERE tenant_id = ...`.
- Hỗ trợ triển khai Cơ sở dữ liệu riêng biệt (Dedicated DB) cho khách hàng gói Enterprise theo cam kết bảo mật.

---

## 3. Decision Drivers

- An ninh phân lập dữ liệu tuyệt đối (Zero Data Leakage).
- Tối ưu hóa chi phí vận hành hạ tầng trên Supabase Postgres.
- Đơn giản trong việc scale và bảo trì schema chung cho toàn hệ thống.
- Hỗ trợ kiến trúc mở cho khách hàng Enterprise yêu cầu Dedicated DB.

---

## 4. Considered Options

- **Option A: Database-per-Tenant:** Mỗi cửa hàng một Database riêng biệt. (Chi phí hạ tầng cực kỳ cao, quản lý hàng nghìn migration song song rất phức tạp, lãng phí tài nguyên cho các tenant Free/Standard).
- **Option B: Schema-per-Tenant:** Mỗi cửa hàng một PostgreSQL Schema trong cùng DB. (Khó quản lý khi số lượng tenant lớn $> 1000$, connection pooling khó tối ưu).
- **Option C: Shared Database với Tenant ID + Row-Level Security (RLS) + Dedicated DB cho Enterprise (Chọn):**
  - Các gói Free, Standard, Premium: Dùng chung Database; mọi bảng nghiệp vụ đều có cột `tenant_id` và được bảo vệ bởi PostgreSQL RLS và Tenant Context middleware.
  - Gói Enterprise: Hỗ trợ cấu hình chuỗi kết nối Database riêng (`dedicated_db_url`) độc lập.

---

## 5. Decision Outcome

**Chọn Option C: Mô hình Lai (Hybrid Multi-Tenancy): Shared Database với Tenant Discriminator Column + PostgreSQL RLS, mở rộng Dedicated DB cho Enterprise.**

### Cơ chế bảo vệ 3 lớp (Defense-in-Depth):

1. **Lớp 1 — Request Context Middleware:**
   - Mọi request sau khi xác thực session sẽ giải mã ra `tenant_id` của user và gắn vào Fastify Request Context.
2. **Lớp 2 — Repository Query Filtering:**
   - Kysely repository mặc định luôn đính kèm điều kiện `.where('tenant_id', '=', ctx.tenantId)` trong mọi câu lệnh `SELECT`, `UPDATE`, `DELETE`.
3. **Lớp 3 — PostgreSQL Row-Level Security (RLS):**
   - Kích hoạt RLS trên toàn bộ bảng nghiệp vụ:
     ```sql
     ALTER TABLE products ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation_policy ON products
       USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
     ```
   - Transaction backend thiết lập session variable `app.current_tenant_id` trước khi thực thi query.

---

## 6. Consequences

### Positive Consequences

- **An toàn tuyệt đối:** Ngay cả khi có sơ suất thiếu `WHERE tenant_id` trong code, database RLS vẫn chặn không cho query trả về dữ liệu của tenant khác.
- **Tối ưu chi phí:** Hàng nghìn tenant nhỏ có thể chạy mượt mà trên một cụm Supabase Postgres chung với connection pool hiệu quả (PgBouncer).
- **Đáp ứng yêu cầu Enterprise:** Dễ dàng định tuyến (route) connection sang Dedicated DB nếu tenant thuộc gói Enterprise.

### Negative Consequences & Mitigations

- _Cần đánh Index trên `tenant_id`:_ Mọi bảng nghiệp vụ bắt buộc phải có Composite Index bắt đầu bằng `tenant_id` (vd: `INDEX(tenant_id, created_at)` hoặc `UNIQUE(tenant_id, sku)`).
- _Overhead thiết lập session variable RLS:_ Chỉ áp dụng cho các query nhạy cảm hoặc bọc tự động qua Kysely Plugin/Middleware.

---

## 7. Compliance & Enforcement

- Mọi bảng nghiệp vụ mới tạo trong `db/migrations/` bắt buộc phải có cột `tenant_id UUID NOT NULL REFERENCES tenants(id)`.
- Các bảng chỉ được phép không có `tenant_id` nếu là bảng hệ thống toàn cục của SaaS (như `tenants`, `platform_plans`, `platform_admins`).
