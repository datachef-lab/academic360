import "dotenv/config";
import { schemaPaths } from "@/db/schema.ts";
import { defineConfig } from "drizzle-kit";

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
    casing: "snake_case"
});
