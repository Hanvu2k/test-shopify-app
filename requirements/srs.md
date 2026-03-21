# Software Requirements Specification — Wishlist Tester

## 1. Introduction

### Purpose
Wishlist Tester là developer tool dùng để test ứng dụng wishlist trên Shopify. Hỗ trợ 2 chế độ: Web UI và CLI, cho phép chạy test API và UI automation qua Playwright.

### Scope
- Test runner cho Shopify apps (ban đầu là wishlist app, mở rộng cho nhiều app khác)
- Hỗ trợ API testing (HTTP requests + assertions) và UI testing (Playwright browser automation)
- Variable chaining giữa các test cases
- Web UI với SSE streaming results + CLI mode

### Definitions & Acronyms
| Term | Definition |
|------|-----------|
| SSE | Server-Sent Events — streaming protocol từ backend đến frontend |
| Test Suite | Tập hợp test cases dạng JSON |
| Variable Chaining | Test trước lưu giá trị (saveAs) → test sau tham chiếu ({{varName}}) |
| Theme Preview | Shopify storefront preview page để test UI |

## 2. Overall Description

### Product Perspective
Tool chạy độc lập, kết nối đến Shopify app qua API và theme preview URL. Developer soạn test suite JSON → tool thực thi → trả kết quả pass/fail với chi tiết.

### Main Features
1. **Web UI Mode** — React + Vite editor với SSE result streaming
2. **CLI Mode** — Command-line execution với JSON summary
3. **API Test Runner** — HTTP requests, status/body assertions
4. **UI Test Runner** — Playwright browser automation (headless:false)
5. **Variable System** — Chaining values giữa test cases
6. **Test Suite Management** — Save/load/history

### Target Users
- Shopify app developers cần automated testing
- QA engineers viết test suites cho wishlist/Shopify apps

## 3. Functional Requirements

### FR1: Test Suite JSON Schema
**Priority**: MUST HAVE

**Requirements**:
- FR1.1: Test suite là JSON object chứa metadata và array of test cases
- FR1.2: Mỗi test case có fields: `name` (string), `type` ("api" | "ui"), `url` (string), `method` (string, cho api type), `body` (object, optional)
- FR1.3: API test case hỗ trợ assertions: status code match, body contains string, JSON path match value
- FR1.4: UI test case định nghĩa steps với selector + action: `click`, `fill`, `waitFor`, `assertText`
- FR1.5: UI test case hỗ trợ login/logout steps với email + password fields
- FR1.6: Mỗi test case có optional `saveAs` field để lưu giá trị cho variable chaining

**Acceptance Criteria**:
```
Given a valid test suite JSON
When submitted to the runner
Then all test cases execute in order with correct type routing (api → api-runner, ui → playwright-runner)
```

### FR2: API Test Runner
**Priority**: MUST HAVE

**Requirements**:
- FR2.1: Thực hiện HTTP request theo method/url/body từ test case
- FR2.2: Assert response status code matches expected
- FR2.3: Assert response body contains expected string
- FR2.4: Assert JSON path in response body matches expected value
- FR2.5: Extract value từ response body (JSON path) vào variable khi có saveAs
- FR2.6: Extract value từ response body vào variable cho UI element text

**Acceptance Criteria**:
```
Given an api test case with url, method, body, and assertions
When api-runner executes the test
Then HTTP request is made and all assertions are checked, returning pass/fail with details
```

### FR3: UI Test Runner (Playwright)
**Priority**: MUST HAVE

**Requirements**:
- FR3.1: Launch Chromium browser (headless:false) để chạy UI tests
- FR3.2: Navigate đến URL specified trong test case
- FR3.3: Execute steps theo sequence: click(selector), fill(selector, value), waitFor(selector), assertText(selector, expected)
- FR3.4: Hỗ trợ login flow: fill email + password fields, submit
- FR3.5: Hỗ trợ logout action
- FR3.6: Extract text từ UI element vào variable khi có saveAs
- FR3.7: Chụp screenshot khi test fail (dùng cho error reporting)

**Acceptance Criteria**:
```
Given a ui test case with steps array
When playwright-runner executes the test
Then browser opens, steps execute in order, assertions checked, screenshot on failure
```

### FR4: Variable Interpolation System
**Priority**: MUST HAVE

**Requirements**:
- FR4.1: Test case dùng `saveAs: { varName: "<jsonpath>" }` để lưu giá trị từ API response body
- FR4.2: Test case dùng `saveAs: { varName: "<selector>" }` để lưu text từ UI element
- FR4.3: Test case sau dùng `{{varName}}` syntax để tham chiếu giá trị đã lưu
- FR4.4: Variable interpolation xảy ra ở tất cả string fields: url, body, assertions, steps
- FR4.5: Error rõ ràng khi reference variable chưa được define

**Acceptance Criteria**:
```
Given test A saves responseId via saveAs
When test B uses {{responseId}} in its url
Then {{responseId}} is replaced with actual value from test A
```

### FR5: Suite Runner (Orchestrator)
**Priority**: MUST HAVE

**Requirements**:
- FR5.1: Parse test suite JSON và validate schema
- FR5.2: Execute test cases tuần tự (để đảm bảo variable chaining order)
- FR5.3: Route test case đến api-runner hoặc playwright-runner dựa trên type field
- FR5.4: Quản lý shared variable store cho variable interpolation
- FR5.5: Stream kết quả từng test case qua callback/event (cho SSE)
- FR5.6: Hỗ trợ abort/cancel giữa chừng
- FR5.7: Trả về summary: total, passed, failed, skipped, duration

**Acceptance Criteria**:
```
Given a test suite with mixed api and ui tests
When suite-runner executes
Then tests run in order, variables chain correctly, results stream per test, summary returned
```

### FR6: Web UI Mode
**Priority**: MUST HAVE

**Requirements**:
- FR6.1: Frontend React + Vite chạy trên port 5273
- FR6.2: Backend Express chạy trên port 3737
- FR6.3: Panel trái: JSON editor với syntax highlighting để soạn test suite
- FR6.4: Panel phải: Result display nhận stream từ SSE
- FR6.5: Nút Run → POST /api/run → backend stream kết quả qua SSE
- FR6.6: Nút Abort để dừng test giữa chừng
- FR6.7: Save/Load test suite từ file (lưu trong test-suites/)
- FR6.8: Lịch sử chạy test (danh sách các lần chạy gần đây với kết quả)
- FR6.9: Hiển thị text error details và screenshot khi test fail
- FR6.10: Input URL để hiển thị trang web cần test (iframe hoặc link)

**Acceptance Criteria**:
```
Given user opens Web UI
When user writes test suite JSON, enters target URL, clicks Run
Then results stream in real-time on right panel, with error details + screenshots on failure
```

### FR7: CLI Mode
**Priority**: MUST HAVE

**Requirements**:
- FR7.1: Chạy qua `npx tsx cli.ts <file.json>`
- FR7.2: In kết quả chi tiết từng test ra stdout (pass/fail + assertion details)
- FR7.3: In JSON summary ra stderr
- FR7.4: Exit code 0 nếu tất cả test pass, exit code 1 nếu có test fail
- FR7.5: Hiển thị chi tiết lỗi khi test fail (expected vs actual, error message)

**Acceptance Criteria**:
```
Given a test suite JSON file
When running npx tsx cli.ts test.json
Then stdout shows detailed results per test, stderr shows JSON summary, exit code reflects pass/fail
```

### FR8: Test Suite Management
**Priority**: SHOULD HAVE

**Requirements**:
- FR8.1: Test suites lưu dạng JSON trong thư mục test-suites/
- FR8.2: Web UI cho phép browse, load, save test suite files
- FR8.3: Tên file descriptive (e.g., wishlist-add-remove.json)

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | SSE streaming < 100ms latency per event |
| Performance | API test execution phụ thuộc target server, timeout configurable |
| Reliability | Graceful error handling — một test fail không crash suite |
| Usability | JSON editor có syntax highlighting và validation |
| Usability | Clear error messages với expected vs actual comparison |
| Compatibility | Web UI: Chrome, Firefox, Edge (modern browsers) |
| Extensibility | Architecture cho phép thêm app types khác ngoài wishlist |
| Security | Không lưu credentials trong test suite JSON (dùng env vars hoặc config riêng) |

## 5. Prioritization (MoSCoW)

### MUST HAVE (MVP)
- Test Suite JSON schema + validation
- API Test Runner (HTTP + assertions)
- UI Test Runner (Playwright + steps)
- Variable Interpolation System
- Suite Runner orchestrator
- Web UI: JSON editor + SSE result streaming + Run/Abort
- CLI Mode: file input + stdout/stderr output + exit codes

### SHOULD HAVE
- Save/Load test suites
- Test run history
- Screenshot on UI test failure
- URL input to preview target page
- Syntax highlighting JSON editor

### COULD HAVE
- Export test results (JSON/HTML report)
- Test suite templates/examples
- Dark mode UI

### WON'T HAVE (v1)
- Multi-app management UI
- Parallel test execution
- Cloud-hosted version
- CI/CD integration plugin
