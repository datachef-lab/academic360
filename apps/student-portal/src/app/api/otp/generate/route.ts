import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/services/otp.service";
import { otpType } from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/notifications/interakt-messaging";
import { sendZeptoMail } from "@/lib/notifications/zepto-mailer";

export async function POST(req: NextRequest) {
    try {
        const { type, recipient, name } = await req.json();

        if (!type || !recipient) {
            return NextResponse.json(
                { message: "OTP type and recipient are required." },
                { status: 400 }
            );
        }

        if (!otpType.enumValues.includes(type)) {
            return NextResponse.json(
                { message: "Invalid OTP type provided." },
                { status: 400 }
            );
        }

        const otpCode = await generateOtp(type, recipient);
console.log("otpCode:", otpCode);
        // Now, send the OTP
        if (type == "FOR_EMAIL") {
            await sendZeptoMail(recipient, "Email Verify", `${otpCode} is your code. This only valid for 3min.`)
            return NextResponse.json(
                { message: "OTP generated and sent successfully!" },
                { status: 200 }
            );

        }
        else if (type == "FOR_PHONE") {
            const notificationData = await sendWhatsAppMessage(recipient, [otpCode], "OTP");
    
            // if (!notificationData.result) {
            //     console.error("Failed to send notification:", notificationData.message);
            //     return NextResponse.json(
            //         { message: notificationData.message || "Failed to send OTP notification." },
            //         { status: 500 }
            //     );
            // }
    
            return NextResponse.json(
                { message: "OTP generated and sent successfully!" },
                { status: 200 }
            );

        }

    } catch (error) {
        console.error("Error generating OTP:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
} 