import { fromThrowable } from "neverthrow";
import { env } from "@server/env";
import chalk from "chalk";
import { LogLevel, LOG_LEVELS } from "./logger.levels";

const currentLevel =
    LOG_LEVELS[
        env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : "debug")
    ];

const shouldLog = (level: LogLevel) => level <= currentLevel;

const formatTimestamp = () => new Date().toISOString();

const formatValue = (value: unknown): string => {
    if (typeof value === "string") {
        return value;
    }

    return (
        fromThrowable(() =>
            JSON.stringify(value, (_key, item: unknown) => {
                if (typeof item === "bigint") {
                    return `${item}n`;
                }
                if (item instanceof Error) {
                    return {
                        ...item,
                        name: item.name,
                        message: item.message,
                        stack: item.stack,
                        cause: item.cause,
                        ...(item instanceof AggregateError
                            ? { errors: item.errors }
                            : {}),
                    };
                }
                return item;
            }),
        )().unwrapOr(undefined) ?? String(value)
    );
};

const write = (level: LogLevel, place: string, args: unknown[]): void => {
    fromThrowable(() => {
        if (!shouldLog(level)) {
            return;
        }

        const label = LogLevel[level];
        const timestamp = colorTimestamp(formatTimestamp());
        const coloredLabel = colorLevel(level, `[${label}]`);
        const coloredPlace = colorPlace(`[${place}]`);
        const message = args.map(formatValue).join(" ");
        const line = `${timestamp} ${coloredLabel} ${coloredPlace} ${message}`;

        if (level <= LogLevel.Error) {
            console.error(line);
            return;
        }

        console.log(line);
    })();
};

export const createLogger = (place: string) => ({
    fatal: (...args: unknown[]) => write(LogLevel.Fatal, place, args),
    error: (...args: unknown[]) => write(LogLevel.Error, place, args),
    warn: (...args: unknown[]) => write(LogLevel.Warn, place, args),
    info: (...args: unknown[]) => write(LogLevel.Info, place, args),
    debug: (...args: unknown[]) => write(LogLevel.Debug, place, args),
});

function colorLevel(level: LogLevel, text: string) {
    switch (level) {
        case LogLevel.Fatal:
            return chalk.red.bold(text);
        case LogLevel.Error:
            return chalk.red(text);
        case LogLevel.Warn:
            return chalk.yellow(text);
        case LogLevel.Info:
            return chalk.blue(text);
        case LogLevel.Debug:
            return chalk.gray(text);
        default:
            return text;
    }
}

function colorPlace(place: string) {
    return chalk.cyan(place);
}
function colorTimestamp(timestamp: string) {
    return chalk.gray(timestamp);
}
