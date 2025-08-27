import { NextResponse } from "next/server";


export async function POST() {
    try {
        // Clear auth cookies
        const response = NextResponse.json({ success: true });

        response.cookies.delete("refreshToken");
        response.cookies.delete("accessToken");

        return response;
    } catch (error) {
        console.error("Error during logout:", error);
        return NextResponse.json(
            { error: "Failed to logout" },
            { status: 500 }
        );
    }
} 