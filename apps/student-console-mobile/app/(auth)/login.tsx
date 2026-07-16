import { brandLogoUrl } from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { checkOtpStatus, lookupUser, sendOtpRequest, verifyOtpAndLogin } from "@/lib/auth-service";
import { getOnboardingCompleted } from "@/lib/onboarding-storage";
import { useAuth } from "@/providers/auth-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { User } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import googleLogo from "@/assets/images/google.png";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/ui/Button";

// Web student console theme colors (indigo gradient, purple accent)
const WEB_BG_TOP = "#1e1b4b"; // indigo-950
const WEB_BG_MID = "#312e81"; // indigo-900
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

function GoogleMark() {
  return <Image source={googleLogo} style={{ width: 20, height: 20 }} contentFit="contain" />;
}

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
  const accentColor = WEB_ACCENT; // brand indigo
  const bgColor = "#ffffff";
  const cardBg = "#FFFFFF";
  const textColor = "#1e293b";
  const textSecondaryColor = "#64748b";
  const inputBg = "#f1f5f9";
  const borderColor = "#e2e8f0";
  const insets = useSafeAreaInsets();

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
        if (
          response.httpStatusCode === 200 &&
          response.payload?.hasValidOtp &&
          response.payload?.expiresAt
        ) {
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

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google sign-in",
      "Google sign-in isn't set up yet. Please continue with your UID for now.",
    );
  };

  const digits = uid.replace(/\D/g, "");
  const canSendOtp = digits.length === 10 && userPreview && !otpSent;
  const otpString = otp.join("");
  const canVerifyOtp = otpSent && otpString.length === 6 && otpExpiry > 0;

  if (isCheckingAuth) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: bgColor }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View className="flex-1" style={{ backgroundColor: bgColor }}>
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
            {/* Branded gradient header */}
            <LinearGradient
              colors={[WEB_BG_TOP, WEB_BG_MID, accentColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingTop: insets.top + 30,
                paddingBottom: 56,
                paddingHorizontal: 24,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 22,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                <Image
                  source={{ uri: brandLogoUrl }}
                  style={{ width: 54, height: 54 }}
                  contentFit="contain"
                  accessibilityLabel="The Bhawanipur Education Society College"
                />
              </View>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 17,
                  fontWeight: "800",
                  textAlign: "center",
                  marginTop: 16,
                  lineHeight: 23,
                }}
              >
                The Bhawanipur Education{"\n"}Society College
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 11.5,
                  fontWeight: "700",
                  letterSpacing: 2,
                  marginTop: 8,
                }}
              >
                STUDENT PORTAL
              </Text>
            </LinearGradient>

            {/* Form card */}
            <View
              className="px-6 pt-4 rounded-t-3xl"
              style={{
                backgroundColor: cardBg,
                marginTop: -26,
                flex: 1,
                paddingBottom: insets.bottom + 24,
              }}
            >
              {/* grabber */}
              <View
                style={{
                  alignSelf: "center",
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#e2e8f0",
                  marginBottom: 18,
                }}
              />
              {/* Header */}
              <View className="items-center mb-6">
                <Text style={{ color: textColor }} className="text-2xl font-extrabold text-center">
                  {otpSent ? "Verify OTP" : "Welcome back"}
                </Text>
                <Text
                  style={{ color: textSecondaryColor }}
                  className="text-base text-center mt-2 px-2"
                >
                  {otpSent
                    ? `Enter the 6-digit code sent to ${userPreview?.email ?? `${digits}@thebges.edu.in`}`
                    : "Sign in to your BESC student account."}
                </Text>
              </View>

              {/* Form */}
              <View className="gap-4">
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
                            onKeyPress={({ nativeEvent }) =>
                              handleOtpKeyPress(index, nativeEvent.key)
                            }
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
                        <Text
                          style={{ color: textSecondaryColor }}
                          className="text-xs text-center mt-2"
                        >
                          OTP expires in {formatTime(otpExpiry)}
                        </Text>
                      )}
                    </View>

                    <Button
                      label="Verify OTP"
                      onPress={handleVerifyOtp}
                      variant="gradient"
                      size="lg"
                      accent={accentColor}
                      accentTo="#6366f1"
                      disabled={!canVerifyOtp}
                      loading={isLoading}
                      fullWidth
                    />

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
                    {/* Continue with Google */}
                    <Pressable
                      onPress={handleGoogleSignIn}
                      className="flex-row items-center justify-center rounded-xl active:opacity-80"
                      style={{
                        height: 52,
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        gap: 10,
                      }}
                    >
                      <GoogleMark />
                      <Text style={{ color: textColor, fontSize: 15.5, fontWeight: "600" }}>
                        Continue with Google
                      </Text>
                    </Pressable>

                    {/* Divider */}
                    <View className="flex-row items-center" style={{ gap: 12, marginVertical: 2 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                      <Text
                        style={{ color: textSecondaryColor, fontSize: 12.5, fontWeight: "600" }}
                      >
                        or sign in with UID
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                    </View>

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
                          <Text
                            style={{ color: textSecondaryColor }}
                            className="text-sm text-center ml-2"
                          >
                            Looking up user...
                          </Text>
                        </View>
                      ) : userPreview ? (
                        <View>
                          <Text style={{ color: textColor }} className="font-semibold text-center">
                            {userPreview.name.toUpperCase()}
                          </Text>
                          <Text
                            style={{ color: textSecondaryColor }}
                            className="text-xs text-center mt-1"
                          >
                            OTP will be sent to {userPreview.email}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: textSecondaryColor }} className="text-sm text-center">
                          {digits.length === 10
                            ? "User not found or network error"
                            : "Waiting for you to enter UID"}
                        </Text>
                      )}
                    </View>

                    <Button
                      label="Send OTP"
                      onPress={handleSendOtp}
                      variant="gradient"
                      size="lg"
                      accent={accentColor}
                      accentTo="#6366f1"
                      disabled={!canSendOtp}
                      loading={isLoading}
                      fullWidth
                    />
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
      </View>
    </>
  );
}
