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
  // academic setup · course design
  "course-design/papers",
  "course-design/program-courses",
  "course-design/subject-grouping-mains",
  "course-design/streams",
  "course-design/courses",
  "course-design/course-types",
  "course-design/course-levels",
  "course-design/affiliations",
  "course-design/regulation-types",
  "course-design/subjects",
  "course-design/subject-types",
  "course-design/exam-components",
  "classes",
  // academic setup · subject-selection config
  "subject-selection/related-subject-mains",
  "subject-selection/restricted-grouping-mains",
  "subject-selection/metas",
  // academic setup · student promotion logic
  "v1/batches/promotion-builders",
  "v1/batches/promotion-clauses",
  "v1/batches/promotion-statuses",
  // academic setup · academic years
  "v1/academics",
  // document issuance · certificate + declaration masters
  "academics/certificate-masters",
  "academics/certificate-field-masters",
  "academics/certificate-field-option-masters",
  "academics/declaration-masters",
  /*
    A declaration master is saved as a master write followed by one write per
    statement / field / option, so the master-level event alone would reach the
    other console before the tree is persisted. Listing the child collections
    too means the *last* write is what triggers the final refresh. Note that
    "academics/declaration-masters/preview" is deliberately absent: it is a
    read-only POST that renders the unsaved draft and must not broadcast.
  */
  "academics/declaration-masters/statements",
  "academics/declaration-masters/statement-fields",
  "academics/declaration-masters/statement-field-options",
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
