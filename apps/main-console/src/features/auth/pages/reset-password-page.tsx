import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import {
  requestPasswordReset,
  validateResetToken,
  resetPasswordWithToken,
} from "@/features/auth/services/reset-password.service";
import { resetPasswordWithEmailOtp } from "@/features/auth/services/reset-password.service";
import { verifyEmailOtp } from "@/features/auth/services/reset-password.service";
import { checkOtpStatus } from "@/features/auth/services/reset-password.service";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/features/settings/hooks/use-settings";

export default function ResetPasswordPage() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = searchParams.get("token") || "";
  const { settings } = useSettings();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatedEmail, setValidatedEmail] = useState<string | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number>(0);
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState<boolean>(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await validateResetToken(token);
        if (res.success) {
          setValidatedEmail(res.email || null);
        } else {
          setError(res.message || "Invalid or expired token");
        }
      } catch {
        setError("Failed to validate token");
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  const handleRequest = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) setSuccess("If the email exists and is eligible, an OTP has been sent.");
      else setError(res.message || "Failed to request reset");
      // Fetch remaining cooldown
      const status = await checkOtpStatus(email);
      if (status.success && typeof status.remainingTime === "number") {
        setOtpRemaining(status.remainingTime);
      }
    } catch {
      setError("Failed to request reset");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token) return;
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await resetPasswordWithToken(token, newPassword);
      if (res.success) setSuccess("Password has been reset. You may now sign in.");
      else setError(res.message || "Failed to reset password");
    } catch {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const isTokenFlow = Boolean(token);
  const [step, setStep] = useState<"EMAIL" | "OTP" | "RESET">(isTokenFlow ? "RESET" : "EMAIL");
  const isOtpFlow = !isTokenFlow;
  const resetComplete = (success || "").toLowerCase().includes("password has been reset");
  const [didAlert, setDidAlert] = useState<boolean>(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (resetComplete && !didAlert) {
      setDidAlert(true);
      setSuccessDialogOpen(true);
    }
  }, [resetComplete, didAlert]);

  // Countdown tick for OTP cooldown
  useEffect(() => {
    if (otpRemaining <= 0) return;
    const id = setInterval(() => setOtpRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [otpRemaining]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch justify-center">
      {/* Left Illustration */}
      <div className="hidden md:block md:w-1/2 md:h-auto">
        <img src="/reset-password.jpg" alt="Reset Password Illustration" className="w-full h-full object-cover" />
      </div>

      {/* Right Section (mirrors login) */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-gray-900 via-slate-800 to-indigo-900 min-h-screen md:min-h-[70vh] relative shadow-2xl flex flex-col gap-4 sm:gap-6 items-center overflow-y-auto">
        {/* Branding header - always at top */}
        <div className="flex gap-3 sm:gap-4 w-full px-3 sm:px-4 pt-4">
          <div className="inline-flex items-center space-x-3 sm:space-x-4 w-full bg-white/10 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-blue-500/20 border border-white/10 rounded-md">
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
                {settings?.find((ele) => ele.name === "College Abbreviation")?.value}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {settings?.find((ele) => ele.name === "College Name")?.value}
              </h1>
            </div>
          </div>
        </div>
        {/* Reset Card - vertically centered area */}
        <div className="flex-1 w-full flex items-start md:items-center justify-center px-3 sm:px-4 pb-8 md:pb-10">
          <Card className="w-full max-w-sm sm:max-w-md md:max-w-[70%]">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                  <div className="bg-purple-600/80 p-2 sm:p-2.5 rounded-xl shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.211 10.108a7.25 7.25 0 01-13.61 3.284l1.32-.758a5.75 5.75 0 101.14-6.41l1.14.65L3.5 8.75 2 3.75l1.75 1 .001-.001L7 7.25l-1.11.636a7.25 7.25 0 1111.321 2.222z" />
                    </svg>
                  </div>
                  <span className="text-lg sm:text-2xl font-extrabold text-purple-600">Reset Password</span>
                </div>
              </CardTitle>
              <h3 className="font-extrabold text-center text-xl sm:text-2xl md:text-3xl text-gray-900">
                {isTokenFlow ? "Set a new password" : "Reset your password"}
              </h3>
              <p className="text-center text-xs sm:text-sm md:text-base text-gray-600">
                Use the OTP sent to your email to verify and set a new password.
              </p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {isOtpFlow && (
                <div className="space-y-4">
                  {step === "EMAIL" && (
                    <>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          await handleRequest();
                          setStep("OTP");
                        }}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send OTP"
                        )}
                      </Button>
                    </>
                  )}

                  {step === "OTP" && (
                    <>
                      <div>
                        <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                          OTP
                        </label>
                        <div className="mt-2 w-full flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))}
                            className="flex justify-center"
                          >
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                              <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                              <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                              <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                              <InputOTPSlot index={4} className="w-12 h-12 text-xl" />
                              <InputOTPSlot index={5} className="w-12 h-12 text-xl" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!email || !otp) {
                            setError("Email and OTP are required");
                            return;
                          }
                          setLoading(true);
                          setError(null);
                          setSuccess(null);
                          try {
                            const res = await verifyEmailOtp(email, otp);
                            if (res.success) {
                              setSuccess("OTP verified");
                              setStep("RESET");
                            } else setError(res.message || "Invalid OTP");
                          } catch {
                            setError("Failed to verify OTP");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        {otpRemaining > 0 ? (
                          <>
                            Resend available in {String(Math.floor(otpRemaining / 60)).padStart(2, "0")}:
                            {String(otpRemaining % 60).padStart(2, "0")}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-purple-600 hover:text-purple-700 underline"
                            onClick={async () => {
                              await handleRequest();
                            }}
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {step === "RESET" && (
                    <>
                      <div>
                        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            id="newPassword"
                            type={showNewPwd ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                            placeholder="Minimum 8 characters"
                          />
                          <button
                            type="button"
                            aria-label={showNewPwd ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowNewPwd((s) => !s);
                            }}
                          >
                            {showNewPwd ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          Confirm Password
                        </label>
                        <div className="relative mt-1">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPwd ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10 h-11"
                          />
                          <button
                            type="button"
                            aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowConfirmPwd((s) => !s);
                            }}
                          >
                            {showConfirmPwd ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!email || !otp || !newPassword || !confirmPassword) {
                            setError("Email, OTP, new password and confirm password are required");
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            setError("Passwords do not match");
                            return;
                          }
                          if (newPassword.length < 8) {
                            setError("Password must be at least 8 characters");
                            return;
                          }
                          setLoading(true);
                          setError(null);
                          setSuccess(null);
                          try {
                            const res = await resetPasswordWithEmailOtp(email, otp, newPassword);
                            if (res.success) setSuccess("Password has been reset. You may now sign in.");
                            else setError(res.message || "Failed to reset password");
                          } catch {
                            setError("Failed to reset password");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading || resetComplete}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                      {resetComplete && (
                        <div className="text-center">
                          <Button
                            type="button"
                            className="mt-2"
                            onClick={() => {
                              window.location.href = "/";
                            }}
                          >
                            Back to Sign in
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {isTokenFlow && (
                <div className="space-y-4">
                  {validatedEmail && (
                    <div className="text-sm text-gray-600">
                      Resetting password for <span className="font-medium">{validatedEmail}</span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="newPassword"
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        placeholder="Minimum 8 characters"
                      />
                      <button
                        type="button"
                        aria-label={showNewPwd ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowNewPwd((s) => !s);
                        }}
                      >
                        {showNewPwd ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 h-11"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowConfirmPwd((s) => !s);
                        }}
                      >
                        {showConfirmPwd ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleReset}
                    disabled={loading || resetComplete}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                  {resetComplete && (
                    <div className="text-center">
                      <Button
                        type="button"
                        className="mt-2"
                        onClick={() => {
                          window.location.href = "/";
                        }}
                      >
                        Back to Sign in
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Success dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password reset successful</AlertDialogTitle>
            <AlertDialogDescription>
              Your password has been reset. You may now sign in with your new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setSuccessDialogOpen(false);
                window.location.href = "/";
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
