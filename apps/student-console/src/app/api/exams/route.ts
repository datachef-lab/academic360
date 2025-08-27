import { NextResponse } from "next/server";
import { findExamsByStudentId } from "@/lib/services/exam.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentIdParam = searchParams.getAll("studentId");

        if (isNaN(Number(studentIdParam))) {
            return NextResponse.json([]);
        }

        const exams = await findExamsByStudentId(Number(studentIdParam));
        // Ensure we're returning an array
        return NextResponse.json(Array.isArray(exams) ? exams : []);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
} 