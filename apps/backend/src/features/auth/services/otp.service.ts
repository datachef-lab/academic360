import { db } from "@/db";
import { otpModel } from "@repo/db/schemas/models/auth/otp.model.js";
import { userModel } from "@repo/db/schemas/models/user";
import {
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationMasterMetaModel,
} from "@repo/db/schemas/models/notifications";
import { eq, and, gt, ilike, desc } from "drizzle-orm";
import { generateToken } from "@/utils/generateToken.js";
import type { StringValue } from "ms";
import * as userService from "@/features/user/services/user.service.js";
import { NotificationMasterDto } from "@repo/db/dtos/notifications";
import { notificationVariantEnum } from "@repo/db/schemas";

const defaultNotificationMasters = [
  {
    name: "OTP",
    variant: "WHATSAPP",
    template: "loginotp",
  },
  {
    name: "OTP",
    variant: "EMAIL",
    template: "otp",
  },
  {
    name: "Subject Selection Confirmation",
    variant: "EMAIL",
    template: "subject-selection-confirmation",
  },
  {
    name: "Subject Selection Confirmation - BA",
    variant: "WHATSAPP",
    template: "basubconf_vy",
  },
  {
    name: "Subject Selection Confirmation - BSC",
    variant: "WHATSAPP",
    template: "scisubconf",
  },
  {
    name: "Subject Selection Confirmation - BCOM",
    variant: "WHATSAPP",
    template: "comsubconf",
  },
];

// For loginotp
const deaultOtpNotificationMasterFields = ["Name", "Code"];
// For Subject Selection Confirmation
const deaultSubjectSelectionConfirmationNotificationMasterFields = [
  "Name",
  "Minor 1 (Semester I & II)",
  "Minor 2 (Semester III & IV)",
  "Minor 3 (Semester III)",
  "IDC 1 (Semester I)",
  "IDC 2 (Semester II)",
  "IDC 3 (Semester III)",
  "AEC (Semester III & IV)",
  "CVAC 4 (Semester II)",
];

export async function loadDefaultOtpNotificationMasters() {
  for (const master of defaultNotificationMasters) {
    let [existingMaster] = await db
      .select()
      .from(notificationMasterModel)
      .where(
        and(
          ilike(notificationMasterModel.name, master.name),
          eq(
            notificationMasterModel.variant,
            master.variant as (typeof notificationVariantEnum.enumValues)[number],
          ),
          ilike(notificationMasterModel.template, master.template),
        ),
      );
    if (!existingMaster) {
      [existingMaster] = await db
        .insert(notificationMasterModel)
        .values({
          name: master.name,
          variant:
            master.variant as (typeof notificationVariantEnum.enumValues)[number],
          template: master.template,
          previewImage: null,
          isActive: true,
        })
        .returning();
    }
    if (master.name === "OTP") {
      await addFields(existingMaster.id, deaultOtpNotificationMasterFields);
    } else if (master.name === "Subject Selection Confirmation") {
      // EMAIL notification master - add all fields
      await addFields(
        existingMaster.id,
        deaultSubjectSelectionConfirmationNotificationMasterFields,
      );
    } else if (master.name === "Subject Selection Confirmation - BA") {
      await addFields(
        existingMaster.id,
        deaultSubjectSelectionConfirmationNotificationMasterFields.filter(
          (field) =>
            field !== "CVAC 4 (Semester II)" &&
            field !== "Minor 3 (Semester III)",
        ),
      );
    } else if (master.name === "Subject Selection Confirmation - BSC") {
      await addFields(
        existingMaster.id,
        deaultSubjectSelectionConfirmationNotificationMasterFields.filter(
          (field) => field !== "Minor 3 (Semester III)",
        ),
      );
    } else if (master.name === "Subject Selection Confirmation - BCOM") {
      await addFields(existingMaster.id, [
        "Minor 1 (Semester I & II)",
        "Minor 2 (Semester III & IV)",
      ]);
    }
  }
}

export async function addFields(masterId: number, fields: string[]) {
  let seq = 0;
  for (const field of fields) {
    let [existingField] = await db
      .select()
      .from(notificationMasterFieldModel)
      .where(
        and(
          ilike(notificationMasterFieldModel.name, field),
          eq(notificationMasterFieldModel.notificationMasterId, masterId),
        ),
      );
    if (!existingField) {
      const [newField] = await db
        .insert(notificationMasterFieldModel)
        .values({
          name: field,
          notificationMasterId: masterId,
        })
        .returning();
      existingField = newField;
    }
    // Add the meta
    const [existingMeta] = await db
      .select()
      .from(notificationMasterMetaModel)
      .where(
        and(
          eq(notificationMasterMetaModel.notificationMasterId, masterId),
          eq(
            notificationMasterMetaModel.notificationMasterFieldId,
            existingField.id!,
          ),
          eq(notificationMasterMetaModel.sequence, ++seq),
        ),
      );
    if (!existingMeta) {
      await db.insert(notificationMasterMetaModel).values({
        notificationMasterId: masterId,
        notificationMasterFieldId: existingField.id!,
        sequence: seq,
        flag: true,
      });
    }
  }
}

// Generate 6-digit random OTP
export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create OTP record in database
export const createOtp = async (
  recipient: string,
  type: "FOR_EMAIL" | "FOR_PHONE",
  expiryMinutes: number = 5,
) => {
  expiryMinutes = 5;
  const otpCode = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  console.log("🕐 Creating OTP at:", now.toISOString());
  console.log("otp:", otpCode);
  console.log("⏰ OTP will expire at:", expiresAt.toISOString());
  console.log("⏱️ Expiry duration:", expiryMinutes, "minutes");

  const [otp] = await db
    .insert(otpModel)
    .values({
      otp: otpCode,
      recipient,
      type,
      expiresAt,
    })
    .returning();

  console.log(
    "💾 OTP saved to database with expiresAt:",
    otp.expiresAt.toISOString(),
  );
  return otp;
};

// Verify OTP
export const verifyOtp = async (
  recipient: string,
  otpCode: string,
  type: "FOR_EMAIL" | "FOR_PHONE",
) => {
  const [otp] = await db
    .select()
    .from(otpModel)
    .where(
      and(
        eq(otpModel.recipient, recipient),
        eq(otpModel.otp, otpCode),
        eq(otpModel.type, type),
        gt(otpModel.expiresAt, new Date()),
      ),
    );

  if (!otp) {
    return { success: false, message: "Invalid or expired OTP" };
  }

  // Delete the OTP after successful verification
  await db.delete(otpModel).where(eq(otpModel.id, otp.id));

  return { success: true, message: "OTP verified successfully" };
};

// Find user by email and validate
export const findUserForOtp = async (email: string) => {
  const user = await userService.findByEmail(email);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (!user.isActive || user.isSuspended) {
    return { success: false, message: "Account is disabled or suspended" };
  }

  return { success: true, user };
};

// Find active users by email prefix (for live UID typing)
export const findUsersByEmailPrefix = async (uidPrefix: string) => {
  const emailPrefix = `${uidPrefix}%@thebges.edu.in`;
  const users = await db
    .select()
    .from(userModel)
    .where(
      and(
        ilike(userModel.email as any, emailPrefix as any),
        eq(userModel.isActive as any, true as any),
        eq(userModel.isSuspended as any, false as any),
      ),
    )
    .limit(5);
  return (
    users?.map((u: any) => ({ id: u.id, name: u.name, email: u.email })) || []
  );
};

// Check OTP status without consuming it
export const checkOtpStatus = async (recipient: string) => {
  console.log("🔍 Checking OTP status for recipient:", recipient);

  const [otp] = await db
    .select()
    .from(otpModel)
    .where(
      and(
        eq(otpModel.recipient, recipient),
        eq(otpModel.type, "FOR_EMAIL"),
        gt(otpModel.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(otpModel.createdAt))
    .limit(1);

  if (!otp) {
    console.log("❌ No valid OTP found for:", recipient);
    return {
      hasValidOtp: false,
      message: "No valid OTP found",
    };
  }

  const now = new Date();
  const rawRemainingTime = Math.floor(
    (otp.expiresAt.getTime() - now.getTime()) / 1000,
  );
  let remainingTime = Math.max(0, rawRemainingTime);

  console.log("✅ Valid OTP found for:", recipient);
  console.log("📅 OTP created at:", otp.createdAt?.toISOString() || "Unknown");
  console.log("📅 OTP expires at:", otp.expiresAt.toISOString());
  console.log("⏰ Current time:", now.toISOString());
  console.log("⏱️ Raw remaining time:", rawRemainingTime, "seconds");
  console.log(
    "⏱️ Time difference (ms):",
    otp.expiresAt.getTime() - now.getTime(),
  );

  // Cap the remaining time to maximum 300 seconds (5 minutes) as a safety measure
  if (remainingTime > 300) {
    console.warn(
      "⚠️ Backend: Calculated time > 300s, capping to 300s. Raw time:",
      remainingTime,
    );
    console.warn("⚠️ This suggests a timezone or calculation issue!");
    remainingTime = 300;
  }

  console.log("⏱️ Final remaining time:", remainingTime, "seconds");

  return {
    hasValidOtp: true,
    expiresAt: otp.expiresAt.toISOString(),
    remainingTime,
    message: "Valid OTP found",
  };
};

// Generate tokens after OTP verification
export const generateTokensForUser = async (
  user: any,
  isStudentConsole: boolean = false,
) => {
  let userWithPayload = user;

  // If it's a student console request, fetch student data in payload
  if (isStudentConsole) {
    const formattedUser = await userService.modelToDto(user);
    if (!formattedUser) {
      return { success: false, message: "Student data not found" };
    }
    userWithPayload = formattedUser;
  }

  const accessToken = generateToken(
    { id: user.id as number, type: user.type },
    process.env.ACCESS_TOKEN_SECRET!,
    process.env.ACCESS_TOKEN_EXPIRY! as StringValue,
  );

  const refreshToken = generateToken(
    { id: user.id as number, type: user.type },
    process.env.REFRESH_TOKEN_SECRET!,
    process.env.REFRESH_TOKEN_EXPIRY! as StringValue,
  );

  return {
    success: true,
    accessToken,
    refreshToken,
    user: userWithPayload,
  };
};

// Load default OTP notification masters
// export const loadDefaultOtpNotificationMaster = async () => {
//     for (const master of defaultOtpNotificationMaster) {
//         const existingMaster = await db
//             .select()
//             .from(notificationMasterModel)
//             .where(
//                 and(
//                     eq(notificationMasterModel.name, master.name),
//                     eq(notificationMasterModel.variant, master.variant)
//                 )
//             );

//         if (existingMaster.length === 0) {
//             // Create the notification master
//             const [createdMaster] = await db
//                 .insert(notificationMasterModel)
//                 .values({
//                     name: master.name,
//                     variant: master.variant,
//                     template: master.template,
//                     previewImage: master.previewImage,
//                     isActive: master.isActive,
//                 })
//                 .returning();

//             // Create fields for this master
//             for (const field of master.fields) {
//                 const [createdField] = await db
//                     .insert(notificationMasterFieldModel)
//                     .values({
//                         name: field.name,
//                         notificationMasterId: createdMaster.id,
//                     })
//                     .returning();

//                 // Create meta for this field
//                 const correspondingMeta = master.meta.find(
//                     meta => meta.notificationMasterFieldId === field.id
//                 );

//                 if (correspondingMeta) {
//                     await db
//                         .insert(notificationMasterMetaModel)
//                         .values({
//                             notificationMasterId: createdMaster.id,
//                             notificationMasterFieldId: createdField.id,
//                             sequence: correspondingMeta.sequence,
//                             flag: correspondingMeta.flag,
//                         });
//                 }
//             }

//             console.log(`✅ ${master.variant} OTP notification master created successfully`);
//         }
//     }
// };
