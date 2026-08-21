# ADR-0008: Chiến lược Đa ngôn ngữ Vietnamese-First

## 1. Metadata

- **Mã:** ADR-0008
- **Trạng thái:** `Accepted`
- **Ngày quyết định:** 2026-08-22
- **Tác giả:** System Architect / AI Bot 1
- **Tham chiếu:** `AGENTS.md` (Mục 5 & 8.1), `docs/requirements/i18n.md`

---

## 2. Context & Problem Statement

Phần mềm `vlxd` phục vụ thị trường chính là các cửa hàng, nhà phân phối và doanh nghiệp vật liệu xây dựng tại Việt Nam, đồng thời có định hướng mở rộng hỗ trợ ngôn ngữ tiếng Anh cho các đối tác quốc tế hoặc doanh nghiệp có vốn nước ngoài.

Các vấn đề thường gặp khi phát triển hệ thống đa ngôn ngữ:
- Hard-code chuỗi ký tự (hardcoded strings) trực tiếp trong JSX/TSX khiến giao diện bị lai tạp (nửa Việt nửa Anh).
- Backend trả về message tiếng Anh hoặc tiếng Việt cố định, khiến Frontend không thể thay đổi ngôn ngữ linh hoạt cho người dùng.
- Thiếu bản dịch cho một số key dẫn tới việc giao diện bị hiển thị chuỗi rỗng hoặc key thô (`order.validation.min_quantity`).
- Format số lượng, tiền tệ và ngày tháng không theo định dạng chuẩn Việt Nam (VND, timezone `Asia/Ho_Chi_Minh`).

Cần một chiến lược quốc tế hóa (i18n) rõ ràng, chuẩn hóa và kiểm soát tự động.

---

## 3. Decision Drivers

- **Tiếng Việt là ngôn ngữ mặc định (`vi`) và ưu tiên số 1**; tiếng Anh (`en`) là ngôn ngữ hỗ trợ.
- Frontend chịu trách nhiệm hiển thị và dịch toàn bộ UI copy; Backend chỉ trả về mã lỗi ổn định (Stable Error Codes).
- Cơ chế Fallback tự động: Nếu thiếu bản dịch tiếng Anh, hệ thống phải tự động fallback về tiếng Việt (không bao giờ để trắng màn hình).
- Chuẩn hóa định dạng số, tiền tệ VND và ngày giờ Việt Nam.

---

## 4. Considered Options

- **Option A: Backend định dạng và dịch message sẵn:** Backend trả về `{ message: "Bạn đã vượt hạn mức nợ" }`. (Bị loại vì gắn chặt backend với ngôn ngữ hiển thị, không thể đổi ngôn ngữ client tức thì).
- **Option B: Frontend i18n với i18next + react-i18next + Vietnamese Default + Error Code Mapping (Chọn):**
  - Backend trả về: `{ errorCode: "CREDIT_LIMIT_EXCEEDED", details: { limit: 200000000 } }`.
  - Frontend dùng resource JSON chia theo feature trong `apps/web/src/i18n/locales/vi/` và `en/`.
  - Định dạng số/tiền/ngày qua `Intl` tiêu chuẩn.

---

## 5. Decision Outcome

**Chọn Option B: Sử dụng i18next cho Frontend, tiếng Việt làm ngôn ngữ gốc (Default Locale), Backend trả Error Code chuẩn.**

### Cấu trúc Translation Files (`apps/web/src/i18n/locales/`):
```text
apps/web/src/i18n/
├── index.ts
└── locales/
    ├── vi/                          # Nguồn sự thật bản dịch
    │   ├── common.json
    │   ├── auth.json
    │   ├── product.json
    │   ├── warehouse.json
    │   ├── inventory.json
    │   ├── order.json
    │   ├── finance.json
    │   └── role-management.json
    └── en/                          # Bản dịch tiếng Anh (Fallback -> vi)
        ├── common.json
        └── ...
```

### Định dạng chuẩn hóa:
- **Tiền tệ:** VND (vd: `1,500,000 ₫` hoặc `1.500.000 đ`).
- **Timezone:** `Asia/Ho_Chi_Minh` (UTC+7).
- **Đơn vị đo lường VLXD:** Giữ nguyên tên đơn vị tính đặc thù tiếng Việt ($m^3$, viên, bao, cây, tấn, kg, m²).

---

## 6. Consequences

### Positive Consequences
- **Trải nghiệm mượt mà:** Khách hàng Việt Nam nhận được giao diện thuần Việt tự nhiên, đúng thuật ngữ ngành VLXD.
- **Không hard-code text:** 100% nhãn, nút bấm, tiêu đề bảng, thông báo lỗi đều đi qua hàm `t('key')`.
- **Dễ dàng dịch thêm ngôn ngữ:** Muốn thêm tiếng Trung hay tiếng Hàn chỉ cần bổ sung folder locale mới mà không cần chạm vào JSX logic.

### Negative Consequences & Mitigations
- *Cần quản lý nhiều file JSON:* Chia nhỏ theo từng feature slice và viết script kiểm tra thiếu key giữa `vi` và `en`.

---

## 7. Compliance & Enforcement

- Definition of Done cho Frontend Feature bắt buộc có cả translation key trong `vi/` và `en/`.
- Linter rule hoặc test runner kiểm tra không có raw text tiếng Việt/Anh cứng trong JSX (trừ dữ liệu động từ backend).
