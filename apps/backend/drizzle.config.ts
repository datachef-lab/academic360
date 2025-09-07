import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// console.log(schemaPaths);

export default defineConfig({
  out: "./drizzle",
  schema: "./dist/apps/backend/src/db/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  casing: "snake_case",
});
