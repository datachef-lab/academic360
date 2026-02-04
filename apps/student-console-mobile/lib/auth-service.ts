import axiosInstance from "@/lib/api";
import type { UserDto } from "@repo/db/dtos/user";

export interface LoginPayload {
  accessToken: string;
  user: UserDto;
  refreshToken?: string;
}

export interface ApiResponse<T> {
  httpStatusCode: number;
  httpStatus: string;
  payload: T;
  message: string;
}

export async function login(credential: { email: string; password: string }): Promise<ApiResponse<LoginPayload>> {
  const response = await axiosInstance.post<ApiResponse<LoginPayload>>("/auth/login", credential, {
    withCredentials: true,
  });
  return response.data;
}

export async function sendOtpRequest(
  email: string,
): Promise<ApiResponse<{ message: string; expiresIn: string; sentTo: { email: boolean; whatsapp: boolean } }>> {
  const response = await axiosInstance.post("/auth/otp/send-email", { email });
  return response.data;
}

export async function verifyOtpAndLogin(
  email: string,
  otp: string,
): Promise<ApiResponse<{ accessToken: string; user: UserDto; refreshToken?: string }>> {
  const response = await axiosInstance.post("/auth/otp/verify", { email, otp }, { withCredentials: true });
  return response.data;
}

export async function checkOtpStatus(
  email: string,
): Promise<ApiResponse<{ hasValidOtp: boolean; expiresAt?: string; remainingTime?: number }>> {
  const response = await axiosInstance.get(`/auth/otp/status?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function lookupUser(
  email: string,
): Promise<ApiResponse<{ id: number; name: string; email: string; uid?: string }>> {
  const response = await axiosInstance.get(`/auth/otp/lookup?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function logout(): Promise<void> {
  await axiosInstance.get("/auth/logout", { withCredentials: true });
}
