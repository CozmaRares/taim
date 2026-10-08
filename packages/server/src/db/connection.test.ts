import { beforeEach, describe, expect, it, vi } from "vitest";

const driver = vi.hoisted(() => ({ run: vi.fn(), close: vi.fn() }));
const open = vi.hoisted(() => vi.fn());
vi.mock("bun:sqlite", () => ({ Database: open }));
vi.mock("drizzle-orm/bun-sqlite", () => ({ drizzle: vi.fn(() => ({})) }));
vi.mock("@/env", () => ({
    env: { DB_FILE_NAME: ":memory:", NODE_ENV: "test" },
}));

import { dbQuery, withDatabaseConnection } from "./connection";

beforeEach(() => {
    vi.resetAllMocks();
    open.mockImplementation(function () {
        return driver;
    });
});

describe("database connection failure boundaries", () => {
    it("returns an open failure without attempting to close an unopened database", async () => {
        const cause = new Error("cannot open");
        open.mockImplementationOnce(function () {
            throw cause;
        });
        const result = await withDatabaseConnection(() => 1);
        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "open",
            cause,
        });
        expect(driver.close).not.toHaveBeenCalled();
    });

    it("closes the client after setup fails and preserves a concurrent close failure", async () => {
        const cause = new Error("setup failed");
        const cleanupCause = new Error("close failed");
        driver.run.mockImplementationOnce(() => {
            throw cause;
        });
        driver.close.mockImplementationOnce(() => {
            throw cleanupCause;
        });
        const result = await withDatabaseConnection(() => 1);
        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "setup",
            cause,
            cleanupCause,
        });
        expect(driver.close).toHaveBeenCalledOnce();
    });

    it("closes the client when setup fails even if cleanup succeeds", async () => {
        const cause = new Error("setup failed");
        driver.run.mockImplementationOnce(() => {
            throw cause;
        });
        const result = await withDatabaseConnection(() => 1);
        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "setup",
            cause,
        });
        expect(driver.close).toHaveBeenCalledOnce();
    });

    it.each(["throw", "reject"])(
        "captures callback %s and still closes the database",
        async failure => {
            const cause = new Error("callback failed");
            const result = await withDatabaseConnection(() => {
                if (failure === "throw") {
                    throw cause;
                }
                return Promise.reject(cause);
            });
            expect(result.isErr() && result.error).toEqual({
                type: "database_error",
                operation: "callback",
                cause,
            });
            expect(driver.close).toHaveBeenCalledOnce();
        },
    );

    it("preserves both the callback failure and the cleanup failure", async () => {
        const cause = new Error("callback failed");
        const cleanupCause = new Error("close failed");
        driver.close.mockImplementationOnce(() => {
            throw cleanupCause;
        });
        const result = await withDatabaseConnection(() => {
            throw cause;
        });
        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "callback",
            cause,
            cleanupCause,
        });
    });

    it("does not return success when closing fails", async () => {
        const cause = new Error("close failed");
        driver.close.mockImplementationOnce(() => {
            throw cause;
        });
        const result = await withDatabaseConnection(() => 1);
        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "close",
            cause,
        });
    });

    it("returns a typed error for queries outside a connection scope", async () => {
        const query = vi.fn();
        const result = await dbQuery("outside scope", () => query());
        expect(result.isErr() && result.error).toEqual({
            type: "missing_database_connection",
        });
        expect(query).not.toHaveBeenCalled();
    });

    it.each(["throw", "reject"])(
        "captures query %s inside the active connection",
        async failure => {
            const cause = new Error("query failed");
            const connection = await withDatabaseConnection(async () => {
                const query = () => {
                    if (failure === "throw") {
                        throw cause;
                    }
                    return Promise.reject(cause);
                };
                return dbQuery("failing query", () => query());
            });
            expect(connection.isOk()).toBe(true);
            if (connection.isErr()) {
                throw new Error(
                    "Connection wrapper failed before returning the query result",
                );
            }
            const queryResult = connection.value;
            expect(queryResult.isErr() && queryResult.error).toEqual({
                type: "database_error",
                operation: "query",
                cause,
            });
            expect(driver.close).toHaveBeenCalledOnce();
        },
    );

    it("reuses the outer connection and closes it only once", async () => {
        const result = await withDatabaseConnection(() =>
            withDatabaseConnection(() => 42),
        );
        expect(result.isOk()).toBe(true);
        if (result.isErr()) {
            throw new Error(
                "Outer connection wrapper failed before returning the nested result",
            );
        }
        const nested = result.value;
        expect(nested.isOk() && nested.value).toBe(42);
        expect(open).toHaveBeenCalledOnce();
        expect(driver.close).toHaveBeenCalledOnce();
    });
});
