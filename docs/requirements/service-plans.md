# Gói dịch vụ — vlxd

Web app cung cấp dịch vụ theo gói. Mỗi tenant/công ty chọn một gói để bắt đầu sử dụng.

## 1. Bảng năng lực

| Tính năng            | Free  | Standard | Premium        | Enterprise     |
| -------------------- | ----- | -------- | -------------- | -------------- |
| Sử dụng ứng dụng     | Có    | Có       | Có             | Có             |
| Giới hạn sản phẩm    | 80    | 800      | Không giới hạn | Không giới hạn |
| Số nhà kho           | 1     | 1        | Không giới hạn | Không giới hạn |
| AI agent chat        | Không | Không    | Có             | Có             |
| AI agent giọng nói   | Không | Không    | Có             | Có             |
| OCR hóa đơn viết tay | Không | Không    | Có             | Có             |
| DB dùng chung        | Có    | Có       | Có             | Không          |
| DB riêng biệt        | Không | Không    | Không          | Có             |

## 2. Quyết định nghiệp vụ

- Gói gắn theo tenant/công ty, không theo từng user.
- Cho phép nâng/hạ gói.
- Khi hạ gói mà dữ liệu vượt hạn mức mới: giữ dữ liệu cũ, chặn tạo mới cho đến khi về dưới hạn mức.
- Enterprise DB riêng cấu hình thủ công bởi admin.
- AI voice lưu cả audio và transcript.
- OCR hóa đơn viết tay tự lưu, cho sửa sau.

## 3. Enforcement backend

- Free đủ 80 sản phẩm: chặn tạo thêm.
- Standard đủ 800 sản phẩm: chặn tạo thêm.
- Free/Standard chỉ 1 nhà kho.
- AI chat/voice chỉ Premium/Enterprise.
- OCR chỉ Premium/Enterprise.
- Enterprise dùng DB riêng theo cấu hình admin.

## 4. Config định hướng

```ts
type Plan = "free" | "standard" | "premium" | "enterprise";

const PLAN_CONFIG = {
  free: {
    productLimit: 80,
    warehouseLimit: 1,
    hasAIAgent: false,
    hasVoice: false,
    hasInvoiceOCR: false,
    databaseMode: "shared",
  },
  standard: {
    productLimit: 800,
    warehouseLimit: 1,
    hasAIAgent: false,
    hasVoice: false,
    hasInvoiceOCR: false,
    databaseMode: "shared",
  },
  premium: {
    productLimit: null,
    warehouseLimit: null,
    hasAIAgent: true,
    hasVoice: true,
    hasInvoiceOCR: true,
    databaseMode: "shared",
  },
  enterprise: {
    productLimit: null,
    warehouseLimit: null,
    hasAIAgent: true,
    hasVoice: true,
    hasInvoiceOCR: true,
    databaseMode: "dedicated",
  },
} as const;
```
