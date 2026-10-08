import { AsyncLocalStorage } from "node:async_hooks";
import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import {
    err,
    errAsync,
    fromAsyncThrowable,
    fromThrowable,
    type Result,
    type ResultAsync,
} from "neverthrow";
import * as schema from "./schema";
import { env } from "@/env";
import { createLogger } from "@/lib/logger";
import chalk from "chalk";

const logger = createLogger("db");
const connectionSetupQueries = Object.freeze(["PRAGMA foreign_keys = ON"]);

type DatabaseOperation = "open" | "setup" | "callback" | "query" | "close";
type DatabaseOperationError = {
    type: "database_error";
    operation: DatabaseOperation;
    cause: unknown;
    cleanupCause?: unknown;
};
export type DatabaseError =
    | DatabaseOperationError
    | { type: "missing_database_connection" };

type DatabaseState = {
    db: BunSQLiteDatabase<typeof schema>;
    queryPurpose: AsyncLocalStorage<string>;
    close: () => Result<void, DatabaseOperationError>;
};

const databaseError = (
    operation: DatabaseOperation,
    cause: unknown,
): DatabaseOperationError => ({
    type: "database_error",
    operation,
    cause,
});

function createDatabaseState(): Result<DatabaseState, DatabaseOperationError> {
    let close: DatabaseState["close"] | undefined;

    return fromThrowable(
        () => {
            const client = new Database(env.DB_FILE_NAME);
            close = fromThrowable(
                () => client.close(),
                cause => databaseError("close", cause),
            );
            const queryPurpose = new AsyncLocalStorage<string>();
            client.run(connectionSetupQueries.join(";\n"));
            const db = drizzle(client, {
                schema,
                casing: "snake_case",
                logger: {
                    logQuery(query: string, params: unknown[]) {
                        logger.info(
                            chalk.grey(
                                `[${queryPurpose.getStore() ?? "untracked"}]`,
                            ),
                            chalk.magenta(query),
                            "--",
                            params,
                        );
                    },
                },
            });
            return { db, queryPurpose, close };
        },
        cause => {
            const error = databaseError(close ? "setup" : "open", cause);
            const cleanup = close?.();
            return cleanup?.isErr()
                ? { ...error, cleanupCause: cleanup.error.cause }
                : error;
        },
    )();
}

const databaseConnection = new AsyncLocalStorage<DatabaseState>();

export async function withDatabaseConnection<T>(
    callback: () => T | PromiseLike<T>,
    { isolated = false }: { isolated?: boolean } = {},
): Promise<Result<T, DatabaseError>> {
    if (!isolated && databaseConnection.getStore()) {
        return fromAsyncThrowable(
            async () => callback(),
            cause => databaseError("callback", cause),
        )();
    }

    const created = createDatabaseState();
    if (created.isErr()) {
        return err(created.error);
    }

    const state = created.value;
    const outcome = await fromAsyncThrowable(
        async () => databaseConnection.run(state, callback),
        cause => databaseError("callback", cause),
    )();
    const cleanup = state.close();
    if (cleanup.isErr()) {
        return err(
            outcome.isErr()
                ? { ...outcome.error, cleanupCause: cleanup.error.cause }
                : cleanup.error,
        );
    }
    return outcome;
}

export function dbQuery<T>(
    purpose: string,
    callback: (database: DatabaseState["db"]) => T | PromiseLike<T>,
): ResultAsync<T, DatabaseError> {
    const state = databaseConnection.getStore();
    if (!state) {
        return errAsync({ type: "missing_database_connection" });
    }
    return fromAsyncThrowable(
        async () => state.queryPurpose.run(purpose, () => callback(state.db)),
        cause => databaseError("query", cause),
    )();
}
