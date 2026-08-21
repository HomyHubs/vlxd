# Quy trình AI Coding Bot tuần tự

Tài liệu này là quy trình bắt buộc để hai AI bot triển khai và review repo `HomyHubs/vlxd` trên GitHub. Mục tiêu là để trạng thái sống trong file và lịch sử Git, không phụ thuộc chat context.

## 1. Mô hình được chọn

Mỗi task đi qua một vòng lặp có kiểm soát:

```text
Task packet -> Bot 1 implement -> execution log -> PR -> Bot 2 review
    -> review report -> Bot 1 sửa -> Bot 2 re-review -> merge -> task kế tiếp
```

- **Bot 1 — Implementer:** chỉ làm một task, ghi lại kế hoạch, thay đổi, lệnh kiểm tra và rủi ro.
- **Bot 2 — Reviewer:** không mặc định sửa code; kiểm tra requirement, kiến trúc, security, test và bằng chứng. Reviewer ghi feedback có mức độ và cách tái hiện.
- **Human owner:** duyệt quyết định sản phẩm/kiến trúc còn mở và merge PR.

Không giao hai task cùng lúc cho một bot. Không bắt đầu task kế tiếp khi task hiện tại chưa đạt `accepted`.

## 2. Nguồn sự thật và thứ tự đọc

Trước mọi thay đổi, cả hai bot phải đọc theo thứ tự:

1. `/AGENTS.md`.
2. `/docs/README.md`.
3. `/docs/decision-backlog.md` nếu đã tồn tại.
4. Requirement và ADR được task dẫn chiếu.
5. `docs/tasks/CURRENT.md`.
6. Task tương ứng trong `docs/tasks/MVP-BACKLOG.md`.
7. `AGENTS.md` gần nhất của thư mục sẽ sửa, nếu có.

Nếu tài liệu và code mâu thuẫn, dừng việc triển khai hành vi mới, ghi mâu thuẫn vào execution log và sửa nguồn sự thật trong đúng task.

## 3. Quy ước GitHub

- Một task = một branch = một PR.
- Branch implement: `task/TASK-NNN-short-name`.
- Branch sửa feedback vẫn dùng cùng branch/PR.
- Commit rõ mục đích; không trộn refactor ngoài phạm vi.
- Không push trực tiếp vào `dev` hoặc `main`.
- Base branch mặc định: `dev`, trừ khi task/owner chỉ định khác.
- PR phải link task, execution log và review report.

## 4. Hồ sơ bắt buộc của mỗi lần chạy

Bot 1 phải tạo/cập nhật:

```text
docs/ai-workflow/runs/TASK-NNN/
├── EXECUTION.md
└── REVIEW.md
```

- Khởi tạo `EXECUTION.md` từ `EXECUTION-LOG-TEMPLATE.md` trước khi code.
- Khởi tạo `REVIEW.md` từ `REVIEW-TEMPLATE.md`; Bot 2 sở hữu phần review.
- Hai file này nằm trong cùng PR với code để reviewer thấy chính xác bằng chứng của phiên bản đang review.
- Không ghi secret, token, credential, dữ liệu khách hàng thật hoặc log chứa PII.

## 5. Trạng thái task

`docs/tasks/CURRENT.md` chỉ có một task active và dùng các trạng thái:

- `ready`: đủ điều kiện để Bot 1 bắt đầu.
- `in_progress`: Bot 1 đang thực hiện.
- `ready_for_review`: implementation và self-check hoàn tất.
- `changes_requested`: Bot 2 yêu cầu sửa.
- `ready_for_re_review`: Bot 1 đã xử lý feedback.
- `accepted`: Bot 2 chấp nhận; có thể merge.
- `blocked`: thiếu quyết định, quyền, dependency hoặc môi trường.

Bot không tự đánh dấu `accepted` cho phần việc của chính mình.

## 6. Quy trình Bot 1

1. Xác nhận task trong `CURRENT.md` là `ready` hoặc `changes_requested`.
2. Kiểm tra prerequisite và phạm vi file.
3. Tạo branch từ base mới nhất.
4. Tạo `EXECUTION.md`; ghi commit gốc, kế hoạch và giả định.
5. Thực hiện theo contract-first và TDD khi task có hành vi sản phẩm.
6. Cập nhật log ngay khi có quyết định, deviation, thất bại hoặc thay đổi phạm vi.
7. Chạy quality gates được task yêu cầu; ghi command, exit code và kết quả tóm tắt.
8. Tự review diff; liệt kê rủi ro còn lại.
9. Chuyển trạng thái `ready_for_review`, mở/cập nhật PR.

Bot 1 không được:

- Tuyên bố test pass nếu chưa chạy.
- Invent endpoint, bảng, permission hoặc business rule chưa được chấp nhận.
- Sửa generated code bằng tay.
- Hard-code UI copy.
- Cho frontend truy cập Supabase trực tiếp.
- Bỏ permission, plan enforcement, tenant isolation hoặc audit ở backend.

## 7. Quy trình Bot 2

1. Đọc task packet, requirement, ADR, execution log và toàn bộ diff.
2. Kiểm tra implementation có đúng phạm vi và dependency direction.
3. Chạy lại command quan trọng hoặc ghi rõ command nào không thể chạy và vì sao.
4. Ghi finding vào `REVIEW.md` theo mức độ:
   - `BLOCKER`: sai contract, mất dữ liệu, auth/tenant bypass, secret hoặc không build.
   - `HIGH`: sai nghiệp vụ chính, thiếu migration/test quan trọng, concurrency issue.
   - `MEDIUM`: edge case, maintainability, accessibility hoặc observability đáng kể.
   - `LOW`: cải thiện nhỏ, naming, tài liệu.
5. Mỗi finding phải có: bằng chứng file/dòng, tác động, cách tái hiện và yêu cầu sửa.
6. Nếu còn `BLOCKER`/`HIGH`, đặt `changes_requested`.
7. Khi Bot 1 sửa, kiểm tra từng finding và regression trước khi đặt `accepted`.

## 8. Definition of Done chung

Một task chỉ được accepted khi:

- Output bắt buộc trong task đã tồn tại.
- Contract được cập nhật trước implementation nếu API thay đổi.
- Migration reversible và có test nếu DB thay đổi.
- Permission/plan/tenant enforcement ở backend khi liên quan.
- UI có i18n `vi`, `en`/fallback và trạng thái loading/empty/error/success khi liên quan.
- Không secret, không PII trong log/fixture.
- Quality gates xanh hoặc exception được owner chấp nhận bằng văn bản.
- `EXECUTION.md` và `REVIEW.md` đầy đủ.
- Tài liệu và trạng thái tiến độ được cập nhật.

## 9. Câu lệnh giao bot

### Giao Bot 1

> Thực hiện duy nhất task đang active trong `docs/tasks/CURRENT.md`. Đọc và tuân thủ `AGENTS.md`, `docs/ai-workflow/README.md` và task packet tương ứng. Tạo/cập nhật execution log theo template, làm code trên branch riêng, chạy đầy đủ quality gates, mở PR vào `dev`, sau đó đặt trạng thái `ready_for_review`. Không bắt đầu task kế tiếp.

### Giao Bot 2

> Review duy nhất PR của task đang ở `ready_for_review` hoặc `ready_for_re_review`. Đọc task packet, requirements, ADR, execution log và diff. Chạy lại kiểm tra quan trọng, ghi finding có severity/evidence/reproduction/fix vào `REVIEW.md`. Không tự mở rộng scope. Chỉ đặt `accepted` khi không còn BLOCKER/HIGH và acceptance criteria đã đạt.
