// axiosSetup.js
import axios, { AxiosResponse } from "axios";

// Define an Axios instance with a base URL
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BACKEND_URL,
});

// Axios interceptor setup
export const setupAxiosInterceptors = (showError: (arg0: { statusCode?: number; message: string; retry?: () => Promise<AxiosResponse<unknown, unknown> | undefined>; }) => void) => {
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
                    message: error.response.data.message || undefined,  // Default error message
                    retry,  // Attach the retry function to the error
                });
            } else {
                // Handle network errors or unknown errors
                showError({
                    message: "Network error. Please check your connection.",
                });
            }

            return Promise.reject(error);
        }
    );
};

export default axiosInstance;
