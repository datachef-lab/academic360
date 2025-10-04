"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

import { doLogin } from "@/lib/services/auth.service";
import { UserDto } from "@repo/db/dtos/user";

export default function SignInPage() {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invalidOpen, setInvalidOpen] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await doLogin(credentials.email, credentials.password);

      if (response.httpStatusCode === 200) {
        const payload = response.payload as { accessToken: string; user: UserDto; redirectTo?: string };
        console.log("Login payload:", payload);
        const type = (payload.user as any)?.userType || (payload.user as any)?.type || (payload.user as any)?.role;
        const isStudent = typeof type === "string" ? type.toUpperCase() === "STUDENT" : false;
        if (!isStudent) {
          // Do NOT proceed to dashboard; show invalid dialog
          setInvalidMessage("This account does not have access to the Student Console.");
          setInvalidOpen(true);
        } else {
          login(payload.accessToken, payload.user);
          // Add a small delay to ensure auth state is updated before redirect
          setTimeout(() => {
            router.push(payload.redirectTo || "/dashboard");
          }, 100);
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      let uiMessage = "Invalid credentials. Please check your UID and password.";
      let bannerMessage = uiMessage;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data: any = error.response?.data ?? {};
        const serverMsg: string | undefined = (data && (data.message || data.error)) as string | undefined;

        if (status === 403) {
          uiMessage = serverMsg || "Your account is disabled. Please contact support.";
          bannerMessage = uiMessage;
        } else if (status === 429) {
          uiMessage = serverMsg || "Too many login attempts. Please try again after a minute.";
          bannerMessage = uiMessage;
        } else if (status === 401) {
          uiMessage = serverMsg || "Invalid credentials. Please check your UID and password.";
          bannerMessage = uiMessage;
        } else if (serverMsg) {
          bannerMessage = serverMsg;
          uiMessage = serverMsg;
        } else if (error.message) {
          bannerMessage = error.message;
        }
      } else if (error instanceof Error && error.message) {
        bannerMessage = error.message;
      }

      setError(bannerMessage);
      setInvalidMessage(uiMessage);
      setInvalidOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-0"
      style={{ background: " #9333ea" }}
    >
      {/* Invalid user / credentials dialog */}
      <Dialog open={invalidOpen} onOpenChange={setInvalidOpen}>
        <DialogContent className="sm:max-w-md">
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
        className="relative z-10 flex w-full max-w-6xl overflow-hidden rounded-2xl shadow-2xl sm:flex-row flex-col"
      >
        {/* Left section */}
        <div className="w-full bg-white p-8 sm:p-10 md:w-1/2 md:p-16">
          <div className="mb-8 sm:mb-10 flex items-center justify-center sm:justify-start">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 sm:h-7 sm:w-7"
              >
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                BESC <span className="text-indigo-600">Student</span>
              </h1>
              <p className="text-xs font-medium text-gray-500">CONSOLE</p>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">Enter your credentials below to access the portal</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:space-y-8">
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
              <div>
                <label htmlFor="uid" className="block text-sm font-medium text-gray-700">
                  UID
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <Input
                    id="uid"
                    placeholder="Enter your UID"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-3 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="block w-full rounded-md border-gray-300 pl-10 pr-10 py-3 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clipRule="evenodd"
                        />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-indigo-600 py-3 px-4 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 sm:text-sm"
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
                  <span className="ml-2">Signing in...</span>
                </div>
              ) : (
                <span>Sign in</span>
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              Contact administration
            </Link>
          </p>
        </div>

        {/* Right section - Hidden on mobile, shown on desktop */}
        <div className="hidden w-1/2 bg-indigo-600 md:block">
          <div className="relative h-full w-full">
            <img
              src={`${process.env.NEXT_PUBLIC_URL!}/hero-image.jpeg`}
              alt="BESC College Students"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
