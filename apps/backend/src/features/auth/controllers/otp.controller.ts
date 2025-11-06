import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  createOtp,
  verifyOtp,
  findUserForOtp,
  findUsersByEmailPrefix,
  generateTokensForUser,
  checkOtpStatus,
} from "../services/otp.service.js";
import {
  sendOtpEmailNotification,
  sendOtpWhatsAppNotification,
  sendOtpNotifications,
} from "@/services/otpNotification.service.js";

// Send OTP to both email and WhatsApp
export const sendOtpToEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    console.log("🔐 OTP request for email:", email);

    // Find and validate user (must be active and not suspended)
    const userResult = await findUserForOtp(email);
    if (!userResult.success) {
      res.status(400).json(new ApiError(400, userResult.message));
      return;
    }

    const user = userResult.user;

    // Generate OTP for email
    const emailOtp = await createOtp(email, "FOR_EMAIL", 5);
    console.log("📧 OTP generated for email:", email, "Code:", emailOtp.otp);

    // Prepare notification data
    const notificationData = {
      email,
      phoneNumber: phoneNumber || user?.phone || user?.whatsappNumber || "",
      otpCode: emailOtp.otp,
      userName: user?.name || "User",
      expiryMinutes: 5,
    };

    // Send notifications to both email and WhatsApp
    const notificationResults = await sendOtpNotifications(notificationData);

    // Log results
    if (notificationResults.email?.success) {
      console.log("✅ Email OTP notification sent successfully");
    } else {
      console.error(
        "❌ Failed to send email OTP notification:",
        notificationResults.email?.error,
      );
    }

    if (notificationResults.whatsapp?.success) {
      console.log("✅ WhatsApp OTP notification sent successfully");
    } else {
      console.error(
        "❌ Failed to send WhatsApp OTP notification:",
        notificationResults.whatsapp?.error,
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          message: "OTP sent successfully",
          expiresIn: "5 minutes",
          sentTo: {
            email: notificationResults.email?.success || false,
            whatsapp: notificationResults.whatsapp?.success || false,
          },
        },
        "OTP has been sent to your email and WhatsApp",
      ),
    );
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    handleError(error, res, next);
  }
};

// Send OTP to WhatsApp
export const sendOtpToWhatsApp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email || !phoneNumber) {
      res
        .status(400)
        .json(new ApiError(400, "Email and phone number are required"));
      return;
    }

    console.log("🔐 OTP request for WhatsApp:", email, phoneNumber);

    // Find and validate user
    const userResult = await findUserForOtp(email);
    if (!userResult.success) {
      res.status(400).json(new ApiError(400, userResult.message));
      return;
    }

    const user = userResult.user;

    // Generate OTP
    const otp = await createOtp(phoneNumber, "FOR_PHONE", 5);
    console.log(
      "📱 OTP generated for WhatsApp:",
      phoneNumber,
      "Code:",
      otp.otp,
    );

    // Send WhatsApp notification
    const notificationResult = await sendOtpWhatsAppNotification({
      email,
      phoneNumber,
      otpCode: otp.otp,
      userName: user?.name || "User",
      expiryMinutes: 5,
    });

    if (!notificationResult.success) {
      console.error(
        "❌ Failed to send OTP WhatsApp notification:",
        notificationResult.error || "Unknown error",
      );
      // Don't fail the request, just log the error
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          message: "OTP sent successfully",
          expiresIn: "5 minutes",
          // Don't send the actual OTP in response for security
        },
        "OTP has been sent to your WhatsApp",
      ),
    );
  } catch (error) {
    console.error("❌ Error sending WhatsApp OTP:", error);
    handleError(error, res, next);
  }
};

// Verify OTP and login
export const verifyOtpAndLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const { app } = req.headers;

    if (!email || !otp) {
      res.status(400).json(new ApiError(400, "Email and OTP are required"));
      return;
    }

    console.log("🔐 OTP verification for:", email);

    // Find user first (must be active and not suspended)
    const userResult = await findUserForOtp(email);
    if (!userResult.success) {
      res.status(400).json(new ApiError(400, userResult.message));
      return;
    }

    const user = userResult.user;

    // Always verify OTP using email as identifier since we send to both email and WhatsApp
    const verifyResult = await verifyOtp(email, otp, "FOR_EMAIL");

    if (!verifyResult.success) {
      res.status(400).json(new ApiError(400, verifyResult.message));
      return;
    }

    console.log("✅ OTP verified successfully for:", email);

    // Check if request is from student console
    const origin = req.get("origin") || req.get("referer") || "";
    const isStudentConsole =
      app === "student-console" ||
      origin.includes("localhost:3000") ||
      origin.includes("student-console");

    // Generate tokens
    const tokenResult = await generateTokensForUser(user, isStudentConsole);
    if (!tokenResult.success) {
      res.status(500).json(new ApiError(500, tokenResult.message));
      return;
    }

    const { accessToken, refreshToken, user: userWithPayload } = tokenResult;

    // Use different cookie name for student console to avoid conflict with admin console
    const cookieName = isStudentConsole ? "student_jwt" : "jwt";

    // Create secure cookie with refresh token
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    console.log(`🍪 Refresh token cookie set (${cookieName})`);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          accessToken,
          user: userWithPayload,
          message: "OTP verified and login successful",
        },
        "Login successful with OTP verification",
      ),
    );
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    handleError(error, res, next);
  }
};

// Verify OTP only (no login, does not issue tokens)
export const verifyOtpOnly = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json(new ApiError(400, "Email and OTP are required"));
      return;
    }

    const userResult = await findUserForOtp(email);
    if (!userResult.success) {
      res.status(400).json(new ApiError(400, userResult.message));
      return;
    }

    // Do NOT consume OTP here to allow password reset to use the same OTP
    const status = await checkOtpStatus(email);
    if (!status.hasValidOtp) {
      res.status(400).json(new ApiError(400, "Invalid or expired OTP"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { remainingTime: status.remainingTime },
          "OTP valid",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Resend OTP to both email and WhatsApp
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    console.log("🔄 Resend OTP request for:", email);

    // Find and validate user (must be active and not suspended)
    const userResult = await findUserForOtp(email);
    if (!userResult.success) {
      res.status(400).json(new ApiError(400, userResult.message));
      return;
    }

    const user = userResult.user;

    // Generate new OTP for email
    const emailOtp = await createOtp(email, "FOR_EMAIL", 3);
    console.log("🔄 New OTP generated:", emailOtp.otp);

    // Prepare notification data
    const notificationData = {
      email,
      phoneNumber: phoneNumber || user?.phone || user?.whatsappNumber || "",
      otpCode: emailOtp.otp,
      userName: user?.name || "User",
      expiryMinutes: 5,
    };

    // Send notifications to both email and WhatsApp
    const notificationResults = await sendOtpNotifications(notificationData);

    // Log results
    if (notificationResults.email?.success) {
      console.log("✅ Email OTP resend notification sent successfully");
    } else {
      console.error(
        "❌ Failed to resend email OTP notification:",
        notificationResults.email?.error,
      );
    }

    if (notificationResults.whatsapp?.success) {
      console.log("✅ WhatsApp OTP resend notification sent successfully");
    } else {
      console.error(
        "❌ Failed to resend WhatsApp OTP notification:",
        notificationResults.whatsapp?.error,
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          message: "OTP resent successfully",
          expiresIn: "5 minutes",
          sentTo: {
            email: notificationResults.email?.success || false,
            whatsapp: notificationResults.whatsapp?.success || false,
          },
        },
        "New OTP has been sent to your email and WhatsApp",
      ),
    );
  } catch (error) {
    console.error("❌ Error resending OTP:", error);
    handleError(error, res, next);
  }
};

// Check OTP status
export const checkOtpStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    console.log("🔍 Checking OTP status for:", email);

    const result = await checkOtpStatus(email);

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          hasValidOtp: result.hasValidOtp,
          expiresAt: result.expiresAt,
          remainingTime: result.remainingTime,
        },
        result.message,
      ),
    );
  } catch (error) {
    console.error("❌ Error checking OTP status:", error);
    handleError(error, res, next);
  }
};

// Test time calculation endpoint
export const testTimeCalculation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    const testExpiry = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes from now
    const remainingTime = Math.floor(
      (testExpiry.getTime() - now.getTime()) / 1000,
    );

    console.log("🧪 Time calculation test:");
    console.log("⏰ Current time:", now.toISOString());
    console.log("⏰ Test expiry time:", testExpiry.toISOString());
    console.log("⏱️ Calculated remaining time:", remainingTime, "seconds");

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          currentTime: now.toISOString(),
          testExpiryTime: testExpiry.toISOString(),
          remainingTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        "Time calculation test completed",
      ),
    );
  } catch (error) {
    console.error("❌ Error in time calculation test:", error);
    handleError(error, res, next);
  }
};

// Lightweight user lookup for login page (no OTP side-effects)
export const lookupUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    const result = await findUserForOtp(email);
    if (!result.success) {
      res.status(404).json(new ApiError(404, result.message));
      return;
    }

    const user = result.user as any;
    res.status(200).json(
      new ApiResponse(200, "SUCCESS", {
        id: user.id,
        name: user.name,
        email: user.email,
        uid: user?.academicIdentifier?.uid || undefined,
      }),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Prefix lookup for live typing (uid prefix)
export const lookupUsersByUidPrefix = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { prefix } = req.query;
    const p =
      typeof prefix === "string" ? prefix.replace(/\D/g, "").slice(0, 10) : "";
    if (!p || p.length < 2) {
      res.status(200).json(new ApiResponse(200, "SUCCESS", { users: [] }));
      return;
    }
    const users = await findUsersByEmailPrefix(p);
    res.status(200).json(new ApiResponse(200, "SUCCESS", { users }));
  } catch (error) {
    handleError(error, res, next);
  }
};
