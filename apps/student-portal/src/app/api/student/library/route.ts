import { findIssuesByStudentId } from "@/lib/services/library.service";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json(
                { error: "Student ID is required" },
                { status: 400 }
            );
        }

        const result = await findIssuesByStudentId(parseInt(studentId));

        console.log("in api, lib result:", result.length);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching lib:", error);
        return NextResponse.json(
            { error: "Failed to fetch lib" },
            { status: 500 }
        );
    }
} 