# Vòng lặp tự động: Codex CLI tự gọi ChatGPT Web để review

> Đây là **biến thể tự động hóa** của `docs/ai-workflow/README.md`. Mục tiêu: khi **Bot 1 (Codex CLI)** hoàn tất một task, nó **tự mở ChatGPT Web (Bot 2)**, dán yêu cầu review, **đợi kết quả**, rồi **tự sửa theo review** và lặp lại **cho đến khi không còn lỗi (`accepted`)** hoặc chạm trần vòng lặp. Toàn bộ trạng thái sống trong **PR GitHub** và các **file md** của repo, không phụ thuộc chat context.
>
> Tài liệu này **không thay thế** `README.md`, `AGENTS.md`, template EXECUTION/REVIEW hay PR template — nó chỉ mô tả cách **tự động chạy** đúng quy trình đã có.

---

## 0. Vai trò và model

| Bot | Công cụ | Model mặc định | Ghi chú |
| --- | --- | --- | --- |
| **Bot 1 — Implementer (Agent A)** | **Codex CLI** hoặc Codex Desktop | `GPT-5.6 Luna High` | Được phép đổi model. Là bên **chủ động** điều phối cả vòng lặp. |
| **Bot 2 — Reviewer (Agent B)** | **ChatGPT Web** (chatgpt.com) | `GPT-5.6 Sol High` | Được phép đổi model. Codex điều khiển qua Chrome DevTools MCP. |
| **Human owner** | GitHub | — | Duyệt quyết định sản phẩm/kiến trúc còn mở và **merge** PR. |

Bot 2 **không tự đánh dấu `accepted` cho phần việc của Bot 1** theo cách thủ công — verdict do ChatGPT Web trả ra và Codex chỉ **ghi lại** trung thực. Việc merge cuối cùng vẫn theo mục 9.

---

## 1. Cơ chế tự gọi ChatGPT Web

Codex CLI điều khiển trình duyệt qua **Chrome DevTools MCP** (đã khai báo trong `.agents/mcp_config.json`). Cơ chế:

1. Người dùng chạy Chrome **đã đăng nhập chatgpt.com** với cổng debug mở (`--remote-debugging-port=9222`) và một `user-data-dir` cố định để giữ session.
2. Chrome DevTools MCP **kết nối vào Chrome đang chạy** (`--browserUrl http://127.0.0.1:9222`) thay vì mở phiên ẩn danh mới — nhờ vậy giữ nguyên đăng nhập ChatGPT.
3. Codex dùng các tool của MCP để: mở tab chatgpt.com → dán prompt review vào ô soạn → gửi → **đợi phản hồi stream xong** → đọc text phản hồi → parse verdict.
4. Codex ghi verdict vào PR (comment) và vào `docs/ai-workflow/runs/TASK-NNN/REVIEW.md`.
5. Nếu verdict là `changes_requested`/`blocked` (còn lỗi): Codex sửa trên cùng branch/PR → push → lặp lại từ bước 3.
6. Dừng khi verdict `accepted` hoặc chạm `MAX_REVIEW_ROUNDS`.

> Chrome DevTools MCP chỉ **thao tác UI web**; nó **không** phải API OpenAI. Vì vậy phải dùng một phiên Chrome có đăng nhập tài khoản ChatGPT hợp lệ có quyền dùng model Bot 2.

---

## 2. Điều kiện tiên quyết

- **Codex CLI** đã cài, đăng nhập, chọn model `GPT-5.6 Luna High` (đổi được bằng `/model` hoặc `--model`).
- **GitHub CLI `gh`** đã `gh auth login`, có quyền push branch và tạo PR trên `HomyHubs/vlxd` (private).
- **Chrome** cài sẵn, có profile đã **đăng nhập chatgpt.com**, chọn sẵn model `GPT-5.6 Sol High`.
- **Node + npx** để chạy `chrome-devtools-mcp` (đã khai trong `.agents/mcp_config.json`).
- Repo checkout ở nhánh làm việc; base mặc định là `dev`.

### 2.1 Mở Chrome ở chế độ cho MCP điều khiển

macOS (ví dụ):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-codex-review"
```

Linux:

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-codex-review"
```

Lần đầu: mở tab chatgpt.com trong cửa sổ này và **đăng nhập** (giữ session trong `user-data-dir` đó). Các lần sau chỉ cần mở lại bằng đúng lệnh trên.

---

## 3. Cấu hình MCP cho Codex CLI

Repo đã có `.agents/mcp_config.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Để Codex CLI **kết nối vào Chrome đang chạy** (giữ đăng nhập), thêm `--browserUrl` và khai báo server trong `~/.codex/config.toml`:

```toml
[mcp_servers.chrome-devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
```

> Tên tool cụ thể của `chrome-devtools-mcp` có thể thay đổi theo phiên bản. Trước khi chạy, cho Codex **liệt kê tool của MCP** rồi ánh xạ vào các bước ở mục 5 (điều hướng trang, chụp snapshot DOM, điền text, click, chờ điều kiện, đọc nội dung/`evaluate_script`).

---

## 4. Tham số vòng lặp (mặc định)

| Tham số | Giá trị mặc định | Ý nghĩa |
| --- | --- | --- |
| `AGENT_A_MODEL` | `GPT-5.6 Luna High` | Model Codex CLI (đổi được) |
| `AGENT_B_MODEL` | `GPT-5.6 Sol High` | Model ChatGPT Web (đổi được) |
| `BASE_BRANCH` | `dev` | Nhánh base của PR |
| `MAX_REVIEW_ROUNDS` | `8` | Trần số vòng review-fix để tránh lặp vô hạn |
| `REVIEW_WAIT_TIMEOUT_S` | `180` | Thời gian tối đa chờ ChatGPT Web trả lời một lượt |
| `CHATGPT_URL` | `https://chatgpt.com/` | Trang review |
| `VERDICT_VALUES` | `accepted` \| `changes_requested` \| `blocked` | Khớp `REVIEW-TEMPLATE.md` và `CURRENT.md` |

---

## 5. Vòng lặp chi tiết (Codex CLI thực thi)

### Bước A — Hoàn tất task và mở PR

1. Bám `AGENTS.md`, `docs/ai-workflow/README.md`, task trong `docs/tasks/CURRENT.md` + `MVP-BACKLOG.md`.
2. Làm code trên branch `task/TASK-NNN-short-name`, chạy quality gates (`pnpm -r check` khi có code).
3. Tạo/cập nhật `docs/ai-workflow/runs/TASK-NNN/EXECUTION.md` từ template.
4. Mở PR vào `dev` bằng `gh pr create` theo `.github/pull_request_template.md`; đặt `CURRENT.md` = `ready_for_review`.

### Bước B — Tự gọi ChatGPT Web review

1. Chuẩn bị **review packet**: `PR_URL`, `HEAD_SHA`, `git diff` (base...head), đường dẫn EXECUTION.md, acceptance criteria của task.
2. Qua Chrome DevTools MCP: mở `CHATGPT_URL`, xác nhận đúng model `GPT-5.6 Sol High`, tạo cuộc trò chuyện mới.
3. Dán **prompt reviewer** từ `docs/ai-workflow/prompts/reviewer-web.md` (đã chèn review packet) vào ô soạn, gửi.
4. **Đợi** phản hồi stream xong (chờ nút gửi trở lại trạng thái sẵn sàng / không còn chỉ báo đang trả lời), tối đa `REVIEW_WAIT_TIMEOUT_S`.
5. Đọc text phản hồi cuối cùng, **trích khối JSON verdict** ở cuối (xem mục 6).

### Bước C — Ghi lại review

1. Cập nhật `docs/ai-workflow/runs/TASK-NNN/REVIEW.md` theo `REVIEW-TEMPLATE.md` (verdict, findings có severity/evidence/fix).
2. Đăng comment tóm tắt verdict lên PR bằng `gh pr comment`.
3. Commit REVIEW.md vào cùng PR.

### Bước D — Sửa theo review hoặc kết thúc

- Nếu `verdict = accepted` và không còn `BLOCKER`/`HIGH`: đặt `CURRENT.md` = `accepted`, dừng vòng lặp, báo owner merge (mục 9).
- Nếu `verdict = changes_requested`: Codex sửa từng finding trên **cùng branch/PR**, cập nhật EXECUTION.md (bảng "Feedback đã xử lý"), push, đặt `ready_for_re_review`, quay lại **Bước B**.
- Nếu `verdict = blocked`: ghi lý do, đặt `CURRENT.md` = `blocked`, dừng và báo human owner.
- Nếu đạt `MAX_REVIEW_ROUNDS` mà chưa `accepted`: dừng, đặt `blocked`, tổng hợp các finding còn mở cho owner.

### Sơ đồ

```text
Codex xong task -> PR(dev) -> [mở ChatGPT Web, dán prompt, đợi verdict]
     -> ghi REVIEW.md + comment PR
     -> accepted? --yes--> báo owner merge -> task kế tiếp
                    --no--> Codex sửa -> push -> (lặp, tối đa MAX_REVIEW_ROUNDS)
```

---

## 6. Định dạng verdict để Codex parse

ChatGPT Web phải kết thúc phản hồi bằng **một khối ```json duy nhất**:

```json
{
  "verdict": "accepted | changes_requested | blocked",
  "open_blockers": 0,
  "open_high": 0,
  "summary": "một câu tóm tắt",
  "findings": [
    {
      "id": "FINDING-001",
      "severity": "BLOCKER | HIGH | MEDIUM | LOW",
      "evidence": "file:line hoặc mô tả",
      "impact": "...",
      "required_fix": "..."
    }
  ]
}
```

Quy tắc parse của Codex:

- "Không còn lỗi" = `verdict == accepted` **và** `open_blockers == 0` **và** `open_high == 0`.
- Nếu parse thất bại hoặc thiếu khối JSON: coi là `changes_requested`, yêu cầu ChatGPT Web trả lại đúng định dạng, không tự merge.

---

## 7. Guardrails

- **Không tự merge tự động.** Codex chỉ đưa PR tới trạng thái `accepted`; merge do human owner (hoặc bật riêng nếu owner cho phép bằng văn bản).
- **Không dán secret/PII** vào ChatGPT Web hay vào log; chỉ gửi diff/code cần thiết. Repo private nhưng ChatGPT Web là dịch vụ ngoài — cân nhắc dữ liệu nhạy cảm.
- **Không push trực tiếp** vào `dev`/`main`; luôn qua PR.
- **Trần vòng lặp** `MAX_REVIEW_ROUNDS` để tránh lặp vô hạn.
- Mỗi lượt review phải gắn với **đúng `HEAD_SHA`** đang xét; nếu đã push commit mới thì phải review lại từ đầu lượt.
- Nếu Chrome mất session/đăng xuất: dừng, báo người dùng đăng nhập lại, không thử vòng khác.

---

## 8. Lệnh giao Bot 1 (bản tự động)

> Thực hiện task đang active trong `docs/tasks/CURRENT.md`. Tuân thủ `AGENTS.md`, `docs/ai-workflow/README.md` và tài liệu này. Sau khi hoàn tất và mở PR vào `dev`: dùng Chrome DevTools MCP mở ChatGPT Web (model `GPT-5.6 Sol High`), dán prompt trong `docs/ai-workflow/prompts/reviewer-web.md` kèm review packet, đợi verdict, ghi `REVIEW.md` + comment PR. Nếu chưa `accepted`, tự sửa trên cùng PR và lặp tối đa `MAX_REVIEW_ROUNDS`. Dừng khi `accepted` (báo owner merge) hoặc `blocked`. Tuyệt đối không tự merge, không dán secret.

---

## 9. Merge và chuyển task

- Khi `accepted`: human owner review nhanh và merge PR vào `dev` (squash).
- Sau merge: cập nhật `docs/tasks/CURRENT.md` sang task kế tiếp ở trạng thái `ready`, cập nhật mục "Trạng thái tiến độ" trong `AGENTS.md`.
- Chỉ bắt đầu task kế tiếp khi task hiện tại đã merge.
