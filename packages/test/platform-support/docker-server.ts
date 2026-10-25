import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@test/env";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const dataDirectory = await mkdtemp(join(tmpdir(), "taim-test-"));
const project = `taim-test-${randomUUID()}`;
const composeArgs = [
    "compose",
    "--project-name",
    project,
    "--file",
    "compose.yaml",
    "--file",
    "packages/test/compose.yaml",
];
let child: ChildProcess | undefined;
let stopping = false;
let stop: () => void;
const stopped = new Promise<void>(resolve => {
    stop = resolve;
});

function shutdown() {
    stopping = true;
    child?.kill("SIGTERM");
    stop();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function compose(args: string[]) {
    await new Promise<void>((resolve, reject) => {
        child = spawn("docker", [...composeArgs, ...args], {
            cwd: root,
            env: {
                ...process.env,
                CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
                CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY,
                TEST_PORT: String(env.TEST_PORT),
                TAIM_DATA_DIR: dataDirectory,
            },
            stdio: "inherit",
        });
        child.once("error", reject);
        child.once("exit", (code, signal) => {
            child = undefined;
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(`Docker Compose exited with ${code ?? signal}`),
                );
            }
        });
    });
}

try {
    await compose([
        "up",
        "--detach",
        "--build",
        "--wait",
        "--wait-timeout",
        "60",
    ]);
    await stopped;
} catch (error) {
    if (!stopping) {
        console.error(error);
        process.exitCode = 1;
    }
} finally {
    // Also runs after a failed build/start or Playwright's shutdown signal.
    process.off("SIGINT", shutdown);
    process.off("SIGTERM", shutdown);
    try {
        await compose([
            "down",
            "--volumes",
            "--rmi",
            "local",
            "--remove-orphans",
            "--timeout",
            "5",
        ]);
    } finally {
        await rm(dataDirectory, { recursive: true, force: true });
    }
}
