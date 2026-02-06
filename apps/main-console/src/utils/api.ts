// axiosSetup.js
import axios, { AxiosHeaders, AxiosResponse } from "axios";

// Define an Axios instance with a base URL and performance optimizations
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
  timeout: 0, // 0 second timeout - no timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory access token (no localStorage). Used before AuthProvider finishes bootstrapping
let inMemoryAccessToken: string | null = null;

export function setAccessTokenForApi(token: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return;
  }
  delete axiosInstance.defaults.headers.common["Authorization"];
}

// Lightweight request interceptor to attach token if available early
axiosInstance.interceptors.request.use((config) => {
  if (!inMemoryAccessToken) return config;
  if (config.headers instanceof AxiosHeaders) {
    if (!config.headers.has("Authorization")) {
      config.headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
    }
    return config;
  }
  // Wrap plain headers into AxiosHeaders and set Authorization
  const wrapped = new AxiosHeaders(config.headers);
  if (!wrapped.has("Authorization")) {
    wrapped.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }
  config.headers = wrapped;
  return config;
});

// Early response interceptor to suppress console errors for silent auth checks
// This runs before other interceptors to catch and suppress expected 401/403 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is a silent auth check (expected 401/403)
    const isSilentAuthCheck = (error.config as any)?._silentAuthCheck;
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;

    if (isSilentAuthCheck && isAuthError) {
      // Suppress console error for expected auth failures
      // Mark the error so other interceptors know to skip logging
      (error as any)._suppressLog = true;
    }

    return Promise.reject(error);
  },
);

// Axios interceptor setup
export const setupAxiosInterceptors = (
  showError: (arg0: {
    statusCode?: number;
    message: string;
    retry?: () => Promise<AxiosResponse<unknown, unknown> | undefined>;
  }) => void,
) => {
  axiosInstance.interceptors.response.use(
    // If the response is successful, just return it
    (response) => response,

    // If an error occurs in the API request
    (error) => {
      // Check if error logging should be suppressed
      const shouldSuppressLog = (error as any)?._suppressLog || (error.config as any)?._silentAuthCheck;
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;

      // Skip logging for silent auth checks
      if (!shouldSuppressLog) {
        console.log("Triggered Error");
      }

      if (error.config && error.response) {
        const { status } = error.response;

        // Defer 401 handling to AuthProvider's interceptor (refresh/redirect). Avoid noisy toasts.
        // Also skip error handling for silent auth checks
        if (status === 401 && !shouldSuppressLog) {
          return Promise.reject(error);
        }

        // For silent auth checks, just reject without showing error
        if (shouldSuppressLog && isAuthError) {
          return Promise.reject(error);
        }

        // Retry logic (retries the failed request)
        const retry = async () => {
          try {
            return await axiosInstance.request(error.config);
          } catch (retryError) {
            console.error("Retry failed:", retryError);
          }
        };

        // Show error and attach retry button if needed
        showError({
          statusCode: status,
          message: error.response.data.message || undefined, // Default error message
          retry, // Attach the retry function to the error
        });
      } else {
        // Handle network errors or unknown errors
        if (!shouldSuppressLog) {
          showError({
            message: "Network error. Please check your connection.",
          });
        }
      }

      return Promise.reject(error);
    },
  );
};

export default axiosInstance;
