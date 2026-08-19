// import { defineConfig, loadEnv } from 'vite';
// import react from '@vitejs/plugin-react';
// import * as path from 'path';

// export default defineConfig(({ mode }) => {
//     const env = loadEnv(mode, process.cwd(), 'VITE_');
//     console.log("in vite config, env:", env);
//     return {
//         'process.env': {}, // empty object
//         // base: env.VITE_APP_PREFIX, // ✅ Base URL for assets
//         plugins: [react()],
//         resolve: {
//             alias: {
//                 '@': path.resolve(__dirname, './src'),
//             },
//         },
//     };
// });

// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  console.log("in vite config, env:", env);

  return {
    plugins: [react()],
    resolve: {
      // Array form so order is honored: the @repo/db package's compiled files
      // contain internal `@/schemas...` imports (its own tsconfig path alias),
      // which must resolve to packages/db/dist — NOT to main-console/src. These
      // specific entries are matched before the general `@` → ./src alias.
      // (Rollup anchors string finds with a `(/|$)` boundary, so scoped deps
      // like `@tanstack/*` are unaffected.)
      alias: [
        {
          find: "@/schemas",
          replacement: path.resolve(__dirname, "../../packages/db/dist/schemas"),
        },
        {
          find: "@/dtos",
          replacement: path.resolve(__dirname, "../../packages/db/dist/dtos"),
        },
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
    },
    // optimizeDeps: {
    //   exclude: ["pg", "dotenv"], // do not pre-bundle Node-only packages
    // },
    // build: {
    //   rollupOptions: {
    //     external: ["pg", "dotenv"], // mark Node modules as external
    //   },
    // },
    // define: {
    //   "process.env": {}, // optional fallback
    // },
  };
});
