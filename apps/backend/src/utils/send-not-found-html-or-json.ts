import type { Request, Response } from "express";
import { NOT_FOUND_HTML_PATH } from "./not-found-html-path.js";

/**
 * REST handlers usually return JSON 404s. Top-level browser navigations (address bar / new tab)
 * send `Sec-Fetch-Dest: document` — for those, serve the static 404 page instead of raw JSON.
 */
export function sendNotFoundHtmlIfDocumentNavigation(
  req: Request,
  res: Response,
  statusCode: number,
  sendJson: () => void,
): void {
  if (req.get("sec-fetch-dest") === "document") {
    res.status(statusCode);
    res.sendFile(NOT_FOUND_HTML_PATH);
    return;
  }
  sendJson();
}
