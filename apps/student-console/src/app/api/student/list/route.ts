import { NextRequest, NextResponse } from "next/server";
import { findAll } from "@/lib/services/access-control.service";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        console.log("/api/student/list route hit");
        // Get pagination parameters from the URL
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const size = parseInt(searchParams.get("size") || "10");

        // Validate the requester is authenticated
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Get students from database (no search text for list)
        const result = await findAll(page, size, "");
        console.log("/api/student/list result:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching students (list):", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
} 