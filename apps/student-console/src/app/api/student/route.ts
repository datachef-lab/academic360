import { NextRequest, NextResponse } from "next/server";
import { getStudentByUid } from "@/app/actions/student-actions";

export async function GET(req: NextRequest) {
    const uid = req.nextUrl.searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    try {
        // Use the server action instead of direct database call
        const student = await getStudentByUid(uid);

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json({ student });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
