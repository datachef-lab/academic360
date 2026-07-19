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

// 👇 VERY IMPORTANT for monorepos - merge with Expo defaults
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 👇 Force single-instance packages (react + react-dom) to always resolve to
// the mobile app's local copy, even when a transitively-required module tries
// to load them from the workspace root. Root has react@18.3.1 (main-console);
// mobile pins react@19.1.0. Without this, a transitive require("react") could
// pull in React 18 and produce "Invalid hook call / two React copies" +
// "Cannot read property 'useMemoCache' of null" (a React 19 Compiler API).
const SINGLETONS = ["react", "react-dom"];
const localNodeModules = path.resolve(projectRoot, "node_modules");
const singletonEntries = Object.fromEntries(
  SINGLETONS.map((name) => [name, require.resolve(name, { paths: [localNodeModules] })]),
);
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (singletonEntries[moduleName]) {
    return { filePath: singletonEntries[moduleName], type: "sourceFile" };
  }
  return baseResolveRequest
    ? baseResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
