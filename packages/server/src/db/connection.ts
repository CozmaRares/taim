import { AsyncLocalStorage } from "node:async_hooks";
import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import {
    err,
    errAsync,
    fromAsyncThrowable,
    fromThrowable,
    ok,
    type Result,
    type ResultAsync,
} from "neverthrow";
import * as schema from "./schema";
import { env } from "@server/env";
import { createLogger } from "@server/lib/logger";
import chalk from "chalk";

const logger = createLogger("db");
const connectionSetupQueries = Object.freeze(["PRAGMA foreign_keys = ON"]);

type DatabaseOperation = "open" | "setup" | "query";
type DatabaseOperationError = {
    type: "database_error";
    operation: DatabaseOperation;
    cause: unknown;
};
export type DatabaseError =
    | DatabaseOperationError
    | { type: "missing_database_connection" };

type DatabaseState = {
    db: BunSQLiteDatabase<typeof schema>;
    queryPurpose: AsyncLocalStorage<string>;
    close: () => void;
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
    const opened = fromThrowable(
        () => new Database(env.DB_FILE_NAME),
        cause => databaseError("open", cause),
    )();
    if (opened.isErr()) {
        return err(opened.error);
    }

    const client = opened.value;
    const close = () => {
        const result = fromThrowable(() => client.close())();
        if (result.isErr()) {
            logger.error("Failed to close database connection", result.error);
        }
    };

    const setup = fromThrowable(
        () => {
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
        cause => databaseError("setup", cause),
    )();
    if (setup.isErr()) {
        close();
        return err(setup.error);
    }

    return setup;
}

const databaseConnection = new AsyncLocalStorage<DatabaseState>();

export async function withDatabaseConnection<T>(
    callback: () => T | PromiseLike<T>,
): Promise<Result<T, DatabaseError>> {
    const created = createDatabaseState();
    if (created.isErr()) {
        return err(created.error);
    }

    const state = created.value;
    try {
        return ok(await databaseConnection.run(state, callback));
    } finally {
        state.close();
    }
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
