import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { env } from "./env";
import type {
    SerenityFixtures,
    SerenityWorkerFixtures,
} from "./serenity/playwright-test";

const port = env.TEST_PORT;

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
    testDir: "./spec",
    fullyParallel: true,
    workers: 2,
    outputDir: "./test-results",
    reporter: [
        ["./setup/setup-output-reporter.ts"],
        [
            "@serenity-js/playwright-test",
            {
                crew: [
                    "@serenity-js/console-reporter",
                    [
                        "@serenity-js/html-reporter",
                        {
                            specDirectory: "./spec",
                            outputDirectory: "./reports/serenity-js",
                        },
                    ],
                ],
            },
        ],
    ],
    use: {
        headless: true,
        defaultActorName: "Norman",
        baseURL: `http://localhost:${port}`,
        trace: "retain-on-failure",
    },
    webServer: {
        command:
            "bun --env-file=packages/test/.env packages/test/platform-support/docker-server.ts",
        cwd: fileURLToPath(new URL("../../", import.meta.url)),
        url: `http://localhost:${port}`,
        timeout: 300_000,
        gracefulShutdown: { signal: "SIGTERM", timeout: 30_000 },
        reuseExistingServer: false,
        stdout: "pipe",
        stderr: "pipe",
        env: {
            TEST_PORT: String(port),
        },
    },
    projects: [
        {
            name: "clerk-setup",
            testDir: "./setup",
            testMatch: /clerk\.setup\.ts/,
        },
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
            dependencies: ["clerk-setup"],
        },
    ],
});
