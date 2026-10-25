import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { it as base } from "@serenity-js/playwright-test";
import { env } from "@test/env";

export * from "@serenity-js/playwright-test";
export { it as unauthenticatedIt } from "@serenity-js/playwright-test";

export const it = base.extend({
    actor: async ({ actor, page, baseURL }, use) => {
        if (!baseURL) {
            throw new Error("Configure Playwright baseURL before using actor.");
        }

        await setupClerkTestingToken({ page });
        await page.goto(new URL("/", baseURL).href);
        await clerk.signIn({ page, emailAddress: env.CLERK_TEST_USER_EMAIL });

        try {
            await use(actor);
        } finally {
            await clerk.signOut({ page });
        }
    },
});
