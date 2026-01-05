import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    app: "student-console", // Identify requests from student console
  },
  withCredentials: true,
});

// Add request interceptor to ensure app header is always set
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure app header is set for all requests
    if (!config.headers["app"]) {
      config.headers["app"] = "student-console";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}
