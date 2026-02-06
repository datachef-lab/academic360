/**
 * Dynamic app config - injects EXPO_PUBLIC_* env vars into extra.
 * EAS Build: env from eas.json is set before this runs.
 * Local dev: .env.development.local or .env.stage.local (loaded by Expo).
 */
const base = require("./app.json");

module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || base.expo?.extra?.EXPO_PUBLIC_API_URL || "http://localhost:8080";
  const imageUrl =
    process.env.EXPO_PUBLIC_STUDENT_IMAGE_URL ||
    base.expo?.extra?.EXPO_PUBLIC_STUDENT_IMAGE_URL ||
    "https://74.207.233.48:8443/hrclIRP/studentimages";

  return {
    ...base.expo,
    extra: {
      ...base.expo?.extra,
      EXPO_PUBLIC_API_URL: apiUrl,
      EXPO_PUBLIC_STUDENT_IMAGE_URL: imageUrl,
    },
  };
};
