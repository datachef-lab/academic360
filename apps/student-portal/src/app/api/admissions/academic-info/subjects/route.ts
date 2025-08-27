import { NextRequest, NextResponse } from "next/server";
import {
    createSubject,
    deleteSubject,
    findSubjectById,
    findSubjectsByAcademicInfoId,
    updateSubject
} from "@/lib/services/adm-student-subject.service";
import { StudentAcademicSubject } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await createSubject(body as StudentAcademicSubject);

        if (result.message === "Subject already exists for this academic info.") {
            return NextResponse.json(
                { message: result.message, subject: result.subject },
                { status: 409 }
            );
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating student subject:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const academicInfoId = searchParams.get("academicInfoId");

        if (id) {
            const subject = await findSubjectById(parseInt(id));
            if (!subject) {
                return NextResponse.json(
                    { message: "Student subject not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(subject);
        }

        if (academicInfoId) {
            const subjects = await findSubjectsByAcademicInfoId(parseInt(academicInfoId));
            return NextResponse.json(subjects);
        }

        return NextResponse.json(
            { message: "Either id or academicInfoId is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching student subjects:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Student subject ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        try {
            const updatedSubject = await updateSubject({
                ...body,
                id: parseInt(id)
            } as StudentAcademicSubject);

            if (!updatedSubject) {
                return NextResponse.json(
                    { message: "Student subject not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(updatedSubject);
        } catch (error) {
            if (error instanceof Error && error.message === "Subject ID is required for update.") {
                return NextResponse.json(
                    { message: error.message },
                    { status: 400 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error("Error updating student subject:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Student subject ID is required" },
                { status: 400 }
            );
        }

        const success = await deleteSubject(parseInt(id));

        if (!success) {
            return NextResponse.json(
                { message: "Student subject not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Student subject deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting student subject:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
