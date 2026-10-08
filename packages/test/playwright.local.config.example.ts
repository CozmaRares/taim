import type { PlaywrightTestConfig } from "@serenity-js/playwright-test";

export default {
    globalSetup: "./support/awesome-wm.ts",
    use: {
        headless: false,
        launchOptions: {
            args: ["--class=taim-integration-tests", "--ozone-platform=x11"],
        },
    },
} satisfies PlaywrightTestConfig;
