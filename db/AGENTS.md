# AGENTS.md — db (Database, Migrations & Seeds)

> Chỉ dẫn cho AI coding agent làm việc với PostgreSQL database, migrations và seeds.

## 1. Nguyên tắc cốt lõi

1. **Pure SQL Reversible Migrations:** Dùng `dbmate` để quản lý migration bằng SQL thuần. Mọi migration phải có cả phần `-- migrate:up` và `-- migrate:down`.
2. **Multi-Tenancy Discriminator:** Mọi bảng chứa dữ liệu nghiệp vụ phải có cột `tenant_id uuid NOT NULL REFERENCES tenants(id)`.
3. **UTC Timestamps:** Mọi cột thời gian dùng `timestamptz` và mặc định `timezone('utc'::text, now())`.
4. **Soft Delete / Archive:** Bảng nghiệp vụ dùng `archived_at timestamptz DEFAULT NULL`. Không xóa cứng dữ liệu giao dịch hoặc chứng từ.
5. **No Secret in Seeds:** Thư mục `seeds/` chỉ chứa dữ liệu giả định deterministic để kiểm thử. Không chứa mật khẩu thật, API keys hoặc PII.

## 2. Cấu trúc thư mục

```text
db/
├── AGENTS.md
├── migrations/      # Các file SQL migration được đánh số thứ tự thời gian
└── seeds/           # Các script SQL seed dữ liệu mẫu
```
