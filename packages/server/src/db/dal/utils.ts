import { createLogger } from "@/lib/logger";

const logger = createLogger("db");

export type DbError = { type: string };
export type UnknownDbError = { type: "unknown_db_error"; error: unknown };

export function logErrorAndCreate<Args extends unknown[], E extends DbError>(
    create: (...args: Args) => E,
): (...args: Args) => E {
    return (...args) => {
        const result = create(...args);
        if (isUnknownDbError(result)) {
            logger.error(result.type, result.error);
        } else {
            logger.debug(result);
        }
        return result;
    };
}

export function isUnknownDbError(error: DbError): error is UnknownDbError {
    return error.type === "unknown_db_error";
}

export const unknownDbError = logErrorAndCreate(
    (error: unknown): UnknownDbError => ({ type: "unknown_db_error", error }),
);

export function isUniqueConstraintError(error: unknown) {
    return (
        error instanceof Error &&
        /UNIQUE constraint failed/i.test(`${error.message} ${error.cause}`)
    );
}

export function isForeignKeyConstraintError(error: unknown) {
    return (
        error instanceof Error &&
        /FOREIGN KEY constraint failed/i.test(`${error.message} ${error.cause}`)
    );
}
