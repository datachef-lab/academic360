import type { Request, Response, NextFunction } from "express";
import { bumpSnapshotEpoch } from "@/services/snapshot-cache.js";
import { emitIdCardEvent } from "@/features/idcard/services/id-card-realtime.service.js";
import type { IdCardEventName } from "@/features/idcard/services/id-card-realtime.service.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("idcard-broadcast");

/**
 * Fire an `idcard:*:updated` event on every successful non-GET request under
 * `/api/idcard/*`. Rather than instrumenting each mutation (issue
 * create/finalize/delete, template CRUD, field upsert, legacy-sync) with its own
 * emit, this one middleware covers all of them — including the DRAFT/print path,
 * so the dashboard's "drafts pending" tile updates live. On any successful
 * mutation the cached dashboard snapshot epoch is bumped BEFORE the socket event
 * lands, so every dashboard on every instance refetches and recomputes fresh
 * numbers (never a pre-write replay). Multi-instance delivery rides the Redis
 * adapter.
 *
 * The existing `broadcastIdCardTrackerUpdate` (affiliation realtime-tracker) is
 * independent of this and is left untouched.
 */
export function idCardBroadcastMiddleware(
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
    // First path segment after `/api/idcard/` — a resource hint the client can
    // use for finer refetches; the dashboard just invalidates its own keys.
    const resource = req.path.replace(/^\/+/, "").split("/")[0] ?? "unknown";
    const event: IdCardEventName = resource.startsWith("template")
      ? "idcard:template:updated"
      : resource.startsWith("issue")
        ? "idcard:issue:updated"
        : "idcard:master:updated";

    // Invalidate the cached dashboard snapshot BEFORE the socket event reaches
    // clients — their refetch must recompute, never replay pre-write stats.
    bumpSnapshotEpoch("idcard:dashboard");
    emitIdCardEvent(event, { detail: { resource, method } });
    log.info(
      `emit ${event} { resource: ${resource}, method: ${method}, status: ${res.statusCode} }`,
    );
  });

  next();
}
