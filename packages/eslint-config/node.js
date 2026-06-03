import base from "./base.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "no-process-exit": "warn",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
];
