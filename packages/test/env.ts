import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        CLERK_SECRET_KEY: z.string().startsWith("sk_test_").min(9),
        CLERK_PUBLISHABLE_KEY: z.string().regex(/^pk_test_[A-Za-z0-9+/]+=*$/),
        CLERK_TEST_USER_EMAIL: z.email(),
        TEST_PORT: z.coerce.number().int().min(1).max(65535).default(3100),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
