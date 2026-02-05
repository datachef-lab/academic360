// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");

// const config = getDefaultConfig(__dirname);

// module.exports = withNativeWind(config, { input: "./global.css" });

const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 👇 VERY IMPORTANT for monorepos - merge with Expo defaults
// Expo's default watchFolders includes projectRoot, so we add workspaceRoot
const defaultWatchFolders = config.watchFolders || [projectRoot];
config.watchFolders = [...new Set([...defaultWatchFolders, workspaceRoot])];

// 👇 Force Metro to resolve packages from root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 👇 Fix for pnpm symlinks (required for pnpm monorepo)
// These settings are necessary for pnpm workspace resolution
// config.resolver.disableHierarchicalLookup = true;
// config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: "./global.css" });
