import { dbPostgres } from "@/db";
import { otps, otpType } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const OTP_EXPIRY_MINUTES = 3;

export async function generateOtp(type: typeof otpType.enumValues[number], recipient: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Delete any existing OTPs for the same recipient and type to ensure only one is active
    await dbPostgres.delete(otps).where(and(eq(otps.recipient, recipient), eq(otps.type, type)));

    const [newOtp] = await dbPostgres
        .insert(otps)
        .values({
            otp: otpCode,
            recipient,
            type,
            expiresAt,
        })
        .returning();
console.log('newOtp:', newOtp);
    return newOtp.otp;
}

export async function verifyOtp(type: typeof otpType.enumValues[number], recipient: string, otp: string) {
    console.log('VERIFY OTP INPUT:', { type, recipient, otp });
    const [foundOtp] = await dbPostgres
        .select()
        .from(otps)
        .where(and(
            eq(otps.recipient, recipient),
            eq(otps.type, type),
            eq(otps.otp, otp)
        ))
        .orderBy(desc(otps.createdAt))
        .limit(1);

    console.log('VERIFY OTP: foundOtp:', foundOtp);

    if (!foundOtp) {
        // Log all OTPs for this recipient and type for debugging
        const allOtps = await dbPostgres
            .select()
            .from(otps)
            .where(and(
                eq(otps.recipient, recipient),
                eq(otps.type, type)
            ))
            .orderBy(desc(otps.createdAt));
        console.log('ALL OTPs for recipient/type:', allOtps);
        return false;
    }

    // Patch: ensure expiresAt is treated as UTC
    let expiresAtDate = foundOtp.expiresAt;
    if (typeof expiresAtDate === 'string' && !expiresAtDate.endsWith('Z')) {
        expiresAtDate += 'Z';
    }
    if (new Date(expiresAtDate) < new Date()) {
        // OTP expired, delete it
        await dbPostgres.delete(otps).where(eq(otps.id, foundOtp.id));
        return false; // OTP expired
    }

    // OTP is valid, delete it to prevent reuse
    await dbPostgres.delete(otps).where(eq(otps.id, foundOtp.id));

    return true; // OTP verified
}