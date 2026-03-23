// =============================================================================
// CLI Entry Point — Run a test suite JSON file from the command line
// =============================================================================
// Usage: npx tsx src/cli.ts <path-to-suite.json>
//
// stdout: per-test results (start, pass/fail/error/skipped + assertion details)
// stderr: JSON summary when suite completes, or error messages
// exit 0: all tests passed
// exit 1: one or more tests failed / errored
// =============================================================================

import fs from 'node:fs';
import type { TestSuite } from './core/types.js';
import { runSuite } from './core/suite-runner.js';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const USAGE = 'Usage: npx tsx src/cli.ts <path-to-json-file>';
const DIVIDER = '═══════════════════════════════';

// -----------------------------------------------------------------------------
// Argument Validation
// -----------------------------------------------------------------------------

function resolveJsonFilePath(): string {
  const filePath = process.argv[2];

  if (!filePath) {
    process.stderr.write(`Error: No file argument provided.\n${USAGE}\n`);
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    process.stderr.write(`Error: File not found: ${filePath}\n`);
    process.exit(1);
  }

  return filePath;
}

// -----------------------------------------------------------------------------
// Suite Parsing
// -----------------------------------------------------------------------------

function parseSuiteFile(filePath: string): TestSuite {
  let rawContent: string;

  try {
    rawContent = fs.readFileSync(filePath, 'utf-8');
  } catch (readError) {
    const message = readError instanceof Error ? readError.message : String(readError);
    process.stderr.write(`Error: Could not read file: ${message}\n`);
    process.exit(1);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawContent);
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    process.stderr.write(`Error: Invalid JSON in file: ${message}\n`);
    process.exit(1);
  }

  if (parsed === null || typeof parsed !== 'object') {
    process.stderr.write('Error: Test suite must be a non-null object.\n');
    process.exit(1);
  }

  return parsed as TestSuite;
}

// -----------------------------------------------------------------------------
// Output Formatters
// -----------------------------------------------------------------------------

function printTestStart(name: string, index: number, total: number): void {
  process.stdout.write(`\u25b6 Running: ${name} (${index + 1}/${total})\n`);
}

function printTestPass(name: string, duration: number): void {
  process.stdout.write(`  \u2713 PASS: ${name} (${duration}ms)\n`);
}

function printTestFail(
  name: string,
  duration: number,
  assertions?: Array<{ expected: unknown; actual: unknown; passed: boolean }>,
  errorMessage?: string,
): void {
  process.stdout.write(`  \u2717 FAIL: ${name} (${duration}ms)\n`);

  if (assertions) {
    for (const assertion of assertions) {
      if (!assertion.passed) {
        process.stdout.write(
          `    Expected: ${String(assertion.expected)}, Actual: ${String(assertion.actual)}\n`,
        );
      }
    }
  }

  if (errorMessage) {
    process.stdout.write(`    ${errorMessage}\n`);
  }
}

function printTestError(name: string, errorMessage: string): void {
  process.stdout.write(`  ! ERROR: ${name} - ${errorMessage}\n`);
}

function printTestSkipped(name: string): void {
  process.stdout.write(`  - SKIPPED: ${name}\n`);
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  const filePath = resolveJsonFilePath();
  const suite = parseSuiteFile(filePath);

  const controller = new AbortController();

  process.on('SIGINT', () => {
    process.stderr.write('Aborted by user\n');
    controller.abort();
  });

  let exitCode = 0;

  const summary = await runSuite(
    suite,
    (event) => {
      switch (event.type) {
        case 'test:start':
          printTestStart(event.name, event.index, event.total);
          break;

        case 'test:result': {
          const { result } = event;
          switch (result.status) {
            case 'pass':
              printTestPass(result.name, result.duration);
              break;
            case 'fail':
              printTestFail(result.name, result.duration, result.assertions, result.error);
              exitCode = 1;
              break;
            case 'error':
              printTestError(result.name, result.error ?? 'Unknown error');
              exitCode = 1;
              break;
            case 'skipped':
              printTestSkipped(result.name);
              break;
          }
          break;
        }

        case 'suite:complete': {
          const { summary: s } = event;
          process.stdout.write(`${DIVIDER}\n`);
          process.stdout.write(
            `Results: ${s.passed}/${s.total} passed, ${s.failed} failed, ${s.skipped} skipped\n`,
          );
          process.stdout.write(`Duration: ${s.duration}ms\n`);
          process.stderr.write(`${JSON.stringify(s)}\n`);
          break;
        }

        case 'suite:error':
          process.stderr.write(`Suite error: ${event.error}\n`);
          exitCode = 1;
          break;
      }
    },
    { abortSignal: controller.signal },
  );

  // Ensure exit code reflects failures captured in summary (e.g. suite:error path)
  if (summary.failed > 0) {
    exitCode = 1;
  }

  process.exit(exitCode);
}

main().catch((unexpectedError) => {
  const message = unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
