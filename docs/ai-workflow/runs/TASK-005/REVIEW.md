# Review report — TASK-005

## Metadata

- Reviewer: AI Bot 2 (Reviewer) / GPT Web Review
- PR reviewed: [#13](https://github.com/HomyHubs/vlxd/pull/13)
- Reviewed commits:
  - Round 1 (PR #13): `194c552a68f8005e4ca517ef1e3194f0ba2fc468`
- Reviewed at (UTC): 2026-08-22T13:52:00Z
- Review round: 1
- Verdict: changes_required (Round 1) -> pending re-review (Round 2)

## Phạm vi đã kiểm tra

- [x] Task packet và acceptance criteria (`MVP-BACKLOG.md#task-005--scaffold-monorepo-skeleton--quality-baseline`)
- [x] Cấu trúc Monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/api-client`, `packages/config-*`, `contracts/http`, `db`, `e2e`)
- [x] Tuân thủ `AGENTS.md` (Node 24.x, pnpm 11, strict TS, Zod 4, Vitest 4, vertical slice, không copy prototype)
- [x] Khớp nối với ADR-0001 đến ADR-0009
- [x] Execution log (`docs/ai-workflow/runs/TASK-005/EXECUTION.md`)
- [x] Toàn bộ diff (`git diff dev...HEAD`)
- [x] Không có secret / PII
- [x] Quality gates (`pnpm install`, `pnpm check`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`)

## Commands reviewer đã chạy

| Command                 | Kết quả/exit code | Ghi chú                                                                          |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `pnpm install`          | Exit 0            | 9 workspace projects resolved, supply-chain verified                             |
| `pnpm typecheck`        | Exit 0            | Strict TypeScript compilation pass với `tsc --noEmit` trên toàn bộ packages/apps |
| `pnpm lint`             | Exit 0            | ESLint 9 Flat Config pass với 0 errors và 0 warnings                             |
| `pnpm test`             | Exit 0            | 11 unit/integration tests pass (shared: 6, api-client: 2, api: 1, web: 2)        |
| `pnpm build`            | Exit 0            | 4 build targets pass, Vite production bundle generated                           |
| `pnpm run format:check` | Exit 0            | Prettier code style verified across all files                                    |
| `pnpm check`            | Exit 0            | Master quality gate pass 18/18 turbo tasks + Prettier format check               |
| `gh pr view 13`         | Exit 0            | PR #13 mở thành công hướng vào nhánh base `dev`                                  |

## Findings

### FINDING-001 — [ROUND 1] Lệch locked stack (Node 22, Zod 3, Vitest 3)

- Severity: BLOCKER
- File/dòng: `.nvmrc`, `package.json`, `apps/api/package.json`, `packages/shared/package.json`
- Trạng thái: resolved (cập nhật `.nvmrc` lên `24.0.0`, `package.json` engines lên `node >=24.0.0`, nâng `zod` lên `^4.4.3`, `fastify-type-provider-zod` lên `^7.0.0`, `vitest` lên `^4.1.11`, `@types/node` lên `^24.1.0`).

### FINDING-002 — [ROUND 1] Định nghĩa `pnpm check` và chuẩn hóa tài liệu

- Severity: BLOCKER
- File/dòng: `AGENTS.md:368,375`, `docs/adr/0001-monorepo-structure.md:86`
- Trạng thái: resolved (chuẩn hóa `pnpm check` tại root chạy toàn bộ Turborepo quality gate và Prettier format check; cập nhật đồng bộ `AGENTS.md` và ADR-0001).

### FINDING-003 — [ROUND 1] Tranh chấp output TypeScript khi `typecheck` và `build` chạy song song

- Severity: BLOCKER
- File/dòng: `apps/api/package.json`, `packages/shared/package.json`, `packages/api-client/package.json`, `apps/web/package.json`, `e2e/package.json`
- Trạng thái: resolved (tách `typecheck` sang dùng `tsc --noEmit` trên toàn bộ packages/apps để không ghi đè `dist/` hay `tsconfig.tsbuildinfo`, chỉ `build` mới emit build artifacts).

### FINDING-004 — [ROUND 1] Hard-coded strings trong web shell vi phạm quy tắc i18n

- Severity: BLOCKER
- File/dòng: `apps/web/src/App.tsx:36,42,60`, `apps/web/src/i18n/locales/*/common.json`
- Trạng thái: resolved (chuyển 100% chuỗi UI sang translation keys trong `common.json` cho cả `vi` và `en`; cập nhật unit test `App.test.tsx` kiểm thử đầy đủ cả 2 ngôn ngữ).

## Acceptance criteria

| Criterion                                                       | Pass/Fail/Not verified | Evidence                                                                                                             |
| --------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Cấu trúc monorepo đúng AGENTS.md và ADR-0001                    | Pass                   | `apps/web`, `apps/api`, `packages/shared`, `packages/api-client`, `packages/config-*`, `contracts/http`, `db`, `e2e` |
| `pnpm install` và baseline checks xanh                          | Pass                   | `pnpm check` pass 18/18 tasks                                                                                        |
| Không copy code prototype vào production                        | Pass                   | `apps/web` và `apps/api` đều là clean shell mới                                                                      |
| Không có placeholder business endpoint/table                    | Pass                   | Chỉ có `/health` endpoint và baseline schemas                                                                        |
| `apps/api` có `/health` endpoint + integration test             | Pass                   | Fastify 5 + `fastify-type-provider-zod` + Vitest integration test                                                    |
| `apps/web` có shell sạch sẽ + i18n vi/en + test                 | Pass                   | React 19 + MUI + i18next + Vitest / Testing Library tests                                                            |
| `packages/shared` & `packages/api-client` có types + unit tests | Pass                   | 6 tests in shared, 2 tests in api-client                                                                             |

## Kiểm tra regression

- Prototype tại `prototype/legacy-app/` được giữ nguyên trạng thái Read-Only.
- Tài liệu trong `docs/` được đồng bộ và định dạng chuẩn xác bằng Prettier.

## Kết luận

- Verdict: resolved_pending_re-review
- BLOCKER còn mở: 0
- HIGH còn mở: 0
- Follow-up không chặn merge: Cân nhắc bổ sung Playwright orchestration vào task UI sau.
- Lý do kết luận: Đã giải quyết triệt để toàn bộ 4 blocking findings của Round 1, đồng bộ toolchain Node 24/Zod 4/Vitest 4, giải quyết race condition giữa build/typecheck qua `tsc --noEmit`, chuẩn hóa `pnpm check` và hoàn thiện 100% i18n cho web shell. Sẵn sàng đưa vào Round 2 re-review.
