import type { Reporter } from "@playwright/test/reporter";

export default class SetupOutputReporter implements Reporter {
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
