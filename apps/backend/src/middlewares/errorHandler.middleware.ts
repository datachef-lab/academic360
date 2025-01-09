import { NextFunction, Request, Response } from "express";
import { logEvents } from "@/middlewares/logger.middleware.js";
import { format } from "date-fns";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Generate dynamic log file name based on current date
  const logFileName = `errLog_${format(new Date(), "dd-MM-yyyy")}.log`;

  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    logFileName
  );
  console.error(err.stack);

  const status = res.statusCode ? res.statusCode : 500;

  res.status(status).json({ message: err.message });
};
