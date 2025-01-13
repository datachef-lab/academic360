import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { schemaPaths } from "./src/db/schema.ts";

console.log(schemaPaths);

export default defineConfig({
    out: "./drizzle",
    schema: schemaPaths,
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
