import { NextRequest, NextResponse } from "next/server";
import { findAllCourse } from "@/lib/services/course.service";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Verify access token
        // const authHeader = request.headers.get("authorization");
        // console.log("Authorization header:", authHeader ? "Present" : "Missing");

        // if (!authHeader) {
        //     console.log("Returning 401 - No authorization header found");
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // const token = authHeader.split(" ")[1];
        // console.log("Token from header:", token ? "Present" : "Missing");

        // // Check if token is undefined or null
        // if (!token || token === "undefined" || token === "null") {
        //     console.log("Token is invalid:", token);
        //     return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        // }

        // const payload = verifyAccessToken(token);
        // console.log("Token verification result:", payload ? "Valid" : "Invalid");

        // if (!payload) {
        //     console.log("Returning 401 - Invalid token payload");
        //     return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        // }

        // Fetch all courses
        const courses = await findAllCourse();
        console.log(`Returning ${courses?.length || 0} courses`);

        return NextResponse.json(courses || []);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
} 