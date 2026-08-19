import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "@/utils/verifyToken.js";
import { db } from "@/db/index.js";
import { userModel } from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

/**
 * Best-effort user authentication. If a valid USER access token is present,
 * attaches req.user; otherwise calls next() WITHOUT error. Use on endpoints
 * that serve both authenticated users and another credential type (e.g. the
 * alumni reference token on POST /submit) — the handler decides the path based
 * on whether req.user was populated.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader =
      req.headers.authorization || (req.headers.Authorization as string);
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const accessToken = authHeader.split(" ")[1];
    const decoded = await verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET!);
    if (!decoded?.id) return next();

    const [foundUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.id, decoded.id));

    if (foundUser && foundUser.isActive) {
      req.user = foundUser;
    }
  } catch {
    // Not a valid user token (e.g. an alumni reference token) — proceed unauthenticated.
  }
  next();
};
