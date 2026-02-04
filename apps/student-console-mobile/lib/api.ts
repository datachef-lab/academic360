import axios, { AxiosHeaders } from "axios";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
