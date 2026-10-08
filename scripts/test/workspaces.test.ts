import { fileURLToPath } from "node:url";
import { expect, test } from "bun:test";

// Vitest and Serenity/JS specs must run through their own workspace runners.
test("workspace test suites", async () => {
    const runner = Bun.spawn([process.execPath, "run", "test"], {
        cwd: fileURLToPath(new URL("../../", import.meta.url)),
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });
    expect(await runner.exited).toBe(0);
}, 600_000);
