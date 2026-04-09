import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/features/auth/services/auth-service";
import { FcGoogle } from "react-icons/fc";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useAuth } from "../hooks/use-auth";
import { Label } from "@/components/ui/label";

const LOGIN_PRIMARY = "#802c5c";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: loginProvider, accessToken, isReady } = useAuth();
  const { settings } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [credential, setCredential] = useState({ email: "", password: "" });

  const loginScreenSrc = useMemo(() => {
    const fromEnv = import.meta.env.VITE_LOGIN_SCREEN_IMAGE_URL?.trim();
    if (fromEnv) return fromEnv;
    const backend = import.meta.env.VITE_APP_BACKEND_URL || "";
    const id = settings?.find((ele) => ele.name === "Login Screen Image")?.id;
    return id ? `${backend}/api/v1/settings/file/${id}` : "";
  }, [settings]);

  const collegeName = useMemo(() => {
    const fromEnv = import.meta.env.VITE_COLLEGE_NAME?.trim();
    if (fromEnv) return fromEnv;
    return settings?.find((ele) => ele.name === "College Name")?.value ?? "";
  }, [settings]);

  const collegeAbbrev = useMemo(() => {
    const fromEnv = import.meta.env.VITE_COLLEGE_ABBREVIATION?.trim();
    if (fromEnv) return fromEnv;
    return settings?.find((ele) => ele.name === "College Abbreviation")?.value ?? "";
  }, [settings]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login successful:", data.payload);
      loginProvider(data.payload.accessToken, data.payload.user);
      navigate("/dashboard", { replace: true });
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
    },
  });

  useEffect(() => {}, [settings]);

  if (!isReady || accessToken) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-[60px] h-[60px]">
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "36",
                  "--translation": "150",
                  "--delay": "0.1",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "72",
                  "--translation": "150",
                  "--delay": "0.2",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "108",
                  "--translation": "150",
                  "--delay": "0.3",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "144",
                  "--translation": "150",
                  "--delay": "0.4",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "180",
                  "--translation": "150",
                  "--delay": "0.5",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "216",
                  "--translation": "150",
                  "--delay": "0.6",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "252",
                  "--translation": "150",
                  "--delay": "0.7",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "288",
                  "--translation": "150",
                  "--delay": "0.8",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "324",
                  "--translation": "150",
                  "--delay": "0.9",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
            <div
              className="absolute w-1/2 h-[150%] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "360",
                  "--translation": "150",
                  "--delay": "1",
                  backgroundColor: LOGIN_PRIMARY,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredential({ ...credential, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!credential.email.trim() || !credential.password.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    loginMutation.mutate(credential);
  };

  const handleGoogleLogin = async () => {};

  const googleHref = settings?.find((ele) => ele.name === "GOOGLE_CLIENT_ID")?.value
    ? `${import.meta.env.VITE_APP_BACKEND_URL}/auth/google`
    : "#";

  const inputClass =
    "h-11 rounded-md border border-neutral-200 bg-white pl-10 font-sans text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:border-[#802c5c] focus-visible:ring-[#802c5c]/25";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left: hero image (env or settings file) */}
      <div className="relative w-full md:w-1/2 h-44 sm:h-56 md:h-auto md:min-h-screen shrink-0 bg-neutral-100">
        {loginScreenSrc ? (
          <img
            src={loginScreenSrc}
            alt={collegeName || "Campus"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col justify-start px-6 py-10 sm:px-10 md:px-14 lg:px-20">
        {(collegeName || collegeAbbrev) && (
          <div className="mx-auto mb-6 w-full max-w-[760px] text-center">
            <p className="whitespace-nowrap font-sans text-xl font-semibold tracking-wide text-black sm:text-2xl">
              {[collegeAbbrev, collegeName].filter(Boolean).join(" | ")}
            </p>
          </div>
        )}
        <div className="mx-auto w-full max-w-[400px]">
          <a
            href={googleHref}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
            onClick={handleGoogleLogin}
          >
            <FcGoogle className="size-5 shrink-0" />
            Continue with Google
          </a>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs font-sans text-neutral-500">
              <span className="bg-white px-3">or Sign in with Email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-serif text-base font-semibold text-neutral-900"
              >
                Email
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-neutral-400" />
                </span>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={credential.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter your email..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-serif text-base font-semibold text-neutral-900"
              >
                Password
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </span>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={credential.password}
                  onChange={handleChange}
                  className={inputClass + " pr-10"}
                  placeholder="Enter your password..."
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-700"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-1">
              <Link
                to="/reset-password"
                className="shrink-0 text-sm font-sans text-[#802c5c] hover:text-[#6d2450] underline-offset-2 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-md border-0 bg-[#802c5c] text-sm font-semibold text-white shadow-none hover:bg-[#6d2450]"
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link to="#" className="font-medium text-[#802c5c] hover:text-[#6d2450]">
              Contact administration
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-neutral-400">All Rights Reserved. @2026</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
