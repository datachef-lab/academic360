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
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { login } from "@/features/auth/services/auth-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DottedSeparator from "@/components/ui/dotted-separator";
import { FcGoogle } from "react-icons/fc";
import { useSettings } from "@/features/settings/providers/settings-provider";

const LoginPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [credential, setCredential] = useState({ email: "", password: "" });

  useEffect(() => {}, [settings]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login successful:", data.payload);
      localStorage.setItem("token", data.payload.accessToken);
      navigate("/dashboard", { replace: true });
    },
  });

  const togglePasswordVisibility = (e: React.FormEvent<HTMLButtonElement>) => {
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

  return (
    <div className="h-screen flex flex-col md:flex-row items-center justify-center">
      {/* Left Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 h-full relative shadow-2xl flex flex-col gap-8 items-center overflow-y-auto">
        {/* Logo & Title */}
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
              <Badge variant="outline" className="text-sm font-bold text-blue-900 bg-blue-50 border-blue-200 mb-2">
                {settings.find((ele) => ele.name === "College Abbreviation")?.value}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {settings.find((ele) => ele.name === "College Name")?.value}
              </h1>
            </div>
          </motion.div>
        </div>

        {/* Login Card */}
        <Card className="w-[90%] md:w-[70%]">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-purple-600/80 p-2 rounded-xl shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-purple-600">academic360</span>
              </div>
            </CardTitle>
            <h3 className="font-extrabold text-center text-2xl md:text-3xl">Welcome Back!</h3>
            <p className="text-center text-sm md:text-base">Please login to continue</p>
            <DottedSeparator />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-white">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 dark:text-purple-200" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={credential.email}
                    onChange={handleChange}
                    className="pl-10 h-11"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 dark:text-purple-200" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={credential.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-sm font-medium shadow-lg"
                disabled={loginMutation.isLoading}
              >
                {loginMutation.isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Google Login */}
            <div className="w-full flex flex-col items-center gap-4 mt-6">
              <div className="flex items-center w-full">
                <DottedSeparator className="flex-1" />
                <p className="px-2 text-sm">Or</p>
                <DottedSeparator className="flex-1" />
              </div>
              <a
                href={
                  settings.find((ele) => ele.name === "GOOGLE_CLIENT_ID")?.value
                    ? `${import.meta.env.VITE_APP_BACKEND_URL}/auth/google`
                    : "#"
                }
                className="cursor-pointer hover:bg-gray-100 w-full flex justify-center gap-3 items-center border p-2 rounded"
                onClick={handleGoogleLogin}
              >
                <FcGoogle className="size-6" />
                Continue with Google
              </a>
            </div>

            {/* Register */}
            <p className="text-sm text-center mt-4">
              Don't have an account?{" "}
              <Link to="#" className="text-purple-600 hover:text-purple-700">
                Contact administration
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-white text-xs md:text-sm absolute bottom-0 pb-4">All Rights Reserved. @2025</p>
      </div>

      {/* Right Section (Image) */}
      <div className="hidden md:block w-1/2 h-full">
        <img
          src={`${import.meta.env.VITE_APP_BACKEND_URL}/api/v1/settings/file/${settings?.find((ele) => ele.name == "Login Screen Image")?.id}`}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
