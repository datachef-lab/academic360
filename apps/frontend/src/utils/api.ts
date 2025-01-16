// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const BASE_URL = import.meta.env.VITE_API_URL;

// const Api = axios.create({
//   baseURL: BASE_URL + "/api",
//   timeout: 6000,
// });

// const navigate = useNavigate();

// const refreshToken = async () => {
//   try {
//     const res = await Api.post("/auth/refreshToken", {
//       refreshToken: localStorage.getItem("refreshToken"),
//     });

//     if (res.data) {
//       console.log(res.data);
//       localStorage.setItem("token", response.data.accessToken);
//       localStorage.setItem("refreshToken", response.data.refreshToken);
//     }
//     return response.data.accessToken; // Return the new access token
//   } catch (error) {
//     console.error("refresh token error", error.data);

//     console.log("Your session has expired. Please log in again to continue.");
//     localStorage.removeItem("token");
//     localStorage.removeItem("refreshToken");
//     navigate("/login", { replace: true });

//     return null; // No token available
//   }
// };

// //Request interceptor
// Api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("authToken");

//     if (token && config.requiresAuth !== false) {
//       config.headers = {
//         ...config.headers,
//         Authorization: `Bearer ${token}`,
//       };
//     }

//     return config;
//   },
//   (error) => {
//     console.log("request error", error);
//     return Promise.reject(error);
//   },
// );

// //Response interceptor
// Api.interceptors.response.use(
//   (response) => {
//     console.log("api response**", response);
//     console.log("api response**", response.data);
//     return response.data;
//   },
//   async (error) => {
//     console.log("api error", error);
//     console.log("api error response", error.response);

//     if (!error.response) {
//     }
//     if (error.response) {
//       if (error.response.status === 401) {
//         console.log("401 Unauthorized: Attempting to refresh token...");
//         const originalRequest = error.config;
//         if (!originalRequest._retry) {
//           originalRequest._retry = true;
//           const newToken = await refreshToken();
//           if (newToken) {
//             originalRequest.headers.Authorization = `Bearer ${newToken}`;
//             return Api(originalRequest);
//           }
//         }
//         console.log("401 error: Token refresh failed.");
//       } else if (error.response.status === 403) {
//         console.log(
//           "Forbidden:You do not have permission to access this resource. Please check your account permissions or contact support.",
//         );
//       } else if (error.response.status === 404) {
//         console.log(
//           "Oops! The page you’re looking for doesn’t exist. Please check the URL or go back to the homepage.",
//         );
//       } else if (error.response.status === 429) {
//         console.log("Too many requests. Please try again later.");
//       } else if (error.response.status >= 500) {
//         console.log("Internal Server Error. Please try again later.");
//       } else {
//         console.error(
//           "Unexpected error occurred. Please check your connection or try again later.",
//         );
//         console.log("unexpected error oc ", error.response.data);
//       }
//     } else {
//       console.log("network error", error);
//       return Promise.reject(error);
//     }
//     return Promise.reject(error);
//   },
// );
// export default Api;


// axiosSetup.ts
import axios, { AxiosResponse } from "axios";

// Define an Axios instance with a base URL
const axiosInstance = axios.create({
    baseURL: "https://jsonplaceholder.typicode.com",  // Your API base URL
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
