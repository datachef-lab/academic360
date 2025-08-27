import { NextRequest, NextResponse } from "next/server";
// import { findStudentsBySearch } from "@/lib/services/student-service";
import { verifyAccessToken } from "@/lib/auth";
import { findAll } from "@/lib/services/access-control.service";

export async function GET(request: NextRequest) {
    try {
        console.log("API route hit");
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

        // Get search parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const size = parseInt(url.searchParams.get("size") || "10");
        const query = url.searchParams.get("query") || "";

        console.log(`Searching students with query: '${query}', page: ${page}, size: ${size}`);

        // Search students with the query
        const result = await findAll(page, size, query);

        console.log(`Found ${result.data.length || 0} students matching query`);
        console.log("result:", result)
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error searching students:", error);
        return NextResponse.json(
            { error: "Failed to search students" },
            { status: 500 }
        );
    }
} 