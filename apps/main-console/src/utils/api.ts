// axiosSetup.js
import axios, { AxiosHeaders, AxiosResponse } from "axios";

// Define an Axios instance with a base URL
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
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
      console.log("Triggered Error");
      if (error.config && error.response) {
        const { status } = error.response;

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
        showError({
          message: "Network error. Please check your connection.",
        });
      }

      return Promise.reject(error);
    },
  );
};

export default axiosInstance;
