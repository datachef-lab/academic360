module.exports = {
  tagPrefix: "v",
  types: [
    { type: "feat", section: "✨ Features" },
    { type: "fix", section: "🐛 Bug Fixes" },
    { type: "perf", section: "⚡ Performance" },
    { type: "refactor", section: "♻️  Refactoring" },
    { type: "docs", section: "📚 Documentation" },
    { type: "chore", hidden: true },
    { type: "test", hidden: true },
    { type: "ci", hidden: true },
    { type: "style", hidden: true },
  ],
  // reads/writes version from root package.json only (single versioning)
  packageFiles: [{ filename: "package.json", type: "json" }],
  bumpFiles: [{ filename: "package.json", type: "json" }],
};
