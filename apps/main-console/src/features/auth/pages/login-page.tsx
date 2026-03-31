// import React, { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Eye, EyeOff, Lock, User } from "lucide-react";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Link, useNavigate } from "react-router-dom";
// import { useMutation } from "@tanstack/react-query";
// import { motion } from "framer-motion";
// import { login } from "@/services/auth";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import DottedSeparator from "@/components/ui/dotted-separator";
// import { FcGoogle } from "react-icons/fc";
// import { useSettings } from "@/providers/SettingsProvider";

// const LoginPage = () => {
//   const navigate = useNavigate();
//   const { settings } = useSettings();
//   const [showPassword, setShowPassword] = useState(false);
//   const [credential, setCredential] = useState({ email: "", password: "" });

//   useEffect(() => {}, [settings]);

//   const loginMutation = useMutation({
//     mutationFn: login,
//     onSuccess: (data) => {
//       console.log("Login successful:", data.payload);
//       localStorage.setItem("token", data.payload.accessToken);
//       navigate("/dashboard", { replace: true });
//     },
//   });

//   const togglePasswordVisibility = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setShowPassword(!showPassword);
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setCredential({ ...credential, [name]: value });
//   };

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (credential.email.trim() === "" || credential.password.trim() === "") {
//       alert("Please fill in all fields.");
//       return;
//     }

//     loginMutation.mutate(credential);
//   };

//   const handleGoogleLogin = async () => {};

//   return (
//     <div className="h-screen flex items-center justify-center">
//       <div className="w-1/2 bg-gradient-to-br from-gray-900 overflow-y-auto via-slate-800 to-indigo-900 h-full relative shadow-2xl overflow-hidden flex flex-col gap-8 items-center">
//         <div className="flex gap-4 bg w-full">
//           <motion.div
//             initial={{ scale: 0, rotate: -180 }}
//             animate={{ scale: 1, rotate: 0 }}
//             transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
//             className="inline-flex items-center space-x-4 w-full  bg-white/10 backdrop-blur-xl p-6 shadow-2xl shadow-blue-500/20 border border-white/10"
//           >
//             <Avatar className="h-16 w-16 shadow-lg ">
//               <AvatarImage
//                 src={`${import.meta.env.VITE_APP_BACKEND_URL!}/api/v1/settings/file/${settings?.find((ele) => ele.name == "College Logo Image")?.id}`}
//                 alt="BESC Logo"
//               />
//               <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
//                 {settings?.find((ele) => ele.name === "College Abbreviation")?.value}
//               </AvatarFallback>
//             </Avatar>
//             <div className="text-left">
//               <Badge variant="outline" className="text-sm font-bold text-blue-900 bg-blue-50 border-blue-200 mb-2">
//                 {settings.find((ele) => ele.name === "College Abbreviation")?.value}
//               </Badge>
//               <h1 className="text-3xl font-bold text-white leading-tight">
//                 {settings.find((ele) => ele.name === "College Name")?.value}
//               </h1>
//             </div>
//           </motion.div>
//         </div>
//         <Card className="w-[70%]">
//           <CardHeader>
//             <CardTitle>
//               <div className="flex items-center justify-center gap-3 mb-4">
//                 <div className="bg-purple-600/80 p-2 rounded-xl shadow-lg md:bg-purple-600 lg:bg-purple-600">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-6 w-6 text-white"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
//                   </svg>
//                 </div>
//                 <span className="text-xl sm:text-2xl font-extrabold md:text-purple-600 lg:text-purple-600">
//                   academic360
//                 </span>
//               </div>
//             </CardTitle>
//             <h3 className="font-extrabold text-center text-3xl">Welcome Back!</h3>
//             <p className="text-center">Please login to continue</p>
//             <DottedSeparator />
//           </CardHeader>
//           <CardContent className="">
//             <form onSubmit={handleSubmit} className="grid gap-6">
//               <div className="grid gap-5">
//                 <div className="space-y-2">
//                   <label htmlFor="email" className="text-sm font-medium text-white lg:text-gray-700">
//                     Email
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
//                       <User className="h-4 w-4 text-purple-200 lg:text-gray-400 md:text-gray-400" />
//                     </div>
//                     <Input
//                       id="email"
//                       name="email"
//                       type="email"
//                       value={credential.email}
//                       onChange={handleChange}
//                       className="pl-10 h-11 bg-white/10 border-white/20 text-white rounded-lg placeholder:text-purple-200 lg:bg-white lg:border-gray-200 lg:text-gray-900 lg:placeholder:text-gray-400 md:bg-white md:border-gray-200 md:text-gray-900 md:placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
//                       placeholder="Enter your email"
//                     />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center mb-2">
//                     <label
//                       htmlFor="password"
//                       className="text-sm font-medium text-white md:text-gray-700 lg:text-gray-700"
//                     >
//                       Password
//                     </label>
//                   </div>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
//                       <Lock className="h-4 w-4 text-purple-200 md:text-gray-400 lg:text-gray-400" />
//                     </div>
//                     <Input
//                       id="password"
//                       name="password"
//                       type={showPassword ? "text" : "password"}
//                       value={credential.password}
//                       onChange={handleChange}
//                       className="pl-10 rounded-lg pr-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-purple-200 lg:bg-white lg:border-gray-200 lg:text-gray-900 lg:placeholder:text-gray-400  md:bg-white md:border-gray-200 md:text-gray-900 md:placeholder:text-gray-400 "
//                       placeholder="Enter your password"
//                     />
//                     <button
//                       type="button"
//                       className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer focus:outline-none"
//                       onClick={togglePasswordVisibility}
//                       aria-label={showPassword ? "Hide password" : "Show password"}
//                       tabIndex={0}
//                     >
//                       {showPassword ? (
//                         <EyeOff className="h-4 w-4 text-purple-200 hover:text-white lg:text-gray-400 lg:hover:text-gray-500 md:text-gray-400 md:hover:text-gray-500 transition-colors" />
//                       ) : (
//                         <Eye className="h-4 w-4 text-purple-200 hover:text-white lg:text-gray-400 lg:hover:text-gray-500 md:text-gray-400 md:hover:text-gray-500 transition-colors" />
//                       )}
//                     </button>
//                   </div>
//                   <div className="flex justify-end mt-2">
//                     <a
//                       href="#"
//                       className="text-sm text-purple-300 hover:text-purple-200 lg:text-purple-600 lg:hover:text-purple-700 md:text-purple-600 md:hover:text-purple-700 transition-colors"
//                     >
//                       Forgot password?
//                     </a>
//                   </div>
//                 </div>

//                 <Button
//                   type="submit"
//                   className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-sm font-medium shadow-lg"
//                   disabled={loginMutation.isLoading}
//                 >
//                   {loginMutation.isLoading ? "Signing in..." : "Sign in"}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//           {
//             <div className="w-full flex flex-col items-center gap-6 pb-6 px-7">
//               <div className="flex">
//                 <DottedSeparator />
//                 <p>Or</p>
//                 <DottedSeparator />
//               </div>
//               <a
//                 href={
//                   settings.find((ele) => ele.name === "GOOGLE_CLIENT_ID")?.value
//                     ? `${import.meta.env.VITE_APP_BACKEND_URL!}/auth/google`
//                     : "#"
//                 }
//                 className="cursor-pointer hover:bg-gray-100 w-full flex justify-center gap-3 items-center border p-2"
//                 onClick={handleGoogleLogin}
//               >
//                 <FcGoogle className="size-8" />
//                 Continue with Google
//               </a>

//               <p className="text-sm text-center text-purple-200 md:text-gray-500 lg:text-gray-500">
//                 Don't have an account?{" "}
//                 <Link
//                   to="#"
//                   className="text-white hover:text-purple-200 lg:text-purple-600 lg:hover:text-purple-700 md:text-purple-600 md:hover:text-purple-700 transition-colors"
//                 >
//                   Contact administration
//                 </Link>
//               </p>
//             </div>
//           }
//         </Card>

//         <p className="text-white absolute bottom-0 pb-4">All Rights Reserved. @2025</p>
//       </div>
//       <div className="w-1/2 h-full">
//         <img
//           src={`${import.meta.env.VITE_APP_BACKEND_URL!}/api/v1/settings/file/${settings?.find((ele) => ele.name == "Login Screen Image")?.id}`}
//           alt="Background"
//           className="w-full h-full object-cover"
//         />
//       </div>
//     </div>
//   );
// };

// export default LoginPage;

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { login } from "@/features/auth/services/auth-service";
import { Badge } from "@/components/ui/badge";
import { FcGoogle } from "react-icons/fc";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useAuth } from "../hooks/use-auth";

const LoginPage = () => {
  const { accessToken, isReady } = useAuth();
  const { settings } = useSettings();

  // All hooks must be called before any conditional returns
  useEffect(() => {}, [settings]);

  // Show loading animation only if:
  // 1. Auth check is still in progress (!isReady), OR
  // 2. User is authenticated (accessToken exists) - will redirect to dashboard
  // Don't show loading if auth check is done and no token (user logged out)
  // Simplify: show loading if not ready OR if we have a token
  if (!isReady || accessToken) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-[60px] h-[60px]">
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "36",
                  "--translation": "150",
                  "--delay": "0.1",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "72",
                  "--translation": "150",
                  "--delay": "0.2",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "108",
                  "--translation": "150",
                  "--delay": "0.3",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "144",
                  "--translation": "150",
                  "--delay": "0.4",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "180",
                  "--translation": "150",
                  "--delay": "0.5",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "216",
                  "--translation": "150",
                  "--delay": "0.6",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "252",
                  "--translation": "150",
                  "--delay": "0.7",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "288",
                  "--translation": "150",
                  "--delay": "0.8",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "324",
                  "--translation": "150",
                  "--delay": "0.9",
                } as React.CSSProperties
              }
            ></div>
            <div
              className="absolute w-1/2 h-[150%] bg-[#722bab] rounded-sm [transform:rotate(calc(var(--rotation)*1deg))_translate(0,calc(var(--translation)*1%))] animate-[spinner-fzua35_1s_calc(var(--delay)*1s)_infinite_ease]"
              style={
                {
                  "--rotation": "360",
                  "--translation": "150",
                  "--delay": "1",
                } as React.CSSProperties
              }
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 text-white">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex gap-4 w-full">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="inline-flex items-center space-x-4 w-full bg-white/10 backdrop-blur-xl p-6 shadow-2xl shadow-blue-500/20 border border-white/10"
            >
              <Avatar className="h-16 w-16 shadow-lg">
                <AvatarImage
                  src={`${import.meta.env.VITE_APP_BACKEND_URL}/api/v1/settings/file/${settings?.find((ele) => ele.name == "College Logo Image")?.id}`}
                  alt="BESC Logo"
                />
                <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {settings?.find((ele) => ele.name === "College Abbreviation")?.value}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <Badge
                  variant="outline"
                  className="text-sm font-bold text-blue-900 bg-blue-50 border-blue-200 mb-2"
                >
                  {settings.find((ele) => ele.name === "College Abbreviation")?.value}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {settings.find((ele) => ele.name === "College Name")?.value}
                </h1>
              </div>
            </motion.div>
          </div>
          {/* <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-white">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a> */}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={`${import.meta.env.VITE_APP_BACKEND_URL}/api/v1/settings/file/${settings?.find((ele) => ele.name == "Login Screen Image")?.id}`}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};

export default LoginPage;

import { cn } from "@/lib/utils";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { login: loginProvider } = useAuth();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login successful:", data.payload);
      loginProvider(data.payload.accessToken, data.payload.user);
      navigate("/dashboard", { replace: true });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      const errorMessage = error?.message || "Login failed. Please try again.";
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  const togglePasswordVisibility = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance">Enter your email below to login to your account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="me@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginMutation.isLoading}
            className="text-gray-900 bg-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isLoading}
              className="text-gray-900 bg-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800 focus:outline-none"
              disabled={loginMutation.isLoading}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field>
          <Button type="submit" disabled={loginMutation.isLoading} className="w-full">
            {loginMutation.isLoading ? "Signing in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button variant="outline" type="button">
            <a
              href={
                settings.find((ele) => ele.name === "GOOGLE_CLIENT_ID")?.value
                  ? `${import.meta.env.VITE_APP_BACKEND_URL}/auth/google`
                  : "#"
              }
              className="text-black cursor-pointer hover:bg-gray-100 w-full flex justify-center gap-3 items-center p-2 rounded"
            >
              <FcGoogle className="size-6" />
              Continue with Google
            </a>
          </Button>
          <FieldDescription className="text-center text-white">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4 hover:text-white">
              Contact administration
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
