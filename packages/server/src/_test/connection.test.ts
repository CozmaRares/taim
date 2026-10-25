import { describe, expect, it, vi } from "vitest";
import { databaseMocks } from "@server/_test/setup";
import { withDatabaseConnection } from "@server/db/connection";

describe("withDatabaseConnection", () => {
    it("returns the callback value and closes the connection", async () => {
        const result = await withDatabaseConnection(() => "done");

        expect(result.isOk() && result.value).toBe("done");
        expect(databaseMocks.driver.close).toHaveBeenCalledOnce();
    });

    it.each([false, true])(
        "propagates the original callback failure and closes the connection (async: %s)",
        async asynchronous => {
            const error = new Error("Route failed");
            const callback = () => {
                if (asynchronous) {
                    return Promise.reject(error);
                }
                throw error;
            };

            await expect(withDatabaseConnection(callback)).rejects.toBe(error);
            expect(databaseMocks.driver.close).toHaveBeenCalledOnce();
        },
    );

    it("returns an open error without running the callback", async () => {
        const cause = new Error("Cannot open database");
        databaseMocks.open.mockImplementation(function () {
            throw cause;
        });
        const callback = vi.fn();

        const result = await withDatabaseConnection(callback);

        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "open",
            cause,
        });
        expect(callback).not.toHaveBeenCalled();
        expect(databaseMocks.driver.close).not.toHaveBeenCalled();
    });

    it("returns a setup error and closes the connection without running the callback", async () => {
        const cause = new Error("Cannot configure database");
        databaseMocks.run.mockImplementation(() => {
            throw cause;
        });
        const callback = vi.fn();

        const result = await withDatabaseConnection(callback);

        expect(result.isErr() && result.error).toEqual({
            type: "database_error",
            operation: "setup",
            cause,
        });
        expect(callback).not.toHaveBeenCalled();
        expect(databaseMocks.driver.close).toHaveBeenCalledOnce();
    });
});
