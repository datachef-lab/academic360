import { CorsOptions } from "cors";
import { allowedOrigins } from "./allowedOrigins.js";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin as string) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS."));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ["Content-Disposition"],
  // Cache the CORS preflight (OPTIONS) response in the browser so cross-origin
  // requests don't re-preflight on every call. Without this, each API request
  // from the console is two round-trips (OPTIONS + the real request); a page
  // that fires ~10 calls pays ~10 extra round-trips. 24h is the effective cap
  // Chromium honours. Purely a browser-side optimisation — it changes no
  // response body and no allow-list logic, so existing behaviour is unaffected.
  maxAge: 60 * 60 * 24,
};
