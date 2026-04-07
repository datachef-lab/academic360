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
  /** Count of unique exam subjects (papers) the student is enrolled in via exam_candidates. Present for exam-group responses. */
  totalSubjectCount?: number;
}

export function toSentenceCase(str: string): string {
  let result = str
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Remove "Student" prefix from registration and roll number headers
  result = result.replace(/^Student Registration Number$/, "Registration Number");
  result = result.replace(/^Student Roll Number$/, "Roll Number");

  return result;
}
