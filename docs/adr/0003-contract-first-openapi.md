# ADR-0003: Phát triển Contract-First với OpenAPI 3.1

## 1. Metadata

- **Mã:** ADR-0003
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 0 & 4), `MVP-BACKLOG.md` (TASK-007)

---

## 2. Context & Problem Statement

Trong các dự án phát triển web app tách biệt Frontend và Backend, sự lệch pha giữa định dạng dữ liệu Backend trả về và dữ liệu Frontend mong đợi (API Drift) là nguyên nhân hàng đầu gây ra lỗi runtime, chậm tiến độ và giảm độ tin cậy của phần mềm.

Nếu phát triển theo kiểu Code-First (Backend viết code trước rồi sinh tài liệu hoặc không có tài liệu), Frontend thường phải chờ Backend hoàn thành mới code được, hoặc phải tự viết mock data không chính xác.

Cần một phương pháp tiếp cận lấy Hợp đồng API (API Contract) làm trung tâm, đảm bảo tính nhất quán tuyệt đối giữa Frontend và Backend, hỗ trợ sinh mã nguồn tự động và phát triển song song (parallel development).

---

## 3. Decision Drivers

- Hợp đồng API rõ ràng trước khi bắt đầu code bất kỳ tính năng nào.
- Sinh tự động TypeScript types và API client cho Frontend để đạt được Type-safety từ server tới client.
- Tự động kiểm tra tính hợp lệ của request/response schema ở Backend.
- Ngăn chặn triệt để tình trạng sửa API ngầm không qua phê duyệt.

---

## 4. Considered Options

- **Option A: Code-First với Swagger/OpenAPI decorator trong backend:** Định nghĩa schema bằng decorator/annotations trong code Fastify/NestJS rồi sinh ra file JSON. (Bị loại vì Frontend phụ thuộc vào code backend; khó review hợp đồng độc lập).
- **Option B: Contract-First với OpenAPI 3.1 YAML (Chọn):** File `contracts/http/openapi.yaml` là nguồn sự thật duy nhất (Single Source of Truth); cả Frontend và Backend đều bám sát theo hợp đồng này.
- **Option C: tRPC:** Rất tốt cho full-stack TypeScript thuần túy, nhưng khó tích hợp với bên thứ ba (third-party integrations, webhook đối tác) và không hỗ trợ chuẩn REST/OpenAPI mở.

---

## 5. Decision Outcome

**Chọn Option B: Quy trình Contract-First dựa trên `contracts/http/openapi.yaml`.**

### Luồng làm việc chuẩn (Workflow):
1. **Thiết kế Contract:** Khi có tính năng mới hoặc thay đổi API, kỹ sư cập nhật `contracts/http/openapi.yaml` trước.
2. **Sinh mã Client:** Chạy lệnh `pnpm generate:api-client` để tự động sinh mã TypeScript API Client và types vào package `@vlxd/api-client`.
3. **Backend Binding:** Backend Fastify sử dụng `fastify-type-provider-zod` để validate request payload và response structure khớp 100% với contract.
4. **Frontend Integration:** Frontend gọi API qua các React Query hooks bọc quanh `@vlxd/api-client`.

---

## 6. Consequences

### Positive Consequences
- **Type Safety Tuyệt đối:** Khi contract thay đổi, TypeScript compiler ở Frontend sẽ lập tức báo lỗi đỏ tại các vị trí component bị ảnh hưởng.
- **Song song hóa tối đa:** Frontend có thể bắt đầu code giao diện ngay sau khi PR OpenAPI Contract được merge mà không cần chờ Backend code xong.
- **Tài liệu API luôn chuẩn xác:** Tài liệu OpenAPI không bao giờ bị lỗi thời so với thực tế.

### Negative Consequences & Mitigations
- *Cần bảo trì file OpenAPI YAML:* Sử dụng cấu trúc chia nhỏ file OpenAPI (hoặc ref component) nếu file quá lớn.
- *Tuyệt đối cấm sửa file generated bằng tay:* Thêm script CI kiểm tra `pnpm check:openapi-drift` để phát hiện nếu ai đó sửa code trong `packages/api-client` mà không thông qua OpenAPI.

---

## 7. Compliance & Enforcement

- Mọi Pull Request thay đổi API bắt buộc phải chứa thay đổi tại `contracts/http/openapi.yaml` và bản regenerate tương ứng trong `packages/api-client`.
- Cấm tuyệt đối việc Frontend tự gõ kiểu dữ liệu `any` hoặc tự viết hàm `fetch()` trực tiếp mà không qua `@vlxd/api-client`.
