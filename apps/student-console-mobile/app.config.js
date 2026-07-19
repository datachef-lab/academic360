/**
 * Single source of truth for Expo app config.
 *
 * URLs come from EAS Environments on build (see eas.json `environment`),
 * from .env.development.local locally, or fall through to the placeholders
 * below so the CLI can still resolve a config.
 */
module.exports = () => ({
  name: "Student Console",
  slug: "student-console-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "studentconsolemobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "com.harsh.desai.studentconsolemobile",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.harsh.desai.studentconsolemobile",
    adaptiveIcon: {
      backgroundColor: "#082038",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "studentconsolemobile" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#082038",
        dark: { backgroundColor: "#082038" },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: { projectId: "28e3d336-42d5-468a-9050-7c8474261dc8" },
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080",
    EXPO_PUBLIC_STUDENT_IMAGE_URL:
      process.env.EXPO_PUBLIC_STUDENT_IMAGE_URL ||
      "https://74.207.233.48:8443/hrclIRP/studentimages",
  },
  runtimeVersion: "1.0.1",
  updates: {
    url: "https://u.expo.dev/28e3d336-42d5-468a-9050-7c8474261dc8",
  },
});
