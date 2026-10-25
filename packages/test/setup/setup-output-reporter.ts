import type { Reporter } from "@playwright/test/reporter";

export default class SetupOutputReporter implements Reporter {
    // Playwright's v1 adapter buffers setup output until the test suite begins.
    version() {
        return "v2" as const;
    }

    printsToStdio() {
        return true;
    }

    onStdOut(chunk: string | Buffer) {
        process.stdout.write(chunk);
    }

    onStdErr(chunk: string | Buffer) {
        process.stderr.write(chunk);
    }
}
