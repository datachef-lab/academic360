import axiosInstance from "@/utils/api";

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  // Send OTP to email for verification (no link)
  const res = await axiosInstance.post(`/auth/otp/send-email`, { email });
  return { success: res.data.httpStatus === "SUCCESS", message: res.data.message || "" };
}

export async function validateResetToken(
  token: string,
): Promise<{ success: boolean; email?: string; message?: string }> {
  const res = await axiosInstance.get(`/api/users/password-reset/validate/${encodeURIComponent(token)}`);
  return { success: res.data.httpStatus === "SUCCESS", email: res.data.payload?.email, message: res.data.message };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await axiosInstance.post(`/api/users/password-reset/reset`, { token, newPassword });
  return { success: res.data.httpStatus === "SUCCESS", message: res.data.message };
}

export async function resetPasswordWithEmailOtp(
  email: string,
  otp: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await axiosInstance.post(`/api/users/password-reset/reset-with-otp`, { email, otp, newPassword });
  return { success: res.data.httpStatus === "SUCCESS", message: res.data.message };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; message?: string }> {
  const res = await axiosInstance.post(`/auth/otp/verify-only`, { email, otp });
  return { success: res.data.httpStatus === "SUCCESS", message: res.data.message };
}

export async function checkOtpStatus(
  email: string,
): Promise<{ success: boolean; remainingTime?: number; expiresAt?: string; message?: string }> {
  const res = await axiosInstance.get(`/auth/otp/status`, { params: { email } });
  if (res.data && (res.data.httpStatus === "SUCCESS" || res.status === 200)) {
    return {
      success: true,
      remainingTime: res.data.payload?.remainingTime,
      expiresAt: res.data.payload?.expiresAt,
      message: res.data.message,
    };
  }
  return { success: false, message: res.data?.message };
}
