import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
    clientPrefix: "VITE_",
    client: {
        VITE_CLERK_PUBLISHABLE_KEY: z
            .string()
            .regex(
                /^pk_(test|live)_[A-Za-z0-9+/]+=*$/,
                "Set a valid Clerk publishable key in packages/web/.env.local",
            ),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
});
