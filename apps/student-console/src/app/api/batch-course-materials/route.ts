import { NextResponse } from "next/server";
import { findCourseMaterialsBySubjects } from "@/lib/services/course-material.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subjectIdsParam = searchParams.getAll("subjectIds");

        if (!subjectIdsParam.length) {
            return NextResponse.json(
                { error: "Subject IDs are required" },
                { status: 400 }
            );
        }

        // Convert the subject IDs to numbers and filter out any invalid values
        const subjectIds = subjectIdsParam
            .map(id => parseInt(id))
            .filter(id => !isNaN(id));

        if (!subjectIds.length) {
            return NextResponse.json(
                { error: "No valid subject IDs provided" },
                { status: 400 }
            );
        }

        console.log(`Processing batch request for ${subjectIds.length} subjects: ${subjectIds.join(', ')}`);
        const materials = await findCourseMaterialsBySubjects(subjectIds);

        return NextResponse.json(materials);
    } catch (error) {
        console.error("Error fetching batch course materials:", error);
        return NextResponse.json(
            { error: "Failed to fetch course materials" },
            { status: 500 }
        );
    }
} 