import { NextRequest, NextResponse } from "next/server";
import { findFeesByStudentId } from "@/lib/services/instalment.service";

export async function GET(req: NextRequest) {
    const studentId = req.nextUrl.searchParams.get("studentId");

    if (!studentId) {
        return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    try {
        // Use the server action instead of direct database call
        const fees = await findFeesByStudentId(Number(studentId));

        if (!fees) {
            return NextResponse.json({ error: "fees not found" }, { status: 404 });
        }

        return NextResponse.json(fees);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
