/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in @academic360/db");
}

export default defineConfig({
  out: "./drizzle",
  // Point at .ts model files directly (drizzle-kit reads source, not dist).
  // Avoids the models/index.ts barrel which uses .js ESM re-exports.
  schema: "./src/schemas/models/**/*.model.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  casing: "snake_case",
});
