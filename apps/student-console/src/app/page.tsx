"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

import { sendOtpRequest, verifyOtpAndLogin } from "@/lib/services/auth.service";
import { UserDto } from "@repo/db/dtos/user";

export default function SignInPage() {
  const [uid, setUid] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invalidOpen, setInvalidOpen] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle OTP expiry countdown
  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiry]);

  const formatUid = (value: string) => {
    // Remove all non-digits and limit to 10 digits
    const digits = value.replace(/\D/g, "").slice(0, 10);
    return digits;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (uid.length !== 10) {
      setError("Please enter a valid 10-digit UID");
      setIsLoading(false);
      return;
    }

    try {
      const email = `${uid}@thebges.edu.in`;
      const response = await sendOtpRequest(email);

      if (response.httpStatusCode === 200) {
        setOtpSent(true);
        setOtpExpiry(180); // 3 minutes
        setResendCooldown(30); // 30 seconds cooldown
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      let errorMessage = "Failed to send OTP. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || "Invalid UID or user not found.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait before trying again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setInvalidMessage(errorMessage);
      setInvalidOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    try {
      const email = `${uid}@thebges.edu.in`;
      const response = await verifyOtpAndLogin(email, otp, "student-console");

      if (response.httpStatusCode === 200) {
        const payload = response.payload as { accessToken: string; user: UserDto; redirectTo?: string };
        const type = (payload.user as any)?.userType || (payload.user as any)?.type || (payload.user as any)?.role;
        const isStudent = typeof type === "string" ? type.toUpperCase() === "STUDENT" : false;

        if (!isStudent) {
          setInvalidMessage("This account does not have access to the Student Console.");
          setInvalidOpen(true);
        } else {
          login(payload.accessToken, payload.user);
          setTimeout(() => {
            router.push(payload.redirectTo || "/dashboard");
          }, 100);
        }
      } else {
        throw new Error(response.message || "OTP verification failed");
      }
    } catch (error: any) {
      let errorMessage = "Invalid OTP. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || "Invalid or expired OTP.";
      } else if (error.response?.status === 401) {
        errorMessage = "OTP has expired. Please request a new one.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setInvalidMessage(errorMessage);
      setInvalidOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setIsLoading(true);

    try {
      const email = `${uid}@thebges.edu.in`;
      const response = await sendOtpRequest(email);

      if (response.httpStatusCode === 200) {
        setOtpExpiry(180); // Reset to 3 minutes
        setResendCooldown(30); // Reset cooldown
        setOtp(""); // Clear current OTP
      } else {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      console.log(error);
      let errorMessage = "Failed to resend OTP. Please try again.";

      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait before trying again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetOtpFlow = () => {
    setError("");
    setOtpSent(false);
    setOtp("");
    setUid("");
    setOtpExpiry(0);
    setResendCooldown(0);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-950 to-indigo-900 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-950 to-indigo-900 px-4 py-6 sm:px-6">
      {/* Invalid user / credentials dialog */}
      <Dialog open={invalidOpen} onOpenChange={setInvalidOpen}>
        <DialogContent>
          <DialogHeader>
            <h3 className="text-lg font-semibold">Unable to sign in</h3>
            <p className="text-sm text-gray-600">{invalidMessage || "Something went wrong while signing in."}</p>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Floating card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex w-full max-w-md md:max-w-5xl overflow-hidden rounded-2xl shadow-2xl bg-white/0 md:bg-transparent flex-col md:flex-row"
      >
        {/* Left section */}
        <div className="w-full bg-white p-6 sm:p-8 md:w-1/2 md:p-12">
          <div className="mb-8 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                BESC <span className="text-indigo-600">Student</span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500">CONSOLE</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {otpSent ? "Enter OTP" : "Sign in with UID"}
            </h2>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-600 text-center md:text-left sm:whitespace-nowrap">
              {otpSent ? `OTP sent to ${uid}@thebges.edu.in` : "Enter your 10-digit UID to receive OTP"}
            </p>
          </div>

          <form onSubmit={otpSent ? handleOtpSubmit : handleUidSubmit} className="mt-6 space-y-5 sm:space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {otpSent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Enter the 6-digit OTP sent to your email
                  </label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {otpExpiry > 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">OTP expires in {formatTime(otpExpiry)}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="uid" className="block text-sm font-medium text-gray-700">
                    UID (10 digits)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <Input
                      id="uid"
                      placeholder="Enter your 10-digit UID"
                      value={uid}
                      onChange={(e) => setUid(formatUid(e.target.value))}
                      className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm h-11 text-center tracking-widest"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send OTP to {uid ? `${uid}@thebges.edu.in` : "your email"}
                  </p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={
                isLoading || (!otpSent && uid.length !== 10) || (otpSent && (otp.length !== 6 || otpExpiry === 0))
              }
              className="w-full rounded-md bg-indigo-600 py-3 text-base sm:text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="ml-2">{otpSent ? "Verifying..." : "Sending OTP..."}</span>
                </div>
              ) : (
                <span>{otpSent ? "Verify OTP" : "Send OTP"}</span>
              )}
            </motion.button>

            {otpSent && (
              <div className="flex items-center justify-center text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </Button>
              </div>
            )}
          </form>

          <div className="mt-4">
            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Contact administration
              </Link>
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="hidden w-1/2 md:block">
          <div className="relative h-full w-full">
            <img
              src={`${process.env.NEXT_PUBLIC_URL!}/hero-image.jpeg`}
              alt="Descriptive alt text"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
