import "dotenv/config";
import type { StringValue } from "ms";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { userModel, User } from "@repo/db/schemas/models/user";
import { handleError } from "@/utils/handleError.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { generateToken } from "@/utils/generateToken.js";
import { addUser } from "@/features/user/services/user.service.js";
import { userTypeEnum } from "@repo/db/schemas/enums";

import * as userService from "@/features/user/services/user.service.js";
import { randomBytes } from "crypto";
import { generateTokensForUser } from "../services/otp.service.js";
import { verifyToken } from "@/utils/verifyToken.js";

// Detect if a request is originating from the student console
// IMPORTANT: For auth routes, only trust the explicit header from the student console Axios instance.
// Do NOT infer from Origin/Referer in production, to avoid misclassification and cookie mixups.
function isStudentConsoleRequest(req: Request): boolean {
  const { app } = req.headers as { app?: string };
  const origin = req.get("origin") || req.get("referer") || "";
  const result = app === "student-console";
  // Debug trace (safe): which path chose which cookie family
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[AUTH isStudentConsole] app=${app} origin=${origin} -> ${result ? "student" : "admin"}`,
    );
  }
  return result;
}

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const givenUser = req.body as User;

  try {
    // Create a new user
    const newUser = await addUser(givenUser);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "CREATED",
          newUser,
          "New user created successfully!",
        ),
      );
  } catch (error: unknown) {
    handleError(error, res, next);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const { app } = req.headers;

    console.log("🔑 Login attempt for:", email);

    console.log("📋 Looking up user by email...");
    const foundUser = await userService.findByEmail(email);
    console.log("📋 User lookup result:", foundUser ? "Found" : "Not found");

    if (!foundUser) {
      console.log("❌ User not found, returning 401");
      res
        .status(401)
        .json(new ApiError(401, "Please provide the valid credentials."));
      return;
    }

    console.log("Checking if user is disabled?");
    if (!foundUser.isActive || foundUser.isSuspended) {
      res
        .status(403)
        .json(
          new ApiError(
            403,
            "Your account is disabled. Please contact support.",
          ),
        );
      return;
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      foundUser.password as string,
    );

    console.log("Checking if password is correct?");
    if (!isPasswordMatch) {
      res
        .status(401)
        .json(new ApiError(401, "Please provide the valid credentials."));
      return;
    }

    // Check if request is from student console
    const isStudentConsole = isStudentConsoleRequest(req);

    let userWithPayload: any = foundUser;

    // If it's a student console request, fetch student data in payload
    if (isStudentConsole) {
      console.log(
        "🎓 Student console request detected, fetching student data...",
      );

      // Format user with payload (student data)
      const formattedUser = await userService.modelToDto(foundUser);
      if (!formattedUser) {
        console.log("❌ Student data not found, returning 401");
        res
          .status(401)
          .json(
            new ApiError(
              401,
              "Student data not found. Please contact support.",
            ),
          );
        return;
      }

      userWithPayload = formattedUser;
      console.log("✅ Student data fetched successfully");
    }

    const accessToken = generateToken(
      { id: foundUser.id as number, type: foundUser.type as User["type"] },
      process.env.ACCESS_TOKEN_SECRET!,
      process.env.ACCESS_TOKEN_EXPIRY! as StringValue,
    );

    const refreshToken = generateToken(
      { id: foundUser.id as number, type: foundUser.type },
      process.env.REFRESH_TOKEN_SECRET!,
      process.env.REFRESH_TOKEN_EXPIRY! as StringValue,
    );

    console.log("Creating secure cookie with refresh token");
    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // Accessible only by the web server
      secure: true, // Required when SameSite=None; ensures HTTPS
      sameSite: "none", // Allow cross-site cookie for frontend on different origin
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    // Log cookies before sending response
    console.log("Cookies set in response:", res.getHeaders()["set-cookie"]);

    console.log("Sending response");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { accessToken, user: userWithPayload },
          "Login successful",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const postGoogleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Retrieve user from Passport
    const foundUser = req.user as { id: number; type: string };

    if (!foundUser) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const accessToken = generateToken(
      { id: foundUser.id, type: foundUser.type as User["type"] },
      process.env.ACCESS_TOKEN_SECRET!,
      process.env.ACCESS_TOKEN_EXPIRY! as StringValue,
    );

    const refreshToken = generateToken(
      { id: foundUser.id, type: foundUser.type as User["type"] },
      process.env.REFRESH_TOKEN_SECRET!,
      process.env.REFRESH_TOKEN_EXPIRY! as StringValue,
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // Accessible only by the web server
      secure: true, // Required when SameSite=None; ensures HTTPS
      sameSite: "none", // Allow cross-site cookie for frontend on different origin
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    next();
  } catch (error) {
    handleError(error, res, next);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if request is from student console
    const isStudentConsole = isStudentConsoleRequest(req);

    // Use appropriate cookie based on console type
    const cookieName = isStudentConsole ? "student_jwt" : "jwt";
    const refreshToken = req.cookies[cookieName];

    if (!refreshToken) {
      res.status(401).json(new ApiError(401, "Unauthorized"));
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      async (err: unknown, decoded: any) => {
        const user = decoded as {
          id: number;
          type: typeof userTypeEnum.enumValues;
        };
        if (err) {
          res.status(403).json(new ApiError(403, "Forbidden"));
          return;
        }

        const [rawUser] = await db
          .select()
          .from(userModel)
          .where(eq(userModel.id, user.id));
        if (!rawUser) {
          res.status(401).json(new ApiError(404, "Unauthorized"));
          return;
        }

        let userWithPayload: any = rawUser;

        // If it's a student console request, fetch student data in payload
        if (isStudentConsole) {
          console.log(
            "🎓 Student console refresh request detected, fetching student data...",
          );

          // Format user with payload (student data)
          const formattedUser = await userService.modelToDto(rawUser);
          if (!formattedUser) {
            console.log(
              "❌ Student data not found during refresh, returning 401",
            );
            res
              .status(401)
              .json(
                new ApiError(
                  401,
                  "Student data not found. Please contact support.",
                ),
              );
            return;
          }

          userWithPayload = formattedUser;
          console.log("✅ Student data fetched successfully during refresh");
        }

        const accessToken = generateToken(
          {
            id: userWithPayload.id as number,
            type: userWithPayload.type as User["type"],
          },
          process.env.ACCESS_TOKEN_SECRET!,
          process.env.ACCESS_TOKEN_EXPIRY! as StringValue,
        );

        res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "SUCCESS",
              { accessToken, user: userWithPayload },
              "Token refreshed",
            ),
          );
      },
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if request is from student console
    const isStudentConsole = isStudentConsoleRequest(req);

    // Use appropriate cookie based on console type
    const cookieName = isStudentConsole ? "student_jwt" : "jwt";
    const cookies = req.cookies;

    console.log(`[LOGOUT] Clearing ${cookieName} cookie`);

    if (!cookies[cookieName]) {
      res.status(204).json(new ApiError(204, "No content"));
      return;
    }

    console.log("Logging out...");
    // Clear ONLY the appropriate cookie (student_jwt for student console, jwt for admin console)
    // This ensures logout from one console doesn't affect the other
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // Log out from Google (passport.js logout)
    req.logout((err) => {
      if (err) {
        return next(err); // Pass the error to the next middleware (error handler)
      }

      // Optionally, you can redirect the user to a logout confirmation page
      // or directly to the login page
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", null, "Logout successful"));
    });

    // res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Logout successful"));
  } catch (error) {
    handleError(error, res, next);
  }
};

// Password Reset Functions

// In-memory store for password reset tokens (in production, use Redis or database)
const passwordResetTokens = new Map<
  string,
  { token: string; email: string; expiresAt: Date }
>();

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    console.log("[PASSWORD RESET] Requesting password reset for:", email);

    // Check if user exists
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email));

    if (!user) {
      console.log("[PASSWORD RESET] User not found:", email);
      res
        .status(400)
        .json(new ApiError(400, "User not found with this email address"));
      return;
    }

    // Check if user is active
    if (!user.isActive || user.isSuspended) {
      console.log("[PASSWORD RESET] User account is disabled:", email);
      res
        .status(400)
        .json(
          new ApiError(400, "Account is disabled. Please contact support."),
        );
      return;
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in memory
    passwordResetTokens.set(token, {
      token,
      email,
      expiresAt,
    });

    console.log("[PASSWORD RESET] Token generated for:", email);

    // For development/testing - return token directly
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { token },
          "Password reset token generated. Use this token to reset your password.",
        ),
      );
  } catch (error) {
    console.error("[PASSWORD RESET] Error requesting password reset:", error);
    handleError(error, res, next);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res
        .status(400)
        .json(new ApiError(400, "Token and new password are required"));
      return;
    }

    console.log("[PASSWORD RESET] Attempting to reset password with token");

    // Validate token
    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      console.log("[PASSWORD RESET] Invalid token");
      res.status(400).json(new ApiError(400, "Invalid or expired reset token"));
      return;
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      console.log("[PASSWORD RESET] Token expired");
      passwordResetTokens.delete(token);
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Reset token has expired. Please request a new one",
          ),
        );
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      res
        .status(400)
        .json(new ApiError(400, "Password must be at least 8 characters long"));
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const [updatedUser] = await db
      .update(userModel)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(userModel.email, tokenData.email))
      .returning();

    if (!updatedUser) {
      console.log(
        "[PASSWORD RESET] Failed to update password for:",
        tokenData.email,
      );
      res
        .status(500)
        .json(new ApiError(500, "Failed to update password. Please try again"));
      return;
    }

    // Remove used token
    passwordResetTokens.delete(token);

    console.log(
      "[PASSWORD RESET] Password updated successfully for:",
      tokenData.email,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Password has been reset successfully",
        ),
      );
  } catch (error) {
    console.error("[PASSWORD RESET] Error resetting password:", error);
    handleError(error, res, next);
  }
};

export const validateResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json(new ApiError(400, "Token is required"));
      return;
    }

    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      res.status(400).json(new ApiError(400, "Invalid reset token"));
      return;
    }

    if (new Date() > tokenData.expiresAt) {
      passwordResetTokens.delete(token);
      res.status(400).json(new ApiError(400, "Reset token has expired"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { email: tokenData.email },
          "Token is valid",
        ),
      );
  } catch (error) {
    console.error("[PASSWORD RESET] Error validating token:", error);
    handleError(error, res, next);
  }
};

/**
 * Clean up expired tokens (call this periodically)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of passwordResetTokens.entries()) {
    if (now > data.expiresAt) {
      passwordResetTokens.delete(token);
    }
  }
}

// Simple password reset - accepts email and new password directly
export const simplePasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res
        .status(400)
        .json(new ApiError(400, "Email and new password are required"));
      return;
    }

    console.log("[SIMPLE PASSWORD RESET] Resetting password for:", email);

    // Check if user exists
    const [user] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, email));

    if (!user) {
      console.log("[SIMPLE PASSWORD RESET] User not found:", email);
      res
        .status(400)
        .json(new ApiError(400, "User not found with this email address"));
      return;
    }

    // Check if user is active
    if (!user.isActive || user.isSuspended) {
      console.log("[SIMPLE PASSWORD RESET] User account is disabled:", email);
      res
        .status(400)
        .json(
          new ApiError(400, "Account is disabled. Please contact support."),
        );
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      res
        .status(400)
        .json(new ApiError(400, "Password must be at least 8 characters long"));
      return;
    }

    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const [updatedUser] = await db
      .update(userModel)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(userModel.email, email))
      .returning();

    if (!updatedUser) {
      console.log(
        "[SIMPLE PASSWORD RESET] Failed to update password for:",
        email,
      );
      res
        .status(500)
        .json(new ApiError(500, "Failed to update password. Please try again"));
      return;
    }

    console.log(
      "[SIMPLE PASSWORD RESET] Password updated successfully for:",
      email,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Password has been reset successfully",
        ),
      );
  } catch (error) {
    console.error("[SIMPLE PASSWORD RESET] Error resetting password:", error);
    handleError(error, res, next);
  }
};

/**
 * Admin endpoint to bypass OTP and generate student tokens for simulation
 * This allows admins to simulate student console login without OTP
 * Can be called with admin token in header (X-Admin-Bypass-Token) or via JWT middleware
 */
export const adminBypassOtpLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let adminUser: User | null = null;

    // Check if admin token is provided in header (for simulation mode)
    const adminToken = req.headers["x-admin-bypass-token"] as string;
    if (adminToken) {
      // Verify admin token
      try {
        const decoded = await verifyToken(
          adminToken,
          process.env.ACCESS_TOKEN_SECRET!,
        );
        const [foundAdmin] = await db
          .select()
          .from(userModel)
          .where(eq(userModel.id, decoded.id));

        if (
          foundAdmin &&
          (foundAdmin.type === "ADMIN" || foundAdmin.type === "STAFF")
        ) {
          adminUser = foundAdmin;
        }
      } catch (err) {
        console.log("[ADMIN BYPASS OTP] Invalid admin token in header");
      }
    } else if (req.user) {
      // Fallback to JWT middleware verified user
      adminUser = req.user as User;
    }

    if (
      !adminUser ||
      (adminUser.type !== "ADMIN" && adminUser.type !== "STAFF")
    ) {
      res
        .status(403)
        .json(
          new ApiError(403, "Only ADMIN or STAFF can access this endpoint"),
        );
      return;
    }

    const { uid } = req.body;

    if (!uid || typeof uid !== "string") {
      res.status(400).json(new ApiError(400, "UID is required"));
      return;
    }

    // Validate UID format (should be 10 digits)
    if (uid.length !== 10 || !/^\d+$/.test(uid)) {
      res.status(400).json(new ApiError(400, "UID must be a 10-digit number"));
      return;
    }

    const email = `${uid}@thebges.edu.in`;
    console.log("[ADMIN BYPASS OTP] Admin bypass login for student:", email);

    // Find user by email
    const foundUser = await userService.findByEmail(email);

    if (!foundUser) {
      console.log("[ADMIN BYPASS OTP] Student not found:", email);
      res
        .status(404)
        .json(new ApiError(404, "Student not found with this UID"));
      return;
    }

    // Check if user is active and not suspended
    if (!foundUser.isActive || foundUser.isSuspended) {
      console.log("[ADMIN BYPASS OTP] Student account is disabled:", email);
      res
        .status(403)
        .json(new ApiError(403, "Student account is disabled or suspended"));
      return;
    }

    // Check if user is a STUDENT
    if (foundUser.type !== "STUDENT") {
      res
        .status(400)
        .json(
          new ApiError(400, "This UID does not belong to a student account"),
        );
      return;
    }

    // Generate tokens for student console (with student data payload)
    const tokenResult = await generateTokensForUser(foundUser, true);
    if (!tokenResult.success) {
      res.status(500).json(new ApiError(500, tokenResult.message));
      return;
    }

    const { accessToken, refreshToken, user: userWithPayload } = tokenResult;

    console.log("[ADMIN BYPASS OTP] Tokens generated successfully for:", email);

    // Set student refresh token with different cookie name to avoid conflict with admin session
    res.cookie("student_jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          accessToken,
          refreshToken,
          user: userWithPayload,
        },
        "Student tokens generated successfully for simulation",
      ),
    );
  } catch (error) {
    console.error("[ADMIN BYPASS OTP] Error:", error);
    handleError(error, res, next);
  }
};
