import { CorsOptions } from "cors";
import { allowedOrigins } from "./allowedOrigins.ts";

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
};
