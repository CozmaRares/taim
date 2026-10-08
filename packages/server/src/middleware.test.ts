import { Hono } from "hono";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    factory: vi.fn(),
    clerk: vi.fn(),
    getAuth: vi.fn(),
    database: vi.fn(),
}));
vi.mock("@clerk/hono", () => ({
    clerkMiddleware: mocks.factory,
    getAuth: mocks.getAuth,
}));
vi.mock("@/db/dal", () => ({ withDatabaseConnection: mocks.database }));
vi.mock("@/env", () => ({
    env: {
        NODE_ENV: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
    },
}));
vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ error: vi.fn(), info: vi.fn() }),
}));
import { openDatabaseConnection, requireAuth } from "./middleware";

beforeEach(() => {
    vi.resetAllMocks();
    mocks.factory.mockReturnValue(mocks.clerk);
    mocks.clerk.mockImplementation(async (_c, next) => {
        await next();
    });
    mocks.getAuth.mockReturnValue({ userId: "user" });
    mocks.database.mockImplementation(async callback => ok(await callback()));
});

const app = () =>
    new Hono().use("*", requireAuth).get("/", c => c.json({ ok: true }));

describe("authentication boundaries", () => {
    it("keeps signed-out sessions as 401 responses", async () => {
        mocks.getAuth.mockReturnValue({ userId: null });
        expect((await app().request("/")).status).toBe(401);
    });

    it("continues to the application after authentication", async () => {
        const response = await app().request("/");
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
    });

    it.each(["factory", "middleware"])(
        "maps Clerk %s failures to a sanitized 503 response",
        async source => {
            if (source === "factory") {
                mocks.factory.mockImplementationOnce(() => {
                    throw new Error("secret details");
                });
            } else {
                mocks.clerk.mockRejectedValueOnce(new Error("secret details"));
            }
            const response = await app().request("/");
            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({
                error: "Authentication unavailable",
            });
            expect(mocks.getAuth).not.toHaveBeenCalled();
        },
    );

    it("replaces a partial Clerk response when authentication fails", async () => {
        mocks.clerk.mockImplementationOnce(c => {
            c.res = c.json({ partial: true });
            throw new Error("authentication failed");
        });
        const response = await app().request("/");
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({
            error: "Authentication unavailable",
        });
    });

    it("handles failures when reading authentication state", async () => {
        mocks.getAuth.mockImplementationOnce(() => {
            throw new Error("auth missing");
        });
        expect((await app().request("/")).status).toBe(503);
    });

    it("preserves Clerk redirects instead of running downstream handlers", async () => {
        mocks.clerk.mockImplementationOnce(c => c.redirect("/sign-in", 307));
        const response = await app().request("/");
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe("/sign-in");
        expect(mocks.getAuth).not.toHaveBeenCalled();
    });

    it("does not classify downstream errors as Clerk failures", async () => {
        const server = new Hono().use("*", requireAuth);
        server.onError((_error, c) =>
            c.json({ error: "Application failure" }, 500),
        );
        server.get("/", () => {
            throw new Error("application failed");
        });
        const response = await server.request("/");
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Application failure" });
    });
});

it("forwards connection failures to app.onError even after a handler succeeds", async () => {
    const failure = {
        type: "database_error",
        operation: "close",
        cause: new Error("close failed"),
    };
    mocks.database.mockImplementationOnce(async callback => {
        await callback();
        return err(failure);
    });
    const onError = vi.fn((error: Error, c: import("hono").Context) =>
        c.json({ error: "Handled by app.onError" }, 500),
    );
    const server = new Hono().use("*", openDatabaseConnection);
    server.onError(onError);
    server.get("/", c => c.json({ ok: true }));
    const response = await server.request("/");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Handled by app.onError" });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].cause).toBe(failure);
});
