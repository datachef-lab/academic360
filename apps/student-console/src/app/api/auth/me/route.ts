import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SignJWT } from "jose";
import { getUserByEmail, getUserByUid, verifyRefreshToken } from "@/lib/services/auth";
import { findAccessControlByStudentId } from "@/lib/services/access-control.service";

export async function GET() {
    try {
        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token found" },
                { status: 401 }
            );
        }

        // Verify the refresh token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const payload = await verifyRefreshToken(refreshToken);
        console.log("in refresh, payload:", payload);

        // Look up user by either uid or email
        let user;
        if (payload?.uid) {
            user = await getUserByUid(payload.uid);
        } else if (payload?.email) {
            user = await getUserByEmail(payload.email);
        }

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Generate new access token with SAME payload structure as the original token
        // This ensures consistency between login and refresh
        const newTokenPayload = {
            userId: user.id,
            uid: user.codeNumber,
            email: user.email || user.institutionalemail,
            name: user.name,
            isAdmin: user.isAdmin
        };

        const accessControl = await findAccessControlByStudentId(user.id as number);

        console.log("accessControl:", accessControl)

        const accessToken = await new SignJWT(newTokenPayload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secret);

        return NextResponse.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email || user.institutionalemail,
                codeNumber: user.codeNumber,
                isAdmin: user.isAdmin
            },
            accessControl
        });
    } catch (error) {
        console.error("Error in /api/auth/me:", error);
        return NextResponse.json(
            { error: "Failed to verify session" },
            { status: 500 }
        );
    }
} 