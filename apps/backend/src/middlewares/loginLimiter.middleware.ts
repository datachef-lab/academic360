import rateLimiter from "express-rate-limit";
import { logEvents } from "./logger.middleware.js";
import { format } from "date-fns";
import { ApiError } from "@/utils/ApiError.js";

export const loginLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per window per minute
  message:
    "Too many login attempts, please try again later after 1 minute pause.",
  handler: (req, res, next, options) => {
    const logFileName = `errLog_${format(new Date(), "dd-MM-yyyy")}.log`;
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin} `,
      logFileName,
    );
    res.status(429).json(new ApiError(429, options.message.message));
  },
  standardHeaders: true,
  legacyHeaders: true,
  // Use a custom key generator that works with or without trust proxy
  keyGenerator: (req) => {
    // If trust proxy is enabled, use the real IP from X-Forwarded-For
    // Otherwise, use req.ip directly
    return req.ip || req.socket.remoteAddress || "unknown";
  },
});
