import { NextRequest, NextResponse } from "next/server";
import { findStudentsByBatchId } from "@/lib/services/student.service";
import { verifyAccessToken } from "@/lib/auth";

// Export config to enable segment export
export const dynamic = 'force-dynamic';

// Define segment config
export const runtime = 'nodejs';

// Explicitly handle the dynamic route segment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ batchId: string }> }
) {
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

        // Safely access the batchId as a string
        const batchIdRaw = String((await params)?.batchId || "");

        // Log the raw value for debugging
        console.log("Raw batchId from URL:", batchIdRaw);

        if (!batchIdRaw) {
            return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
        }

        // Parse the batchId
        const batchId = parseInt(batchIdRaw);

        if (isNaN(batchId)) {
            return NextResponse.json({
                error: "Invalid batch ID format",
                received: batchIdRaw
            }, { status: 400 });
        }

        // Get pagination parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const size = parseInt(url.searchParams.get("size") || "10");

        console.log(`Fetching students for batch ID: ${batchId}, page: ${page}, size: ${size}`);

        // Fetch students from the specified batch
        const students = await findStudentsByBatchId(batchId, page, size);

        console.log(`Found ${students?.length || 0} students for batch ${batchId}`);

        return NextResponse.json(students || []);
    } catch (error) {
        console.error("Error fetching students by batch:", error);
        return NextResponse.json(
            { error: "Failed to fetch students", message: (error as Error).message },
            { status: 500 }
        );
    }
} 