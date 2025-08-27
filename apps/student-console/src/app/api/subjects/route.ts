import { NextResponse } from "next/server";
import { findSubjectsByCourseAndClass } from "@/lib/services/subject.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        const classId = searchParams.get("classId");

        if (!courseId || !classId) {
            return NextResponse.json(
                { error: "Course ID and Class ID are required" },
                { status: 400 }
            );
        }

        const subjects = await findSubjectsByCourseAndClass(
            parseInt(courseId),
            parseInt(classId)
        );
        console.log("in api, subjects:", subjects.length);
        return NextResponse.json(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
} 