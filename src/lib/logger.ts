// =============================================================================
// Structured logger for server actions
// Outputs JSON to stderr in production (Sentry/Vercel captures console.error)
// Readable format in development
// =============================================================================

type LogLevel = "info" | "warn" | "error";

type LogContext = {
    action?: string;
    entityType?: string;
    entityId?: string | number;
    userId?: string;
    [key: string]: unknown;
};

function log(level: LogLevel, message: string, ctx?: LogContext) {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...ctx,
    };

    if (process.env.NODE_ENV === "production") {
        // Structured JSON — captured by Vercel/Sentry
        const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
        fn(JSON.stringify(entry));
    } else {
        // Human-readable in dev
        const prefix = level === "error" ? "[ERROR]" : level === "warn" ? "[WARN]" : "[INFO]";
        const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : "";
        console.log(`${prefix} ${message}${ctxStr}`);
    }
}

export const logger = {
    info: (message: string, ctx?: LogContext) => log("info", message, ctx),
    warn: (message: string, ctx?: LogContext) => log("warn", message, ctx),
    error: (message: string, ctx?: LogContext) => log("error", message, ctx),
};
