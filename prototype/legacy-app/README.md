> [!WARNING]
> **LEGACY PROTOTYPE — READ-ONLY / REFERENCE ONLY**
> 
> Đây là bản prototype giao diện được xuất từ Google AI Studio (Vite + React + Tailwind + LocalStorage mock).
> **KHÔNG PHẢI CODE PRODUCTION.** Thư mục này được giữ nguyên trạng nhằm mục đích đối soát nghiệp vụ, tham khảo luồng giao diện người dùng và thuật toán chuyển đổi đơn vị.
> 
> Kiến trúc production chính thức sẽ được phát triển theo mô hình monorepo tại `apps/web` (React 19 + MUI) và `apps/api` (Fastify + Kysely + Supabase Postgres) theo quy chuẩn tại `/AGENTS.md`.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AI Studio Prototype (Legacy Reference)

This directory contains the legacy standalone frontend prototype for reference purposes only.

View original app in AI Studio: https://ai.studio/apps/2ef5e09e-d3e0-479c-a088-09645725db9b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
