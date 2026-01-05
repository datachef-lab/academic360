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
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
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
