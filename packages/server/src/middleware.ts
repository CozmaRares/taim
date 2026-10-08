import { clerkMiddleware, getAuth } from "@clerk/hono";
import { fromAsyncThrowable, fromThrowable } from "neverthrow";
import { env } from "@/env";
import { createMiddleware } from "hono/factory";
import chalk from "chalk";
import type { MiddlewareHandler } from "hono";
import { withDatabaseConnection } from "@/db/dal";
import { createLogger } from "@/lib/logger";

const logger = createLogger("server");

const authenticationError = (cause: unknown) => ({
    type: "authentication_error" as const,
    cause,
});

export const requireAuth = createMiddleware(async (c, next) => {
    const authentication = await fromAsyncThrowable(
        async () =>
             clerkMiddleware({
                secretKey: env.CLERK_SECRET_KEY,
                publishableKey: env.CLERK_PUBLISHABLE_KEY,
            })(c, async () => {}),
        authenticationError,
    )();
    if (authentication.isErr()) {
        logger.error(authentication.error);
        c.res = c.json({ error: "Authentication unavailable" }, 503);
        return c.res;
    }
    if (authentication.value instanceof Response) {
        return authentication.value;
    }
    const auth = fromThrowable(() => getAuth(c), authenticationError)();
    if (auth.isErr()) {
        logger.error(auth.error);
        c.res = c.json({ error: "Authentication unavailable" }, 503);
        return c.res;
    }
    if (!auth.value.userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
});

// conventions-ignore server-neverthrow id:1 -- This top-level request boundary forwards database failures to app.onError.
export const openDatabaseConnection: MiddlewareHandler = async (_c, next) => {
    const result = await withDatabaseConnection(next);
    if (result.isErr()) {
        throw new Error("Database connection failed", { cause: result.error });
    }
};

export const requestLogger: MiddlewareHandler = async (c, next) => {
    const method = c.req.method;
    const path = chalk.italic(c.req.path);
    logger.info("->", colorMethod(method), path);
    const start = performance.now();
    try {
        await next();
    } finally {
        const status = c.res.status;
        const colorStatus =
            status >= 500
                ? chalk.red
                : status >= 400
                  ? chalk.yellow
                  : chalk.green;
        const duration = performance.now() - start;
        const colorDuration =
            duration > 1000
                ? chalk.red
                : duration > 500
                  ? chalk.yellow
                  : chalk.green;
        logger.info(
            "<-",
            colorMethod(method),
            path,
            colorStatus(status),
            `(${colorDuration(duration.toFixed(0))}ms)`,
        );
    }
};

function colorMethod(method: string) {
    switch (method) {
        case "GET":
            return chalk.green(method);
        case "POST":
            return chalk.yellow(method);
        case "PUT":
            return chalk.blue(method);
        case "DELETE":
            return chalk.red(method);
        default:
            return method;
    }
}
