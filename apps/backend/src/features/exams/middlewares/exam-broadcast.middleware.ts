import type { Request, Response, NextFunction } from "express";
import { socketService } from "@/services/socketService";
import { createLogger } from "@/config/logger";

const log = createLogger("exam-broadcast");

/**
 * Fire `exam:dashboard:updated` on every successful non-GET request under the
 * exam route prefixes (`/api/exams/*`, `/api/exam-groups/*`, `/api/admit-card/*`).
 * Same recipe as the library broadcast middleware: rather than instrumenting
 * each mutation service with its own emit, one middleware covers scheduling,
 * allotment, admit-card distribution and the masters. The Redis adapter
 * ([app.ts:402]) fans the emit out across every EC2 instance.
 *
 * The payload is a HINT ({ resource, method }) — the dashboard invalidates its
 * React Query keys and refetches from the authoritative stats endpoint, so no
 * stale data can ride the socket.
 */
export function examBroadcastMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    const resource = req.path.replace(/^\/+/, "").split("/")[0] ?? "unknown";
    emitExamDashboardUpdate({ resource, method });
  });

  next();
}

/** Fire-and-forget emit to the `exam_dashboard` room — never let a socket
 *  failure fail the domain mutation that triggered it. */
export function emitExamDashboardUpdate(
  detail: Record<string, unknown> = {},
): void {
  try {
    const io = socketService.getIO();
    if (!io) return;
    io.to("exam_dashboard").emit("exam:dashboard:updated", {
      at: new Date().toISOString(),
      ...detail,
    });
    log.info(`emit exam:dashboard:updated ${JSON.stringify(detail)}`);
  } catch (error) {
    log.error("Failed to emit exam:dashboard:updated", { error });
  }
}
