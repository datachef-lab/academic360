import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/services/otp.service";
import { otpType } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const { type, recipient, otp } = await req.json();
console.log(type, recipient, otp);
        if (!type || !recipient || !otp) {
            console.log("OTP type, recipient, and OTP are required.")
            return NextResponse.json(
                { message: "OTP type, recipient, and OTP are required." },
                { status: 400 }
            );
        }

        if (!otpType.enumValues.includes(type)) {
            console.log("Invalid OTP type provided.")
            return NextResponse.json(
                { message: "Invalid OTP type provided." },
                { status: 400 }
            );
        }

        const isValid = await verifyOtp(type, recipient, otp);
        console.log("isValid:", isValid);

        if (isValid) {
            return NextResponse.json(
                { message: "OTP verified successfully!" },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { message: "Invalid or expired OTP." },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
} 