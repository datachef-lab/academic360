import axios, { AxiosHeaders } from "axios";
import Constants from "expo-constants";

// EAS builds: process.env.EXPO_PUBLIC_API_URL is set from eas.json env
// Local dev: Can use .env files or Constants
const getApiBaseUrl = () => {
  // Priority 1: process.env (works in EAS builds and local with .env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Priority 2: Constants.expoConfig.extra (app.json)
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL) {
    return Constants.expoConfig.extra.EXPO_PUBLIC_API_URL as string;
  }
  // Fallback
  return "http://localhost:8080";
};

export const API_BASE_URL = getApiBaseUrl();

// Log in dev to help debug
if (__DEV__) {
  console.log("[API] API_BASE_URL:", API_BASE_URL);
}

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
