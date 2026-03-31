import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import type { UserDto } from "@repo/db/dtos/user";

export interface LoginCredential {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserDto;
  refreshToken?: string;
}

export async function login(credential: LoginCredential) {
  try {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credential,
      { withCredentials: true },
    );
    console.log("Login response:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Login API error:", error);
    // Re-throw the error with more context
    throw error;
  }
}

export async function logout() {
  try {
    const response = await axiosInstance.get("/auth/logout", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Logout API error:", error);
    throw error;
  }
}
