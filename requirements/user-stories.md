# User Stories — Wishlist Tester

## Epic 1: Test Suite Authoring

### US-001: Write Test Suite JSON
**As a** developer
**I want to** write test suite JSON in a code editor with syntax highlighting
**So that** I can define test cases with correct structure and catch syntax errors early

**Acceptance Criteria**:
```gherkin
Scenario: Write valid test suite
  Given the Web UI is open
  When I type JSON in the left panel editor
  Then syntax highlighting shows keywords, strings, numbers in different colors
  And JSON validation errors are shown inline
```
**Story Points**: 3
**Priority**: MUST

### US-002: Save and Load Test Suites
**As a** developer
**I want to** save test suites to files and load them back
**So that** I can reuse test suites across sessions

**Acceptance Criteria**:
```gherkin
Scenario: Save test suite
  Given I have a test suite in the editor
  When I click Save and enter a filename
  Then the JSON is saved to test-suites/{filename}.json

Scenario: Load test suite
  Given test-suites/ has saved files
  When I click Load and select a file
  Then the JSON is loaded into the editor
```
**Story Points**: 2
**Priority**: SHOULD

---

## Epic 2: Test Execution

### US-003: Run API Tests
**As a** developer
**I want to** run API test cases that make HTTP requests and check assertions
**So that** I can verify my Shopify app API endpoints work correctly

**Acceptance Criteria**:
```gherkin
Scenario: API test passes
  Given a test case with type "api", url, method, body, and assertions
  When the test runs
  Then HTTP request is made with correct method/url/body
  And status code assertion is checked
  And body contains assertion is checked
  And JSON path match assertion is checked
  And result shows PASS with details

Scenario: API test fails
  Given an api test with wrong expected status
  When the test runs
  Then result shows FAIL with expected vs actual values
```
**Story Points**: 5
**Priority**: MUST

### US-004: Run UI Tests with Playwright
**As a** developer
**I want to** run UI test cases that automate browser interactions
**So that** I can verify the wishlist UI works correctly on theme preview

**Acceptance Criteria**:
```gherkin
Scenario: UI test with click and assert
  Given a test case with type "ui" and steps [navigate, click, assertText]
  When the test runs
  Then Chromium opens, navigates to URL, clicks element, asserts text
  And result shows PASS/FAIL

Scenario: UI test with login
  Given a test case with login step (email + password)
  When the test runs
  Then browser fills login form and submits
  And subsequent steps run in authenticated context

Scenario: UI test failure screenshot
  Given a UI test that fails
  When assertion fails
  Then screenshot is captured and included in results
```
**Story Points**: 8
**Priority**: MUST

### US-005: Chain Variables Between Tests
**As a** developer
**I want to** save values from one test and use them in subsequent tests
**So that** I can create dependent test flows (e.g., create item → get item by ID)

**Acceptance Criteria**:
```gherkin
Scenario: Variable chaining API → API
  Given test A has saveAs: { "itemId": "$.data.id" }
  And test B uses url "/api/items/{{itemId}}"
  When both tests run in order
  Then test B's URL contains the actual ID from test A's response

Scenario: Undefined variable error
  Given test B references {{unknownVar}}
  When variable interpolation runs
  Then clear error message indicates unknownVar is not defined
```
**Story Points**: 5
**Priority**: MUST

### US-006: Run Test Suite (Orchestrator)
**As a** developer
**I want to** run a complete test suite with mixed API and UI tests
**So that** I can validate end-to-end flows

**Acceptance Criteria**:
```gherkin
Scenario: Mixed suite execution
  Given a suite with 3 api tests and 2 ui tests
  When I click Run
  Then tests execute sequentially
  And results stream in real-time via SSE
  And summary shows total/passed/failed/duration

Scenario: Abort mid-run
  Given a suite is running
  When I click Abort
  Then current test finishes, remaining tests skip
  And summary shows partial results
```
**Story Points**: 5
**Priority**: MUST

---

## Epic 3: Web UI

### US-007: Real-Time Result Streaming
**As a** developer
**I want to** see test results appear one-by-one as they complete
**So that** I don't have to wait for the entire suite to finish

**Acceptance Criteria**:
```gherkin
Scenario: SSE streaming
  Given I click Run on a 5-test suite
  When each test completes
  Then result appears immediately in the right panel
  And I can see progress (3/5 completed...)
```
**Story Points**: 3
**Priority**: MUST

### US-008: Error Display with Screenshots
**As a** developer
**I want to** see detailed error info and screenshots when tests fail
**So that** I can quickly diagnose what went wrong

**Acceptance Criteria**:
```gherkin
Scenario: API test failure details
  Given an API test fails
  When I view the result
  Then I see expected vs actual values, error message

Scenario: UI test failure with screenshot
  Given a UI test fails
  When I view the result
  Then I see error text AND screenshot of the browser state
```
**Story Points**: 3
**Priority**: SHOULD

### US-009: Test Run History
**As a** developer
**I want to** see a history of past test runs
**So that** I can compare results over time

**Acceptance Criteria**:
```gherkin
Scenario: View history
  Given I have run tests multiple times
  When I open the history panel
  Then I see list of past runs with date, suite name, pass/fail count
  And I can click to view details of any past run
```
**Story Points**: 3
**Priority**: SHOULD

### US-010: Preview Target URL
**As a** developer
**I want to** input and view the target web page URL
**So that** I can see the page I'm testing alongside the test editor

**Acceptance Criteria**:
```gherkin
Scenario: Enter target URL
  Given I input a Shopify theme preview URL
  When the page loads
  Then I can see the target page rendered (iframe or new tab link)
```
**Story Points**: 2
**Priority**: SHOULD

---

## Epic 4: CLI Mode

### US-011: Run Tests from CLI
**As a** developer
**I want to** run test suites from command line
**So that** I can integrate with scripts and automation

**Acceptance Criteria**:
```gherkin
Scenario: CLI execution
  Given a test suite file test.json
  When I run npx tsx cli.ts test.json
  Then stdout shows per-test results with details
  And stderr shows JSON summary { total, passed, failed, duration }
  And exit code is 0 if all pass, 1 if any fail

Scenario: CLI error details
  Given a test that fails
  When viewed in CLI output
  Then detailed error shown: expected vs actual, assertion that failed
```
**Story Points**: 3
**Priority**: MUST

---

## Story Map Summary

| Priority | Stories | Total Points |
|----------|---------|-------------|
| MUST | US-001, US-003, US-004, US-005, US-006, US-007, US-011 | 32 |
| SHOULD | US-002, US-008, US-009, US-010 | 10 |
| COULD | (future: export, templates, dark mode) | — |
| **Total** | **11 stories** | **42 points** |
