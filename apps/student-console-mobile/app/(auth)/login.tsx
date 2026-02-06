import { heroImage } from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { checkOtpStatus, lookupUser, sendOtpRequest, verifyOtpAndLogin } from "@/lib/auth-service";
import { getOnboardingCompleted } from "@/lib/onboarding-storage";
import { useAuth } from "@/providers/auth-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LogIn, User } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiBaseUrl } from "@/lib/api";

// Web student console theme colors (indigo gradient, purple accent)
const WEB_BG_TOP = "#1e1b4b"; // indigo-950
const WEB_BG_BOTTOM = "#312e81"; // indigo-900
const WEB_ACCENT = "#4f46e5"; // indigo-600

const OTP_EXPIRY_KEY = "otp_expiry_timestamp";
const OTP_UID_KEY = "otp_uid";
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;

const formatUid = (value: string) => value.replace(/\D/g, "").slice(0, 10);

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function LoginScreen() {
  useTheme(); // Keep for provider context; theme uses web colors below
  const { login, user, accessToken, tryRefresh } = useAuth();
  const [uid, setUid] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userPreview, setUserPreview] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const otpInputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  const uidInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const errorContainerRef = useRef<View>(null);
  const errorYPosition = useRef<number>(0);

  // Match web student console theme (indigo/purple)
  const accentColor = WEB_ACCENT;
  const bgColor = WEB_BG_BOTTOM;
  const cardBg = "#FFFFFF";
  const textColor = "#111827"; // gray-900
  const textSecondaryColor = "#6b7280"; // gray-500
  const inputBg = "rgba(0,0,0,0.05)";
  const borderColor = "rgba(0,0,0,0.15)";

  const clearOtpStorage = useCallback(async () => {
    await AsyncStorage.multiRemove([OTP_EXPIRY_KEY, OTP_UID_KEY]);
  }, []);

  // Guard: redirect to onboarding if not completed (login is only reachable after onboarding)
  useEffect(() => {
    let cancelled = false;
    const checkOnboarding = async () => {
      const completed = await getOnboardingCompleted();
      if (!cancelled && !completed) {
        router.replace("/");
      }
    };
    void checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, []);

  // On mount: try to refresh token; if we have valid auth, redirect to console
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        // First check in-memory state
        if (accessToken && user?.type === "STUDENT") {
          if (!cancelled) router.replace("/console");
          return;
        }
        // Try refresh (e.g. stored token from previous session)
        const result = await tryRefresh();
        if (!cancelled && result.token && result.user?.type === "STUDENT") {
          router.replace("/console");
        }
      } catch (error) {
        console.error("[Login] Auth check error:", error);
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    };
    void checkAuth();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to avoid loops

  // Restore OTP state on mount
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const [storedUid, expiryVal] = await AsyncStorage.multiGet([OTP_UID_KEY, OTP_EXPIRY_KEY]);
        const stored = storedUid?.[1];
        const expiry = expiryVal?.[1] ? parseInt(expiryVal[1], 10) : 0;
        if (!stored) return;

        const email = `${stored}@thebges.edu.in`;
        const response = await checkOtpStatus(email);
        if (response.httpStatusCode === 200 && response.payload?.hasValidOtp && response.payload?.expiresAt) {
          const now = Date.now();
          const expiryTime = new Date(response.payload.expiresAt).getTime();
          const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
          if (remaining > 0 && !cancelled) {
            setUid(stored);
            setOtpSent(true);
            setOtpExpiry(Math.min(remaining, OTP_EXPIRY_SECONDS));
          } else {
            await clearOtpStorage();
          }
        } else {
          await clearOtpStorage();
        }
      } catch {
        await clearOtpStorage();
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [clearOtpStorage]);

  // User lookup when UID changes
  useEffect(() => {
    const digits = uid.replace(/\D/g, "");
    if (digits.length < 10) {
      setUserPreview(null);
      setLookupPending(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLookupPending(true);
        const email = `${digits}@thebges.edu.in`;
        const resp = await lookupUser(email);
        if (resp.httpStatusCode === 200 && resp.payload?.name) {
          setUserPreview({ name: resp.payload.name, email });
        } else {
          setUserPreview(null);
        }
      } catch (err) {
        console.error("[Login] User lookup failed:", err);
        setUserPreview(null);
      } finally {
        setLookupPending(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [uid]);

  // OTP expiry countdown
  useEffect(() => {
    if (otpExpiry <= 0) return;
    const timer = setTimeout(() => {
      setOtpExpiry((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpExpiry]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-scroll to error message when error appears
  useEffect(() => {
    if (error) {
      // Give time for error container to render and measure its position
      // The onLayout handler will handle the actual scrolling with accurate position
      setTimeout(() => {
        // Fallback scroll if onLayout hasn't fired yet (shouldn't happen, but safety net)
        if (errorYPosition.current === 0) {
          scrollViewRef.current?.scrollTo({
            y: 400,
            animated: true,
          });
        }
      }, 200);
    } else {
      // Reset position when error is cleared
      errorYPosition.current = 0;
    }
  }, [error]);

  const handleSendOtp = async () => {
    setError(null);
    const digits = uid.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit UID");
      return;
    }
    setIsLoading(true);
    try {
      const email = `${digits}@thebges.edu.in`;
      const response = await sendOtpRequest(email);
      if (response.httpStatusCode === 200) {
        setOtpSent(true);
        setOtpExpiry(OTP_EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        await AsyncStorage.setItem(OTP_UID_KEY, digits);
        await AsyncStorage.setItem(OTP_EXPIRY_KEY, String(Date.now() + OTP_EXPIRY_SECONDS * 1000));
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const digits = uid.replace(/\D/g, "");
      const email = `${digits}@thebges.edu.in`;
      const response = await verifyOtpAndLogin(email, otpString);
      if (response.httpStatusCode === 200 && response.payload) {
        const { accessToken: token, user: userData, refreshToken } = response.payload;
        if (!token || !userData) {
          setError("Invalid response from server.");
          return;
        }
        if ((userData as { type?: string }).type !== "STUDENT") {
          setError("Only student accounts can sign in here.");
          return;
        }
        await clearOtpStorage();
        await login(token, userData, refreshToken);
        // Use push instead of replace to get slide animation
        router.push("/console");
      } else {
        throw new Error(response.message || "OTP verification failed");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? "Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      const digits = uid.replace(/\D/g, "");
      const email = `${digits}@thebges.edu.in`;
      const response = await sendOtpRequest(email);
      if (response.httpStatusCode === 200) {
        setOtpExpiry(OTP_EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        await AsyncStorage.setItem(OTP_EXPIRY_KEY, String(Date.now() + OTP_EXPIRY_SECONDS * 1000));
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } else {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUid = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpExpiry(0);
    setResendCooldown(0);
    setError(null);
    void clearOtpStorage();
  };

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste - if value is longer than 1, it's definitely a paste
    // This can happen when user pastes into any input box
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);
      // Focus the last filled input or the last input
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      setTimeout(() => {
        otpInputRefs[lastFilledIndex].current?.focus();
        // Blur after a moment to close keyboard if all filled
        if (digits.length === 6) {
          setTimeout(() => otpInputRefs[lastFilledIndex].current?.blur(), 100);
        }
      }, 50);
      return;
    }

    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input if digit entered
    if (digit && index < 5) {
      setTimeout(() => otpInputRefs[index + 1].current?.focus(), 50);
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    // Handle backspace on empty input - move to previous and clear it
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      setTimeout(() => otpInputRefs[index - 1].current?.focus(), 50);
    }
  };

  const handleOtpFocus = (index: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 240,
        animated: true,
      });
    }, 100);
  };

  const handleOtpBlur = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  const digits = uid.replace(/\D/g, "");
  const canSendOtp = digits.length === 10 && userPreview && !otpSent;
  const otpString = otp.join("");
  const canVerifyOtp = otpSent && otpString.length === 6 && otpExpiry > 0;

  if (isCheckingAuth) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={accentColor} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} className="flex-1" style={{ backgroundColor: bgColor }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            scrollEnabled={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: Platform.OS === "web" ? 400 : 320,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Cover section - hero illustration (preserves aspect ratio, no distortion) */}
            <View
              style={{
                width: "100%",
                height: 220,
                backgroundColor: WEB_BG_TOP,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={heroImage}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                accessibilityLabel="College campus illustration"
              />
            </View>

            {/* Form card */}
            <View className="px-6 pt-6 pb-8 rounded-t-3xl" style={{ backgroundColor: cardBg }}>
              {/* Header */}
              <View className="items-center mb-8">
                <View
                  className="items-center justify-center rounded-lg mb-4"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: `${accentColor}20`,
                  }}
                >
                  <LogIn size={28} color={accentColor} strokeWidth={2} />
                </View>
                <Text style={{ color: textColor }} className="text-2xl font-bold text-center">
                  {otpSent ? "Enter OTP" : "Sign in with UID"}
                </Text>
                <Text style={{ color: textSecondaryColor }} className="text-base text-center mt-2">
                  {otpSent ? `OTP sent to ${digits}@thebges.edu.in` : "Enter your 10-digit UID to receive OTP"}
                </Text>
              </View>

              {/* Form */}
              <View className="gap-4">
                <Text>{getApiBaseUrl()}</Text>
                {otpSent ? (
                  <>
                    {/* OTP Input - 6 separate digit boxes */}
                    <View>
                      <Text style={{ color: textSecondaryColor }} className="text-sm mb-3">
                        Enter the 6-digit OTP sent to your email
                      </Text>
                      <View className="flex-row gap-2 justify-center">
                        {/* Hidden input for paste - positioned off-screen */}
                        <TextInput
                          style={{
                            position: "absolute",
                            opacity: 0,
                            width: 1,
                            height: 1,
                            zIndex: -1,
                          }}
                          value=""
                          onChangeText={(value) => {
                            // When paste happens in hidden input, distribute to OTP boxes
                            if (value.length >= 1) {
                              const digits = value.replace(/\D/g, "").slice(0, 6);
                              const newOtp = ["", "", "", "", "", ""];
                              for (let i = 0; i < 6; i++) {
                                newOtp[i] = digits[i] || "";
                              }
                              setOtp(newOtp);
                              if (digits.length === 6) {
                                setTimeout(() => {
                                  otpInputRefs[5].current?.blur();
                                }, 100);
                              }
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                        {otp.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={otpInputRefs[index]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(index, value)}
                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                            placeholder=""
                            placeholderTextColor={textSecondaryColor}
                            keyboardType="number-pad"
                            maxLength={index === 0 ? 6 : 1}
                            editable={!isLoading}
                            selectTextOnFocus={index === 0}
                            className="rounded-xl text-center text-2xl font-semibold"
                            style={{
                              width: 48,
                              height: 56,
                              backgroundColor: inputBg,
                              color: textColor,
                              borderWidth: 1,
                              borderColor: digit ? accentColor : borderColor,
                            }}
                            onFocus={() => handleOtpFocus(index)}
                            onBlur={handleOtpBlur}
                          />
                        ))}
                      </View>
                      {otpExpiry > 0 && (
                        <Text style={{ color: textSecondaryColor }} className="text-xs text-center mt-2">
                          OTP expires in {formatTime(otpExpiry)}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      onPress={handleVerifyOtp}
                      disabled={isLoading || !canVerifyOtp}
                      className="rounded-xl py-4 items-center justify-center active:opacity-90"
                      style={{
                        backgroundColor: canVerifyOtp ? accentColor : inputBg,
                        opacity: canVerifyOtp ? 1 : 0.6,
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text
                          style={{
                            color: canVerifyOtp ? "#FFFFFF" : textSecondaryColor,
                          }}
                          className="text-lg font-bold"
                        >
                          Verify OTP
                        </Text>
                      )}
                    </Pressable>

                    <View className="flex-row justify-between items-center">
                      <Pressable onPress={handleChangeUid} className="py-2">
                        <Text style={{ color: accentColor }} className="text-sm font-medium">
                          Change UID
                        </Text>
                      </Pressable>
                      {otpExpiry === 0 && (
                        <Pressable
                          onPress={handleResendOtp}
                          disabled={resendCooldown > 0 || isLoading}
                          className="py-2"
                        >
                          <Text
                            style={{
                              color: resendCooldown > 0 ? textSecondaryColor : accentColor,
                            }}
                            className="text-sm font-medium"
                          >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    {/* UID Input */}
                    <View>
                      <Text style={{ color: textSecondaryColor }} className="text-sm mb-2">
                        Enter Your UID (10 Digits)
                      </Text>
                      <View
                        className="flex-row items-center rounded-xl px-4"
                        style={{
                          backgroundColor: inputBg,
                          borderWidth: 1,
                          borderColor,
                        }}
                      >
                        <User size={20} color={textSecondaryColor} style={{ marginRight: 12 }} />
                        <TextInput
                          ref={uidInputRef}
                          value={uid}
                          onChangeText={(v) => setUid(formatUid(v))}
                          placeholder="ENTER 10 DIGIT UID HERE"
                          placeholderTextColor={textSecondaryColor}
                          keyboardType="number-pad"
                          maxLength={10}
                          editable={!isLoading}
                          className="flex-1 py-3 text-base"
                          style={{ color: textColor }}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({
                                y: 180,
                                animated: true,
                              });
                            }, 100);
                          }}
                          onBlur={() => {
                            scrollViewRef.current?.scrollTo({
                              y: 0,
                              animated: true,
                            });
                          }}
                        />
                      </View>
                    </View>

                    {/* User preview */}
                    <View
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.03)",
                        borderWidth: 1,
                        borderColor,
                      }}
                    >
                      {lookupPending ? (
                        <View className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color={accentColor} />
                          <Text style={{ color: textSecondaryColor }} className="text-sm text-center ml-2">
                            Looking up user...
                          </Text>
                        </View>
                      ) : userPreview ? (
                        <View>
                          <Text style={{ color: textColor }} className="font-semibold text-center">
                            {userPreview.name.toUpperCase()}
                          </Text>
                          <Text style={{ color: textSecondaryColor }} className="text-xs text-center mt-1">
                            OTP will be sent to {userPreview.email}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: textSecondaryColor }} className="text-sm text-center">
                          {digits.length === 10 ? "User not found or network error" : "Waiting for you to enter UID"}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      onPress={handleSendOtp}
                      disabled={isLoading || !canSendOtp}
                      className="rounded-xl py-4 items-center justify-center active:opacity-90"
                      style={{
                        backgroundColor: canSendOtp ? accentColor : inputBg,
                        opacity: canSendOtp ? 1 : 0.6,
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text
                          style={{
                            color: canSendOtp ? "#FFFFFF" : textSecondaryColor,
                          }}
                          className="text-lg font-bold"
                        >
                          Send OTP
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}

                {error ? (
                  <View
                    ref={errorContainerRef}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      errorYPosition.current = y;
                      // If error just appeared, scroll to it immediately
                      if (error) {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, y - 50),
                            animated: true,
                          });
                        }, 100);
                      }
                    }}
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "rgba(220,38,38,0.1)",
                    }}
                  >
                    <Text style={{ color: "#dc2626" }} className="text-sm">
                      {error}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
