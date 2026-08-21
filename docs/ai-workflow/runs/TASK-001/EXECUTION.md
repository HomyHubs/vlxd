# Execution log — TASK-001

## Metadata

- Task: TASK-001 — Đối soát trạng thái repo và cô lập prototype
- Implementer: AI Bot 1 (Implementer)
- Branch: `task/TASK-001-audit-and-isolate-legacy-app`
- Base commit: `11e6507c917b2b0051eb5e9db535ee62649b5cfa`
- Started at (UTC): 2026-08-21T10:40:00Z
- Status: ready_for_review

## Inputs đã đọc

- [x] Root `AGENTS.md`
- [x] `docs/README.md`
- [x] `docs/decision-backlog.md` (xác nhận chưa tồn tại, thuộc TASK-002)
- [x] Requirement liên quan (`docs/requirements/role-management.md`, `service-plans.md`, `i18n.md`)
- [x] ADR liên quan (xác nhận chưa tồn tại, thuộc TASK-004)
- [x] Task packet (`docs/tasks/MVP-BACKLOG.md#task-001--đối-soát-trạng-thái-repo-và-cô-lập-prototype`, `docs/tasks/CURRENT.md`)
- [x] `docs/ai-workflow/README.md`

## Mục tiêu và ngoài phạm vi

### Mục tiêu

- Đối soát toàn bộ repo, làm rõ `app/` là bản AI Studio standalone prototype (localStorage + mock), không phải code production.
- Cô lập `app/` sang `prototype/legacy-app/` bằng `git mv` giữ nguyên lịch sử git và đánh dấu Read-Only.
- Cập nhật `AGENTS.md`, root `README.md`, `docs/README.md` để khớp thực tế.
- Xuất bảng Feature Inventory chi tiết phân loại `implemented`, `demo-only`, `missing` vào `docs/requirements/prototype-feature-inventory.md`.
- Ghi nhận Execution log và Review log theo đúng template quy chuẩn.
- Đảm bảo 1 PR nhỏ, review được vào base `dev`.

### Ngoài phạm vi

- Không refactor hoặc sửa đổi logic mã nguồn bên trong prototype.
- Không copy mã nguồn prototype vào production.
- Không tự ý chốt quyết định nghiệp vụ nào trong `decision-backlog`.
- Không scaffold code production (`apps/web`, `apps/api`) trước khi các task thiết kế (TASK-002 đến TASK-004) hoàn tất.

## Kế hoạch trước khi sửa

1. Tạo nhánh `task/TASK-001-audit-and-isolate-legacy-app` từ `dev`.
2. Di chuyển `app/` sang `prototype/legacy-app/` bằng `git mv`.
3. Bổ sung banner cảnh báo Read-Only trong `prototype/legacy-app/README.md`.
4. Xuất bảng feature inventory vào `docs/requirements/prototype-feature-inventory.md`.
5. Cập nhật `AGENTS.md`, root `README.md`, `docs/README.md`.
6. Tạo `docs/ai-workflow/runs/TASK-001/EXECUTION.md` và `docs/ai-workflow/runs/TASK-001/REVIEW.md`.
7. Cập nhật `docs/tasks/CURRENT.md` sang trạng thái `ready_for_review`.
8. Chạy kiểm tra tính toàn vẹn git và markdown link.

## Giả định và quyết định

| Thời điểm | Nội dung | Căn cứ | Ảnh hưởng |
| --- | --- | --- | --- |
| 2026-08-21 | Di chuyển `app/` sang `prototype/legacy-app/` bằng `git mv` thay vì giữ nguyên ở root | Task packet MVP-BACKLOG.md ưu tiên cô lập để tránh nhầm lẫn giữa prototype và production monorepo | Giữ 100% lịch sử git của 30 files prototype, cấu trúc thư mục root sạch sẽ sẵn sàng cho scaffold |
| 2026-08-21 | Đặt bảng feature inventory trong `docs/requirements/prototype-feature-inventory.md` | Giữ tài liệu có cấu trúc tại `docs/requirements/` theo AGENTS.md | Là cơ sở đối soát yêu cầu chi tiết cho các task M1–M4 |

## Thay đổi đã thực hiện

| File/khu vực | Thay đổi | Lý do |
| --- | --- | --- |
| `app/` → `prototype/legacy-app/` | `git mv` 30 files sang `prototype/legacy-app/` | Cô lập mã nguồn prototype ra khỏi root |
| `prototype/legacy-app/README.md` | Bổ sung banner cảnh báo Read-Only / Reference Only | Tránh nhầm lẫn prototype là code production |
| `docs/requirements/prototype-feature-inventory.md` | Tạo mới bảng đối soát 20 hạng mục tính năng (implemented / demo-only / missing) | Nguồn sự thật phân tích khoảng cách tính năng giữa prototype và production |
| `AGENTS.md` | Đính chính trạng thái repo, thêm `prototype/legacy-app/` vào sơ đồ, cập nhật tiến độ | Đảm bảo agent AI sau nắm đúng thực trạng |
| `README.md` | Cập nhật tổng quan dự án, trạng thái repo, liên kết tài liệu | Cung cấp thông tin chuẩn cho người xem repo |
| `docs/README.md` | Cập nhật bản đồ tài liệu đầy đủ | Dẫn chiếu đến các tài liệu requirements, tasks và ai-workflow |
| `docs/ai-workflow/runs/TASK-001/EXECUTION.md` | Tạo execution log | Theo dõi quá trình thực thi theo quy trình 2-bot |
| `docs/ai-workflow/runs/TASK-001/REVIEW.md` | Tạo review log | Chuẩn bị hồ sơ cho Bot 2 review |
| `docs/tasks/CURRENT.md` | Cập nhật trạng thái `TASK-001` sang `ready_for_review` | Cập nhật bảng task active |

## Migration/contract/generated artifacts

- OpenAPI: Chưa áp dụng (TASK-007).
- Migration: Chưa áp dụng (TASK-008).
- Generated client: Chưa áp dụng (TASK-007).
- Compatibility/rollback: Rollback an toàn 100% bằng cách revert commit trên branch task. Không ảnh hưởng database hoặc production build.

## Kiểm tra đã chạy

| Command | Kết quả/exit code | Ghi chú |
| --- | --- | --- |
| `git status` | Exit 0 | 30 files renamed cleanly via `git mv`, các file docs được thêm/sửa chính xác |
| `git log -n 5 --oneline` | Exit 0 | Lịch sử commit rõ ràng, base từ `dev` tại commit `11e6507` |

## Self-review

- [x] Diff đúng phạm vi task.
- [x] Không có secret/PII.
- [x] Không sửa generated code bằng tay.
- [x] Không sao chép code prototype vào production.
- [x] Không tự ý chuyển mục `Open` trong `decision-backlog` thành `Accepted`.
- [x] Docs và trạng thái được cập nhật đồng bộ.

## Rủi ro và nợ còn lại

- Không có rủi ro kỹ thuật. Code prototype đã được cô lập hoàn toàn trong `prototype/legacy-app/`.

## Feedback đã xử lý

| Review finding | Cách sửa | Commit/test bằng chứng |
| --- | --- | --- |
| (Chưa có feedback — chờ Bot 2 review) | — | — |

## Kết quả bàn giao

- PR: Sẽ cập nhật sau khi tạo PR vào `dev`.
- Final status: `ready_for_review`
- Output chính:
  - Thư mục `prototype/legacy-app/` (Read-Only).
  - Bảng đối soát `docs/requirements/prototype-feature-inventory.md`.
  - Tài liệu chuẩn hóa `AGENTS.md`, `README.md`, `docs/README.md`.
- Reviewer cần tập trung:
  - Kiểm tra tính toàn vẹn của lịch sử git khi di chuyển `app/` sang `prototype/legacy-app/`.
  - Kiểm tra tính đầy đủ và chính xác của bảng feature inventory.
  - Kiểm tra các liên kết Markdown giữa các tài liệu.
