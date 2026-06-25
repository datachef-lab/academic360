import { Request, Response, NextFunction } from "express";
import { socketService } from "@/services/socketService.js";

/**
 * Collection paths (after "/api/") whose mutations should be broadcast to the
 * matching socket room ("resource:<path>") so other online users on that page
 * can refresh live. Kept as an allowlist to avoid noisy app-wide broadcasts.
 */
const REALTIME_RESOURCES = new Set<string>([
  // general masters
  "countries",
  "states",
  "cities",
  "districts",
  "blood-groups",
  "categories",
  "religions",
  "nationalities",
  "occupations",
  "qualifications",
  "languages",
  "institutions",
  "degree",
  "annual-incomes",
  "pickup-points",
  "police-stations",
  "post-offices",
  "disability-codes",
  // admissions master
  "admissions/boards",
  "admissions/board-subjects",
  "admissions/board-subject-names",
  "admissions/courses",
  "admissions/sports-category",
  "sports-categories",
  "admission-quota-types",
  "cancel-sources",
  "grades",
  "v1/sections",
  "v1/shifts",
]);

/**
 * After a successful POST/PUT/PATCH/DELETE to an allowlisted resource, emit a
 * `resource_changed` event to that resource's room.
 */
export function resourceRealtime(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const method = req.method.toUpperCase();
  if (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  ) {
    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const url = (req.originalUrl || "").split("?")[0];
      let path = url.replace(/^\/api\//, "").replace(/\/+$/, "");
      // strip a trailing /:id so PUT/DELETE map to the collection room
      path = path.replace(/\/\d+$/, "");
      if (REALTIME_RESOURCES.has(path)) {
        socketService.emitResourceChanged(path, { action: method, path: url });
      }
    });
  }
  next();
}
