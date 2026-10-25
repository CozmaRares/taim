import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { env } from "@test/env";

setup.describe.configure({ mode: "serial" });

setup("prepare Clerk testing token", async () => {
    await clerkSetup({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });
});
