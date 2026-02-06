import axios, { AxiosHeaders } from "axios";

// API URL resolution order:
// 1. Constants.expoConfig.extra (from app.config.js - baked in at build time)
// 2. process.env.EXPO_PUBLIC_API_URL (EAS build / .env)
// 3. Fallback localhost
export const getApiBaseUrl = () => {
  try {
    // Priority 1: Constants.extra (injected by app.config.js at build time - most reliable)
    try {
      const Constants = require("expo-constants").default;
      const fromExtra = Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
      if (fromExtra && typeof fromExtra === "string" && fromExtra !== "http://localhost:8080") {
        return fromExtra;
      }
    } catch {
      // Constants might not be available in all contexts
    }

    // Priority 2: process.env (EAS builds set this from eas.json env)
    if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
      const url = process.env.EXPO_PUBLIC_API_URL;
      if (url && url !== "http://localhost:8080") return url;
    }

    // Fallback (avoid localhost in production - causes "network error" on device)
    return "http://localhost:8080";
  } catch (e) {
    console.error("[API] Error getting API_BASE_URL:", e);
    return "http://localhost:8080";
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Always log resolved URL to help debug env loading (especially in production builds)
console.log("[API] API_BASE_URL resolved:", API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,

  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    app: "student-console",
  },
});

// In-memory access token. Used before AuthProvider finishes bootstrapping
let inMemoryAccessToken: string | null = null;

export function setAccessTokenForApi(token: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return;
  }
  delete axiosInstance.defaults.headers.common["Authorization"];
}

// Request interceptor to attach token if available
axiosInstance.interceptors.request.use((config) => {
  if (!inMemoryAccessToken) return config;
  if (config.headers instanceof AxiosHeaders) {
    if (!config.headers.has("Authorization")) {
      config.headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
    }
    return config;
  }
  const wrapped = new AxiosHeaders(config.headers);
  if (!wrapped.has("Authorization")) {
    wrapped.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }
  config.headers = wrapped;
  return config;
});

export default axiosInstance;
