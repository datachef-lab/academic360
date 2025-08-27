import { NextRequest, NextResponse } from "next/server";
import { findBatchesMetadataByCourseId } from "@/lib/services/batch.service";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Verify access token
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Get course ID from query parameters
        const url = new URL(request.url);
        const courseId = parseInt(url.searchParams.get("courseId") || "0");

        if (isNaN(courseId) || courseId <= 0) {
            return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
        }

        // Fetch batches for the specified course
        const batches = await findBatchesMetadataByCourseId(courseId);

        return NextResponse.json(batches || []);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json(
            { error: "Failed to fetch batches" },
            { status: 500 }
        );
    }
} 