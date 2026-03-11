module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "backend",
        "main-console",
        "student-console",
        "student-console-mobile",
        "notification-system",
        "db",
        "ui",
        "utils",
        "eslint-config",
        "typescript-config",
        "deploy",
        "ci",
        "release",
      ],
    ],
    "scope-empty": [1, "never"], // warn (not error) if no scope
  },
};
