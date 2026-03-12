import { Request, Response, NextFunction } from "express";

/**
 * Sets the service name for logging on this route group.
 * Usage: router.use(setService("auth"))
 */
export const setService =
  (name: string) => (_req: Request, res: Response, next: NextFunction) => {
    res.locals.service = name;
    next();
  };
