import { fileURLToPath } from "node:url";

// Delegate before Bun discovers specs that belong to Vitest and Playwright.
const runner = Bun.spawn([process.execPath, "run", "test"], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
});

process.exit(await runner.exited);
