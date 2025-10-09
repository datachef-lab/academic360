import { db } from "@/db";
import { otpModel } from "@repo/db/schemas/models/auth/otp.model.js";
import { userModel } from "@repo/db/schemas/models/user";
import {
  notificationMasterModel,
  notificationMasterFieldModel,
  notificationMasterMetaModel,
} from "@repo/db/schemas/models/notifications";
import { eq, and, gt } from "drizzle-orm";
import { generateToken } from "@/utils/generateToken.js";
import type { StringValue } from "ms";
import * as userService from "@/features/user/services/user.service.js";
import { NotificationMasterDto } from "@repo/db/dtos/notifications";

const defaultOtpNotificationMaster: NotificationMasterDto[] = [
  {
    id: 0,
    name: "OTP",
    variant: "EMAIL",
    template: "otp",
    previewImage: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [
      {
        id: 0,
        name: "Code",
        notificationMasterId: 0,
      },
    ],
    meta: [
      {
        notificationMasterId: 0,
        notificationMasterFieldId: 0,
        sequence: 1,
        flag: true,
      },
    ],
  },
  {
    id: 0,
    name: "OTP",
    variant: "WHATSAPP",
    template: "otp",
    previewImage: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [
      {
        id: 0,
        name: "Code",
        notificationMasterId: 0,
      },
    ],
    meta: [
      {
        notificationMasterId: 0,
        notificationMasterFieldId: 0,
        sequence: 1,
        flag: true,
      },
    ],
  },
];

// Generate 6-digit random OTP
export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create OTP record in database
export const createOtp = async (
  recipient: string,
  type: "FOR_EMAIL" | "FOR_PHONE",
  expiryMinutes: number = 3,
) => {
  expiryMinutes = 3;
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const [otp] = await db
    .insert(otpModel)
    .values({
      otp: otpCode,
      recipient,
      type,
      expiresAt,
    })
    .returning();

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
