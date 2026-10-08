import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import type {
    SerenityFixtures,
    SerenityWorkerFixtures,
} from "@serenity-js/playwright-test";

const localConfigPath = fileURLToPath(
    new URL("./playwright.local.config.ts", import.meta.url),
);
const localConfig =
    process.argv.includes("--headed") && existsSync(localConfigPath)
        ? createRequire(import.meta.url)(localConfigPath).default
        : {};
const port = process.env.TEST_PORT ?? "3100";

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>(
    {
        testDir: "./spec",
        fullyParallel: true,
        workers: 2,
        outputDir: "./test-results",
        reporter: [
            ["./support/setup-output-reporter.ts"],
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
                "bun --env-file=.env packages/test/support/docker-server.ts",
            cwd: fileURLToPath(new URL("../../", import.meta.url)),
            url: `http://localhost:${port}`,
            timeout: 300_000,
            gracefulShutdown: { signal: "SIGTERM", timeout: 30_000 },
            reuseExistingServer: false,
            stdout: "pipe",
            stderr: "pipe",
            env: {
                TEST_PORT: port,
            },
        },
        projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    },
    localConfig,
);
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
