import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export default [
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        plugins: {
            turbo: turboPlugin,
            "only-warn": onlyWarn,
        },
        rules: {
            "turbo/no-undeclared-env-vars": "warn",
            "@typescript-eslint/no-unused-vars": "error",
            "no-unused-vars": "warn",
			"no-undef": "warn",
            "no-useless-assignment": "error",
            semi: "error",
			"prefer-const": "error",
        },
    },
    {
        ignores: ["**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**"],
    },
];