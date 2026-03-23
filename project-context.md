# Project Context - Wishlist Tester

## Client Q&A History

### Session 1 (2026-03-21)

**Q1**: Test Suite JSON Schema — fields và assertion types?
**A1**: Test case fields: name, type, url, method, body. Assertions: status code, body contains, JSON path match.

**Q2**: UI Tests (Playwright) — step syntax và login?
**A2**: Dùng selector + action: click, fill, waitFor, assertText. Có trường hợp cần login/logout với email + password.

**Q3**: Web UI — additional features?
**A3**: Cần: Save/load test suite, lịch sử chạy test, syntax highlighting, nút abort, input URL hiển thị trang web cần test.

**Q4**: Variable System — saveAs extract sources?
**A4**: Extract từ response body (JSON path) và UI element text.

**Q5**: Target Shopify App?
**A5**: Chạy dev app Shopify. Có thể nâng cấp chạy nhiều app khác. Chủ yếu test ngoài theme preview — thay đổi settings JSON qua API app cung cấp. Dev wishlist app cung cấp list cần test.

**Q6**: Error Handling & Reporting?
**A6**: Web UI: hiển thị text error + ảnh lỗi. CLI: chi tiết lỗi.

## Design Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| React + Vite frontend | Client specified, modern DX | 2026-03-21 |
| Express backend | Client specified, simple SSE support | 2026-03-21 |
| Playwright headless:false | Client needs visual browser for UI tests | 2026-03-21 |
| TypeScript throughout | Client specified (tsx, .ts files) | 2026-03-21 |
| Port 5273 (frontend), 3737 (backend) | Client specified | 2026-03-21 |
| Sequential test execution | Required for variable chaining order | 2026-03-21 |

## Client Preferences
- Language: Vietnamese
- Tool type: Developer tool (not end-user facing)
- Target: Shopify app testing (wishlist, expandable to others)
- Testing focus: Theme preview + API settings changes

## Constraints
- Playwright must run headless:false (visible browser)
- Tests execute sequentially (variable chaining dependency)
- No self-testing — this IS the test tool

## v2 Feature: Visual Flow Builder (Session 2 — 2026-03-23)

**Q1**: Thay thế hay thêm mode? → **Thay thế** JSON editor hoàn toàn
**Q2**: Nối block kiểu gì? → **Canvas kéo thả** (Node-RED/n8n style), linear only
**Q3**: Selector helper? → Gõ tay CSS selector (click-to-detect làm sau)
**Q4**: Preview layout? → **60% preview / 40% canvas**
**Q5**: Preview highlight? → **Có**, highlight element đang tương tác
**Q6**: Save format? → **JSON test suite format** (tương thích CLI), import JSON cũ → blocks
**Q7**: Theme password? → Optional, nhập 1 lần ở settings (không phải lúc nào cũng cần)
**Q8**: Block types? → Giữ nguyên: click, fill, waitFor, assertText, navigate, login, logout
**Q9**: Branching/loop? → Không, chỉ linear
**Q10**: Kết quả bên phải? → Giống panel Results hiện tại

## Sprint 0 Decisions
- Wireframes = Yes
- Tech Stack = APPROVED (React+Vite, Express, TailwindCSS, CodeMirror 6, Playwright, TypeScript)
- Team = APPROVED (meta-react-architect, netflix-backend-architect, google-code-reviewer, google-qa-engineer, netflix-devops-engineer, apple-ux-wireframer)
