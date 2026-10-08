import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));
import { createLogger } from "./logger";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("safe logging", () => {
    it("serializes BigInt and replaces circular or throwing values without failing", () => {
        const output = vi.spyOn(console, "log").mockImplementation(() => {});
        const circular: { self?: unknown } = {};
        circular.self = circular;
        const broken = {
            toJSON() {
                throw new Error("cannot serialize");
            },
        };
        const result = createLogger("test").info(42n, circular, broken);
        expect(result.isOk()).toBe(true);
        expect(output).toHaveBeenCalledWith(expect.stringContaining("42n"));
        expect(output).toHaveBeenCalledWith(
            expect.stringContaining("[Unserializable value]"),
        );
    });

    it("returns a typed sink failure and attempts the fallback", () => {
        const cause = new Error("stdout failed");
        vi.spyOn(console, "log").mockImplementation(() => {
            throw cause;
        });
        const fallback = vi
            .spyOn(process.stderr, "write")
            .mockReturnValue(true);
        const result = createLogger("test").info("message");
        expect(result.isErr() && result.error).toEqual({
            type: "log_write_error",
            cause,
        });
        expect(fallback).toHaveBeenCalledOnce();
    });

    it("retains both sink errors without throwing from an error handler", () => {
        const cause = new Error("console failed");
        const fallbackCause = new Error("stderr failed");
        vi.spyOn(console, "error").mockImplementation(() => {
            throw cause;
        });
        vi.spyOn(process.stderr, "write").mockImplementation(() => {
            throw fallbackCause;
        });
        const result = createLogger("test").error("message");
        expect(result.isErr() && result.error).toEqual({
            type: "log_write_error",
            cause,
            fallbackCause,
        });
    });
});
