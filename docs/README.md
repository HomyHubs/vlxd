# Tài liệu dự án vlxd

Tài liệu thiết kế kiến trúc, yêu cầu nghiệp vụ và quy trình phát triển dự án `vlxd`.

## 1. Yêu cầu sản phẩm & Nghiệp vụ (`docs/requirements/`)

- `requirements/prototype-feature-inventory.md` — Bảng đối soát chi tiết tính năng giữa prototype AI Studio và production.
- `requirements/role-management.md` — Thiết kế role, title, user và ma trận phân quyền.
- `requirements/service-plans.md` — Phân tầng gói dịch vụ Free, Standard, Premium, Enterprise.
- `requirements/i18n.md` — Quy chuẩn song ngữ Việt / Anh, mặc định tiếng Việt.

## 2. Kế hoạch & Quy trình triển khai (`docs/tasks/` & `docs/ai-workflow/`)

- `tasks/MVP-BACKLOG.md` — Lộ trình triển khai MVP chia theo 5 Milestone (M0–M4) và các Lane thực thi song song.
- `tasks/CURRENT.md` — Bảng theo dõi trạng thái task active của các lane theo thời gian thực.
- `ai-workflow/README.md` — Quy trình làm việc và review 2-bot tuần tự.
- `ai-workflow/runs/` — Lưu trữ Execution log và Review report cho từng task.

## 3. Kiến trúc & Quyết định (Sẽ bổ sung theo lộ trình M0)

- `decision-backlog.md` — Danh mục quyết định nghiệp vụ/kiến trúc cần chốt (TASK-002).
- `adr/` — Kiến trúc và quyết định khó đảo ngược (TASK-004).
- `architecture/` — Sơ đồ luồng dữ liệu, trust boundary và sơ đồ hệ thống tổng thể.

## 4. Nguyên tắc quản trị tài liệu

- Tài liệu Markdown trong `docs/` là nguồn sự thật duy nhất cho mọi quy tắc nghiệp vụ và kiến trúc.
- Không lưu trữ tài liệu rác, file HTML/CSV tạm hoặc thông tin mâu thuẫn.
- Mọi thay đổi logic hoặc thiết kế phải được cập nhật vào docs trước hoặc đồng thời với mã nguồn.
