import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, "../../logs");

// ─── Custom levels + colors ───────────────────────────────────────────────────
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

winston.addColors({
  error: "bold red",
  warn: "bold yellow",
  info: "bold green",
  http: "bold magenta",
  debug: "bold blue",
});

// ─── Formats ──────────────────────────────────────────────────────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "DD-MM-YYYY hh:mm:ss A" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, stack, service, ...meta }) => {
      const coloredTimestamp = `\x1b[38;5;245m${timestamp}\x1b[0m`;
      const coloredLevel = winston.format
        .colorize()
        .colorize(level, level.toUpperCase().padEnd(5));

      // ← add this
      const svcTag = service
        ? `\x1b[35m${String(service).padEnd(10)} |\x1b[0m  ` // magenta
        : " ".padEnd(13);

      const colorMsg = (msg: string): string => {
        const statusMatch = msg.match(/\s(\d{3})\s/);
        if (!statusMatch) return String(msg);
        const status = parseInt(statusMatch[1]);
        if (status >= 500) return `\x1b[31m${msg}\x1b[0m`;
        if (status >= 400) return `\x1b[33m${msg}\x1b[0m`;
        if (status >= 300) return `\x1b[36m${msg}\x1b[0m`;
        if (status >= 200) return `\x1b[32m${msg}\x1b[0m`;
        return String(msg);
      };

      const colorMethod = (msg: string): string => {
        if (msg.includes("GET ")) return `\x1b[32m${msg}\x1b[0m`;
        if (msg.includes("POST ")) return `\x1b[34m${msg}\x1b[0m`;
        if (msg.includes("PUT ")) return `\x1b[33m${msg}\x1b[0m`;
        if (msg.includes("PATCH ")) return `\x1b[33m${msg}\x1b[0m`;
        if (msg.includes("DELETE ")) return `\x1b[31m${msg}\x1b[0m`;
        if (msg.includes("OPTIONS ")) return `\x1b[90m${msg}\x1b[0m`;
        return String(msg);
      };

      const metaStr =
        Object.keys(meta).length > 0
          ? "\n" + JSON.stringify(meta, null, 2)
          : "";
      const formattedMsg =
        level === "http"
          ? colorMethod(String(message))
          : colorMsg(String(message));

      const base = `${coloredTimestamp}  ${coloredLevel}  ${svcTag}${formattedMsg}${metaStr}`;
      return stack ? `${base}\n${stack}` : base;
    },
  ),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "DD-MM-YYYY - hh:mm:ss A" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, stack, service, ...meta }) => {
      const coloredLevel = winston.format
        .colorize()
        .colorize(level, level.toUpperCase().padEnd(5));

      // const coloredTimestamp = `\x1b[35m${timestamp}\x1b[0m`;  // magenta
      // const coloredTimestamp = `\x1b[38;5;214m${timestamp}\x1b[0m`;  // light orange
      const coloredTimestamp = `\x1b[38;5;245m${timestamp}\x1b[0m`; // grey

      const svcTag = service
        ? `\x1b[35m${String(service).padEnd(10)} |\x1b[0m  ` // magenta
        : " ".padEnd(13);

      const colorMsg = (msg: string): string => {
        const statusMatch = msg.match(/\s(\d{3})\s/);
        if (!statusMatch) return String(msg);
        const status = parseInt(statusMatch[1]);
        if (status >= 500) return `\x1b[31m${msg}\x1b[0m`;
        if (status >= 400) return `\x1b[33m${msg}\x1b[0m`;
        if (status >= 300) return `\x1b[36m${msg}\x1b[0m`;
        if (status >= 200) return `\x1b[32m${msg}\x1b[0m`;
        return String(msg);
      };

      const colorMethod = (msg: string): string => {
        if (msg.includes("GET ")) return `\x1b[32m${msg}\x1b[0m`;
        if (msg.includes("POST ")) return `\x1b[34m${msg}\x1b[0m`;
        if (msg.includes("PUT ")) return `\x1b[33m${msg}\x1b[0m`;
        if (msg.includes("PATCH ")) return `\x1b[33m${msg}\x1b[0m`;
        if (msg.includes("DELETE ")) return `\x1b[31m${msg}\x1b[0m`;
        if (msg.includes("OPTIONS ")) return `\x1b[90m${msg}\x1b[0m`;
        return String(msg);
      };

      const metaStr =
        Object.keys(meta).length > 0
          ? "\n" + JSON.stringify(meta, null, 2)
          : "";
      const formattedMsg =
        level === "http"
          ? colorMethod(String(message))
          : colorMsg(String(message));

      const base = `${coloredTimestamp}  ${coloredLevel}  ${svcTag}${formattedMsg}${metaStr}`;
      return stack ? `${base}\n${stack}` : base;
    },
  ),
);

// ─── Rotation base options ────────────────────────────────────────────────────
const rotationOptions = {
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxFiles: "30d",
  maxSize: "50m",
  createSymlink: true,
};

// ─── Transports ───────────────────────────────────────────────────────────────
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: consoleFormat,
});

const combinedTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "combined"),
  filename: "combined-%DATE%.log",
  symlinkName: "combined-latest.log",
  level: "debug",
  format: fileFormat,
});

const errorTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "errors"),
  filename: "error-%DATE%.log",
  symlinkName: "error-latest.log",
  level: "error",
  format: fileFormat,
});

const requestTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "requests"),
  filename: "request-%DATE%.log",
  symlinkName: "request-latest.log",
  level: "http",
  format: fileFormat,
});

// ─── Exported loggers ─────────────────────────────────────────────────────────
export const winstonLogger = winston.createLogger({
  levels: customLevels,
  level: "debug",
  transports: [consoleTransport, combinedTransport, errorTransport],
});

export const httpLogger = winston.createLogger({
  levels: customLevels,
  level: "http",
  transports: [consoleTransport, requestTransport, combinedTransport],
});

combinedTransport.on("rotate", (oldFile, newFile) => {
  winstonLogger.info(`Log rotated: ${oldFile} → ${newFile}`);
});

// ─── Child logger factory ─────────────────────────────────────────────────────
// Usage: const log = createLogger("db")
// Output: [db] message  →  consistent prefix on every line
export const createLogger = (service: string) => ({
  info: (msg: string, meta?: object) =>
    winstonLogger.info(msg, { service, ...meta }),
  warn: (msg: string, meta?: object) =>
    winstonLogger.warn(msg, { service, ...meta }),
  error: (msg: string, meta?: object) =>
    winstonLogger.error(msg, { service, ...meta }),
  debug: (msg: string, meta?: object) =>
    winstonLogger.debug(msg, { service, ...meta }),
  http: (msg: string, meta?: object) =>
    winstonLogger.http(msg, { service, ...meta }),
});

const prettyPrintObject = (obj: any) => {
  if (typeof obj === "object") {
    return "\n" + JSON.stringify(obj, null, 2);
  }
  return obj;
};
