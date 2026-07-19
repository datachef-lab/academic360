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

// 👇 Force react + react-dom (INCLUDING subpaths like react/jsx-runtime,
// react/jsx-dev-runtime, react/compiler-runtime) to always resolve to the
// mobile app's local copy. Root has react@18.3.1 (main-console); mobile pins
// react@19.1.0.
//
// Why subpaths matter: NativeWind's jsxImportSource routes ALL app JSX
// through react-native-css-interop's jsx runtime, which lives hoisted at the
// workspace root and does require("react/jsx-dev-runtime"). Bare-name-only
// interception let that subpath resolve hierarchically from the ROOT copy →
// React 18's jsx runtime creating elements for a React 19 renderer. The
// mismatched element contract made css-interop's className→style wrapping
// silently drop layout classes on some components (cards unstyled, tab dock
// distorted) while inline styles kept working.
const SINGLETON_PACKAGES = ["react", "react-dom"];
const localNodeModules = path.resolve(projectRoot, "node_modules");
const singletonRoots = Object.fromEntries(
  SINGLETON_PACKAGES.map((name) => [
    name,
    path.dirname(require.resolve(`${name}/package.json`, { paths: [localNodeModules] })),
  ]),
);
const matchSingleton = (moduleName) =>
  SINGLETON_PACKAGES.find((name) => moduleName === name || moduleName.startsWith(`${name}/`));
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pkg = matchSingleton(moduleName);
  if (pkg) {
    const filePath = require.resolve(moduleName, { paths: [path.dirname(singletonRoots[pkg])] });
    return { filePath, type: "sourceFile" };
  }
  return baseResolveRequest
    ? baseResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
