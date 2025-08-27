import { NextRequest, NextResponse } from "next/server";
import { updateAccessControl } from "@/lib/services/access-control.service";

// PUT endpoint to update student access permissions
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate authorization (basic check)
        const { id } = await params;

        const { status, access_course, access_library, access_exams } = await request.json();

        const updatedStudent = await updateAccessControl({
            id: parseInt(id), status, access_course, access_library, access_exams,
        });

        return NextResponse.json(updatedStudent, { status: 200 });

    } catch (error) {
        console.error("Error updating student access:", error);

        return NextResponse.json(
            { error: "Failed to update student access" },
            { status: 500 }
        );
    }
} 