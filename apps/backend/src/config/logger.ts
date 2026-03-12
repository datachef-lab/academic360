import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Log directory: apps/backend/logs ────────────────────────────────────────
const LOG_DIR = path.join(__dirname, "../../logs");

// ─── Custom log format (Spring Boot style) ───────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const base = `${timestamp}  ${level.toUpperCase().padEnd(5)}  academic360 --- ${message}${metaStr}`;
    return stack ? `${base}\n${stack}` : base;
  }),
);

// ─── Console format (colored, for dev) ───────────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const base = `${timestamp}  ${level.padEnd(17)}  academic360 --- ${message}${metaStr}`;
    return stack ? `${base}\n${stack}` : base;
  }),
);

// ─── Shared rotation options ──────────────────────────────────────────────────
const rotationOptions = {
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxFiles: "30d", // ← auto-delete after 30 days
  maxSize: "50m", // ← rotate if file hits 50mb
  createSymlink: true, // ← latest.log symlink always points to today
};

// ─── Transports ──────────────────────────────────────────────────────────────

// 1. Console (dev only — colorized)
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: consoleFormat,
});

// 2. Combined log (everything: debug, info, warn, error)
const combinedTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "combined"),
  filename: "combined-%DATE%.log",
  symlinkName: "combined-latest.log",
  level: "debug",
  format: logFormat,
});

// 3. Error log (errors only)
const errorTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "errors"),
  filename: "error-%DATE%.log",
  symlinkName: "error-latest.log",
  level: "error",
  format: logFormat,
});

// 4. Request log (HTTP requests from Morgan — info level)
const requestTransport = new DailyRotateFile({
  ...rotationOptions,
  dirname: path.join(LOG_DIR, "requests"),
  filename: "request-%DATE%.log",
  symlinkName: "request-latest.log",
  level: "http",
  format: logFormat,
});

// ─── Logger instance ──────────────────────────────────────────────────────────
export const winstonLogger = winston.createLogger({
  levels: {
    ...winston.config.npm.levels,
    http: 5, // between verbose(4) and silly(6) — fits Morgan HTTP logs
  },
  level: "debug",
  transports: [consoleTransport, combinedTransport, errorTransport],
});

// Separate logger for HTTP requests (Morgan pipes into this)
export const httpLogger = winston.createLogger({
  levels: { ...winston.config.npm.levels, http: 5 },
  level: "http",
  transports: [
    consoleTransport,
    requestTransport,
    combinedTransport, // requests also appear in combined
  ],
});

// ─── Rotation event logging ───────────────────────────────────────────────────
combinedTransport.on("rotate", (oldFile, newFile) => {
  winstonLogger.info(`Log rotated: ${oldFile} → ${newFile}`);
});

errorTransport.on("rotate", (oldFile, newFile) => {
  winstonLogger.info(`Error log rotated: ${oldFile} → ${newFile}`);
});
