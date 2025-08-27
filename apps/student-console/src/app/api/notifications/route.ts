import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/notifications/interakt-messaging";
import { sendZeptoMail } from "@/lib/notifications/zepto-mailer";

export async function POST(req: NextRequest) {
    try {
        const { type, to, code, name } = await req.json();

        if (!type || !to || !code) {
            return NextResponse.json(
                { message: "Type, recipient, and code are required." },
                { status: 400 }
            );
        }

        let result: any;

        switch (type) {
            case "whatsapp":
                const whatsappMessage = [
                    `Your login OTP is ${code}. Please use this code to continue your application.`,
                    "This code is valid for 10 minutes.",
                ];
                result = await sendWhatsAppMessage(to, whatsappMessage, "login code");
                break;
            case "email":
                const emailSubject = "Your BESC Admission Login Code";
                const emailHtmlBody = `
                    <p>Dear ${name || "Applicant"},</p>
                    <p>Your login OTP for BESC Admission is: <strong>${code}</strong></p>
                    <p>Please use this code to continue your application.</p>
                    <p>This code is valid for 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Best regards,</p>
                    <p>BESC Admissions Team</p>
                `;
                result = await sendZeptoMail(to, emailSubject, emailHtmlBody, name);
                break;
            default:
                return NextResponse.json(
                    { message: "Invalid notification type." },
                    { status: 400 }
                );
        }

        if (result && result.result === false) {
            return NextResponse.json(
                { message: result.message || `Failed to send ${type} notification.` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: `${type} notification sent successfully!` },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending notification:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 }
        );
    }
} 