import { expect, it, vi } from "vitest";

const { createLogger } =
    await vi.importActual<typeof import("@server/lib/logger")>(
        "@server/lib/logger",
    );

it("writes messages and errors through the real logger", () => {
    const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
        const logger = createLogger("test");

        expect(() => {
            logger.info("Connected", { id: 1n });
            logger.error("Request failed", new Error("test error"));
        }).not.toThrow();

        expect(stdout).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining('Connected {"id":"1n"}'),
        );
        expect(stderr).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining("test error"),
        );
    } finally {
        stdout.mockRestore();
        stderr.mockRestore();
    }
});
