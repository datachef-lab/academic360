import { NextRequest, NextResponse } from "next/server";
import {
    createAdmissionCourse,
    deleteAdmissionCourse,
    findAdmissionCourseById,
    findAdmissionCoursesByApplicationFormId,
    updateAdmissionCourse
} from "@/lib/services/adm-course-info.service";
import { AdmissionCourseApplication } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await createAdmissionCourse(body as AdmissionCourseApplication);

        if (result.message === "Course already exists.") {
            return NextResponse.json(
                { message: result.message, course: result.course },
                { status: 409 }
            );
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating admission course:", error);
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
        const applicationFormId = searchParams.get("applicationFormId");

        if (id) {
            const course = await findAdmissionCourseById(parseInt(id));
            if (!course) {
                return NextResponse.json(
                    { message: "Admission course not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(course);
        }

        if (applicationFormId) {
            const courses = await findAdmissionCoursesByApplicationFormId(parseInt(applicationFormId));
            return NextResponse.json(courses);
        }

        return NextResponse.json(
            { message: "Either id or applicationFormId is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching admission courses:", error);
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
                { message: "Admission course ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const updatedCourse = await updateAdmissionCourse({
            ...body,
            id: parseInt(id)
        } as AdmissionCourseApplication);

        if (!updatedCourse) {
            return NextResponse.json(
                { message: "Admission course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Error updating admission course:", error);
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
                { message: "Admission course ID is required" },
                { status: 400 }
            );
        }

        const success = await deleteAdmissionCourse(parseInt(id));

        if (!success) {
            return NextResponse.json(
                { message: "Admission course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Admission course deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting admission course:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
