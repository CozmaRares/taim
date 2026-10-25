import { beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const driver = { run: vi.fn(), close: vi.fn() };
    return {
        run: driver.run,
        driver,
        open: vi.fn(function () {
            return driver;
        }),
        drizzle: vi.fn(() => ({})),
    };
});
export const databaseMocks = mocks;

vi.mock("@server/env", () => ({ env: { DB_FILE_NAME: ":memory:" } }));
vi.mock("@server/lib/logger", () => {
    const loggerFns = {
        error: vi.fn(),
        info: vi.fn(),
        fatal: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    } satisfies ReturnType<typeof import("@server/lib/logger").createLogger>;

    return { createLogger: () => loggerFns };
});

vi.mock("bun:sqlite", () => ({ Database: databaseMocks.open }));
vi.mock("drizzle-orm/bun-sqlite", () => ({ drizzle: databaseMocks.drizzle }));

beforeEach(() => {
    vi.resetAllMocks();
    databaseMocks.open.mockImplementation(function () {
        return databaseMocks.driver;
    });
    databaseMocks.drizzle.mockReturnValue({});
});
