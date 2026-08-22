# AGENTS.md — apps/api (Backend Service)

> Chỉ dẫn cho AI coding agent làm việc trong module backend `apps/api`.

## 1. Nguyên tắc cốt lõi

1. **Vertical Slice Architecture:** Mọi nghiệp vụ đặt trong `src/features/<feature>/`. Không tạo controller/service/repository toàn cục.
2. **Contract-First:** Mọi route HTTP phải phản ánh chính xác OpenAPI contract tại `contracts/http/openapi.yaml`.
3. **Multi-Tenancy & Authorization:** Enforce `tenant_id` isolation và permission capabilities ở backend cho mọi request có xác thực.
4. **Validation & Errors:** Dùng Zod thông qua `fastify-type-provider-zod`. Trả về `ErrorCode` ổn định, không trả message gắn cứng theo ngôn ngữ.
5. **Observability:** Dùng Pino structured logger. Redact PII (mật khẩu, tokens, cookies, PII).

## 2. Cấu trúc chuẩn của một feature slice

```text
src/features/<feature>/
├── AGENTS.md        # Trạng thái và quy tắc riêng của feature
├── index.ts         # Public entry point (chỉ export những gì cần chia sẻ)
├── routes.ts        # Fastify HTTP routes (khớp OpenAPI)
├── service.ts       # Pure business logic
├── repository.ts    # Kysely queries / database access
├── schema.ts        # Zod input/output schemas
└── __tests__/       # Integration & unit tests
```

## 3. Tech Stack

- **Framework:** Fastify 5 + `fastify-type-provider-zod`
- **Database Access:** Kysely trên PostgreSQL (Supabase)
- **Validation:** Zod 4 (`@vlxd/shared`)
- **Logging:** Pino
- **Test:** Vitest + Testcontainers
