// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

const dbSrcPath = path.resolve(__dirname, "../../packages/db/src");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  console.log("in vite config, env:", env);

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: "@/schemas", replacement: path.join(dbSrcPath, "schemas") },
        { find: "@/dtos", replacement: path.join(dbSrcPath, "dtos") },
        { find: "@repo/db", replacement: dbSrcPath },
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },
    optimizeDeps: {
      exclude: ["pg"],
    },
  };
});
