# Vòng lặp review tự động trong Codex CLI (không dùng trình duyệt)

> **Cập nhật quan trọng:** Codex CLI **không điều khiển được Chrome/trình duyệt** (không có plugin browser trong CLI). Vì vậy phương án "tự lái ChatGPT Web bằng Chrome DevTools MCP" **không áp dụng** cho luồng chỉ-CLI. Tài liệu này thay thế bằng các cách chạy **thuần Codex CLI**.
>
> Mọi vai trò, trạng thái, template và quy ước PR vẫn theo `docs/ai-workflow/README.md`. Tài liệu này chỉ mô tả cách **tự động chạy vòng review** trong CLI.

---

## 0. Vai trò và model

| Bot | Công cụ | Model mặc định | Ghi chú |
| --- | --- | --- | --- |
| **Bot 1 — Implementer + Orchestrator (Agent A)** | **Codex CLI** | `GPT-5.6 Luna High` | Đổi được. Chủ động điều phối cả vòng lặp: code → PR → gọi review → sửa → lặp → **tự merge + xóa branch**. |
| **Bot 2 — Reviewer (Agent B)** | Xem 3 cách ở mục 1 | `GPT-5.6 Sol High` | Đổi được. **Không** dùng trình duyệt trong luồng CLI. |
| **Human owner** | GitHub | — | Mặc định A tự merge khi được duyệt; owner có thể tắt auto-merge (`AUTO_MERGE_ON_APPROVE=false`) để tự merge tay. |

---

## 1. Ba cách chạy Bot B trong Codex CLI

### Cách 1 — (KHUYẾN NGHỊ) Reviewer là một phiên Codex thứ hai: `codex exec`

Tự động hoàn toàn, **không trình duyệt**, **không cần API key riêng**, dùng chính đăng nhập ChatGPT của Codex. Agent A gọi một tiến trình Codex khác ở chế độ **read-only** với model Sol High để review diff và trả verdict.

```bash
#!/usr/bin/env bash
# review-with-codex.sh — chạy bởi Agent A sau khi đã mở PR
set -euo pipefail
TASK="$1"                         # ví dụ TASK-005
BASE="${BASE_BRANCH:-dev}"
RUN_DIR="docs/ai-workflow/runs/${TASK}"
mkdir -p "$RUN_DIR"

PR_URL="$(gh pr view --json url -q .url)"
HEAD_SHA="$(git rev-parse HEAD)"
git fetch origin "$BASE" --quiet
git diff "origin/${BASE}...HEAD" > /tmp/pr.diff

PROMPT="$(cat docs/ai-workflow/prompts/reviewer-web.md)

## PR
${PR_URL}  (HEAD ${HEAD_SHA})

## DIFF (base...head)
\`\`\`diff
$(cat /tmp/pr.diff)
\`\`\`"

# Reviewer: phiên Codex độc lập, chỉ đọc, không sửa file
codex exec --model "gpt-5.6-sol-high" --sandbox read-only "$PROMPT" \
  > "${RUN_DIR}/REVIEW-RESPONSE.md"

echo "Verdict đã lưu tại ${RUN_DIR}/REVIEW-RESPONSE.md"
```

> Tên cờ có thể khác theo phiên bản — kiểm tra `codex exec --help` (một số bản dùng `--full-auto`/`--ask-for-approval`/`--skip-git-repo-check`). Điều bắt buộc: reviewer **chỉ đọc**, không được sửa/commit; và **dùng model khác** (Sol High) để có góc nhìn độc lập với implementer (Luna High).

**Ưu:** hoàn toàn tự động trong CLI, không trình duyệt, không phí API. **Nhược:** reviewer và coder cùng chạy trên Codex (độc lập ở mức model, không phải hai sản phẩm khác nhau).

### Cách 2 — Relay thủ công qua file + PR (giữ đúng "ChatGPT Web")

Codex tự động **mọi thứ trừ** bước bê nội dung sang chatgpt.com. Phù hợp khi muốn dùng đúng ChatGPT Web bằng subscription.

1. Agent A sinh `docs/ai-workflow/runs/TASK-NNN/REVIEW-REQUEST.md` gồm: prompt reviewer + PR_URL + HEAD_SHA + diff.
2. Copy vào clipboard cho tiện:
   - macOS: `pbcopy < docs/ai-workflow/runs/TASK-NNN/REVIEW-REQUEST.md`
   - Linux: `xclip -selection clipboard < .../REVIEW-REQUEST.md`
   - Windows: `clip.exe < .../REVIEW-REQUEST.md`
3. Codex **tạm dừng** và in hướng dẫn: mở chatgpt.com (model Sol High), dán nội dung, copy **khối JSON verdict** trả về.
4. Bạn dán verdict JSON vào `docs/ai-workflow/runs/TASK-NNN/REVIEW-RESPONSE.md` (hoặc dán thẳng vào prompt Codex).
5. Codex đọc `REVIEW-RESPONSE.md`, parse verdict, tiếp tục vòng lặp tự động.

**Ưu:** dùng đúng ChatGPT Web + subscription, không phí API. **Nhược:** bán tự động (một thao tác copy-paste mỗi vòng).

### Cách 3 — API GPT-5.6 Sol High

Tự động hoàn toàn bằng script gọi API (cần `OPENAI_API_KEY`).

```bash
jq -Rs --arg model "gpt-5.6-sol-high" '{model:$model, input:.}' \
  < /tmp/review-input.txt \
| curl -s https://api.openai.com/v1/responses \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" -d @- \
> docs/ai-workflow/runs/${TASK}/REVIEW-RESPONSE.json
```

**Ưu:** hoàn toàn tự động, reviewer thật sự tách biệt. **Nhược:** tính phí API, không dùng subscription web.

---

## 2. So sánh nhanh

| Tiêu chí | Cách 1 `codex exec` | Cách 2 Relay Web | Cách 3 API |
| --- | --- | --- | --- |
| Cần trình duyệt | Không | Có (thủ công) | Không |
| Mức tự động | Hoàn toàn | Bán tự động | Hoàn toàn |
| Chi phí | Subscription Codex | Subscription web | Phí API |
| Độc lập reviewer | Khác model | Khác sản phẩm | Khác sản phẩm |
| Khuyến nghị | ✅ Mặc định | Khi cần đúng ChatGPT Web | Khi cần CI headless |

---

## 3. Cấu hình Codex CLI

Luồng này **không cần** Chrome DevTools MCP. Có thể bỏ `chrome-devtools` khỏi cấu hình MCP nếu chỉ dùng CLI.

- Chọn model implementer: `codex --model "gpt-5.6-luna-high"` hoặc `/model` trong phiên.
- `gh auth login` để tạo PR/push/**merge + xóa branch** (cần quyền `delete_repo`/ghi trên repo private).
- Cách 1: không cần cấu hình thêm ngoài quyền chạy `codex exec`.
- Cách 3: đặt `OPENAI_API_KEY` trong môi trường (không commit).

---

## 4. Tham số vòng lặp (mặc định)

| Tham số | Giá trị | Ý nghĩa |
| --- | --- | --- |
| `AGENT_A_MODEL` | `GPT-5.6 Luna High` | Model Codex CLI (đổi được) |
| `AGENT_B_MODEL` | `GPT-5.6 Sol High` | Model reviewer (đổi được) |
| `REVIEW_MODE` | `codex-exec` | `codex-exec` \| `web-relay` \| `api` |
| `BASE_BRANCH` | `dev` | Nhánh base của PR |
| `MAX_REVIEW_ROUNDS` | `8` | Trần vòng review-fix |
| `VERDICT_VALUES` | `accepted` \| `changes_requested` \| `blocked` | Khớp `REVIEW-TEMPLATE.md` |
| `AUTO_MERGE_ON_APPROVE` | `true` | Khi được duyệt, A tự merge (đặt `false` để owner merge tay) |
| `DELETE_BRANCH_AFTER_MERGE` | `true` | Xóa branch (remote + local) sau khi merge xong |
| `MERGE_METHOD` | `squash` | `squash` \| `merge` \| `rebase` |

---

## 5. Vòng lặp chi tiết (mặc định Cách 1)

1. **Làm task + mở PR:** Codex bám `AGENTS.md`, `docs/ai-workflow/README.md`, `docs/tasks/CURRENT.md`; code trên `task/TASK-NNN-...`; chạy `pnpm -r check`; tạo `EXECUTION.md`; `gh pr create` vào `dev`; đặt `ready_for_review`.
2. **Gọi reviewer:** chạy `review-with-codex.sh TASK-NNN` → ghi `REVIEW-RESPONSE.md`.
3. **Ghi review:** parse verdict, cập nhật `REVIEW.md` theo template, `gh pr comment` tóm tắt, commit vào cùng PR.
4. **Quyết định:**
   - `accepted` và không còn BLOCKER/HIGH (tương đương "Merge decision: This PR is production-ready and can be merged into dev.") → nếu `AUTO_MERGE_ON_APPROVE=true` và CI xanh → **A tự merge vào `dev` và xóa branch** (xem mục 5.1); ngược lại đặt `CURRENT.md` = `accepted` và báo owner merge.
   - `changes_requested` → Codex tự sửa từng finding trên cùng PR, cập nhật `EXECUTION.md`, push, đặt `ready_for_re_review`, quay lại bước 2 (review lại đúng HEAD_SHA mới).
   - `blocked` → ghi lý do, đặt `blocked`, báo owner.
   - Chạm `MAX_REVIEW_ROUNDS` mà chưa `accepted` → dừng, đặt `blocked`, tổng hợp finding còn mở.

```text
Codex xong task -> PR(dev) -> [codex exec reviewer (Sol High), read-only] -> verdict
   -> ghi REVIEW.md + comment PR
   -> accepted + CI xanh? --yes--> A merge (squash) vào dev + xóa branch -> task kế tiếp
                            --no--> Codex sửa -> push -> (lặp, tối đa MAX_REVIEW_ROUNDS)
```

### 5.1. Merge tự động + xóa branch

Chỉ khi verdict = `accepted`, `open_blockers == 0`, `open_high == 0`, CI xanh và không conflict:

```bash
gh pr checks "$PR_NUMBER"                          # CI phải xanh
gh pr merge "$PR_NUMBER" --squash --delete-branch  # merge vào dev + xóa branch remote
git checkout dev && git pull origin dev
git branch -d "task/TASK-NNN-..." 2>/dev/null || true   # xóa branch local nếu còn
```

- `--delete-branch` xóa branch trên GitHub ngay sau khi merge hoàn tất.
- Sau merge: cập nhật `dev`, đặt `CURRENT.md` = `accepted`/Done, ghi PR_URL, chuyển task kế tiếp.
- Nếu `AUTO_MERGE_ON_APPROVE=false`: bỏ bước này, chỉ báo owner để merge tay.

---

## 6. Định dạng verdict để Codex parse

Reviewer phải kết thúc bằng **một** khối ```json:

```json
{
  "verdict": "accepted | changes_requested | blocked",
  "merge_decision": "This PR is production-ready and can be merged into dev. | This PR is not ready to merge.",
  "open_blockers": 0,
  "open_high": 0,
  "summary": "một câu",
  "findings": [
    { "id": "FINDING-001", "severity": "BLOCKER | HIGH | MEDIUM | LOW", "evidence": "file:line", "impact": "...", "required_fix": "..." }
  ]
}
```

- **Cho phép merge** = `verdict == accepted` **và** `open_blockers == 0` **và** `open_high == 0` **và** `merge_decision == "This PR is production-ready and can be merged into dev."`.
- Khi đủ điều kiện trên + CI xanh → A tự merge + xóa branch (mục 5.1).
- Parse lỗi/thiếu JSON → coi là `changes_requested`, yêu cầu reviewer trả lại đúng định dạng; **không** merge.

---

## 7. Guardrails

- **Tự merge có điều kiện.** A chỉ merge khi `accepted` + hết BLOCKER/HIGH + `merge_decision` cho phép + CI xanh; sau merge **xóa branch**. Đặt `AUTO_MERGE_ON_APPROVE=false` nếu muốn human owner merge tay.
- **Không lộ secret/PII** trong prompt reviewer, log hay REVIEW-RESPONSE.
- **Không push trực tiếp** vào `dev`/`main`; luôn qua PR.
- Reviewer (`codex exec`) chạy **read-only**, không sửa code.
- Mỗi lượt review gắn đúng `HEAD_SHA`; có commit mới thì review lại từ đầu lượt (không merge revision cũ).
- Trần `MAX_REVIEW_ROUNDS` để tránh lặp vô hạn; chạm trần **không** phải approve.

---

## 8. Lệnh giao Bot 1 (bản CLI)

> Thực hiện task đang active trong `docs/tasks/CURRENT.md`, tuân thủ `AGENTS.md` và `docs/ai-workflow/README.md`. Sau khi mở PR vào `dev`, chạy reviewer bằng `codex exec --model "gpt-5.6-sol-high" --sandbox read-only` với prompt trong `docs/ai-workflow/prompts/reviewer-web.md` + diff, ghi `REVIEW.md` + comment PR. Nếu chưa `accepted`, tự sửa trên cùng PR và lặp tối đa `MAX_REVIEW_ROUNDS`. Khi verdict `accepted` (Merge decision: "This PR is production-ready and can be merged into dev.") + CI xanh → **tự merge squash vào `dev` rồi xóa branch** (`gh pr merge --squash --delete-branch`); nếu `blocked` thì dừng và báo owner. Không dùng trình duyệt, không dán secret.
