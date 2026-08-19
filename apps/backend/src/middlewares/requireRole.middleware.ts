import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import type { User } from "@repo/db/schemas/models/user";

/**
 * Role gate. MUST run after verifyJWT (relies on req.user).
 * Rejects with 403 unless req.user.type is in the allowed list.
 *
 *   router.post("/x", verifyJWT, requireRole("ADMIN", "STAFF"), handler);
 */
export const requireRole = (...allowed: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User | undefined;
      if (!user) {
        throw new ApiError(401, "Unauthorized");
      }
      if (!allowed.includes(user.type as string)) {
        throw new ApiError(403, "Forbidden: insufficient role");
      }
      next();
    } catch (err) {
      handleError(err, res, next);
    }
  };
};

/** Convenience: institutional staff who can administer service requests. */
export const requireStaff = requireRole("ADMIN", "STAFF", "FACULTY");
