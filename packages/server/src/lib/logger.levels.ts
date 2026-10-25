export enum LogLevel {
    Fatal = 0,
    Error = 1,
    Warn = 2,
    Info = 3,
    Debug = 4,
}

export const LOG_LEVELS = {
    fatal: LogLevel.Fatal,
    error: LogLevel.Error,
    warn: LogLevel.Warn,
    info: LogLevel.Info,
    debug: LogLevel.Debug,
} as const;

export const LOG_LEVEL_NAMES = Object.keys(
    LOG_LEVELS,
) as (keyof typeof LOG_LEVELS)[];
