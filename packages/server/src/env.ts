import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
    server: {
        CLERK_SECRET_KEY: z.string().startsWith("sk_"),
        CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
        PORT: z.coerce.number().int().min(1).max(65535).default(3000),
        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),
        DB_FILE_NAME: z
            .string()
            .min(1)
            .refine(
                value => !value.startsWith("file:"),
                "DB_FILE_NAME must be a filesystem path without the file: prefix.",
            ),
    },
    runtimeEnv: process.env,
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    createFinalSchema: shape =>
        z.object(shape).transform(env => ({
            ...env,
            DRIZZLE_KIT_DB_FILE: `file:${env.DB_FILE_NAME}`,
        })),
});
