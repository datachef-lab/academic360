import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,

  {
    plugins: {
      turbo: turboPlugin,
    },

    rules: {
      // Disable JS rules replaced by TS
      "no-unused-vars": "off",
      "no-undef": "off",

      // Base
      "no-useless-assignment": "error",
      semi: "error",
      "prefer-const": "error",

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      // Turbo
      "turbo/no-undeclared-env-vars": "warn",
    },
  },

  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/build/**", "**/.turbo/**"],
  },
];
