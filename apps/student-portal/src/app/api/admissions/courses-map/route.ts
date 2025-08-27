import { NextRequest, NextResponse } from "next/server";
import {
    createAdmissionCourse,
    deleteAdmissionCourse,
    findAdmissionCourseById,
    findAdmissionCourseByIdWithDetails,
    findAdmissionCoursesByAdmissionId,
    findAdmissionCoursesByAdmissionIdWithDetails,
    findAdmissionCoursesByCourseId,
    findAdmissionCoursesByCourseIdWithDetails,
    findAllActiveAdmissionCourses,
    findAllActiveAdmissionCoursesWithDetails,
    findAllAdmissionCourses,
    findAllAdmissionCoursesWithDetails,
    updateAdmissionCourse,
    disableAdmissionCourse,
    enableAdmissionCourse
} from "@/lib/services/adm-admision-courses.service";
import { AdmissionCourse } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await createAdmissionCourse(body as AdmissionCourse);

        if (result.message === "Admission course already exists.") {
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
        const admissionId = searchParams.get("admissionId");
        const courseId = searchParams.get("courseId");
        const active = searchParams.get("active");
        const withDetails = searchParams.get("withDetails");

        // Get by ID
        if (id) {
            if (withDetails === "true") {
                const course = await findAdmissionCourseByIdWithDetails(parseInt(id));
                if (!course) {
                    return NextResponse.json(
                        { message: "Admission course not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json(course);
            } else {
                const course = await findAdmissionCourseById(parseInt(id));
                if (!course) {
                    return NextResponse.json(
                        { message: "Admission course not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json(course);
            }
        }

        // Get by Admission ID
        if (admissionId) {
            if (withDetails === "true") {
                const courses = await findAdmissionCoursesByAdmissionIdWithDetails(parseInt(admissionId));
                return NextResponse.json(courses);
            } else {
                const courses = await findAdmissionCoursesByAdmissionId(parseInt(admissionId));
                return NextResponse.json(courses);
            }
        }

        // Get by Course ID
        if (courseId) {
            if (withDetails === "true") {
                const courses = await findAdmissionCoursesByCourseIdWithDetails(parseInt(courseId));
                return NextResponse.json(courses);
            } else {
                const courses = await findAdmissionCoursesByCourseId(parseInt(courseId));
                return NextResponse.json(courses);
            }
        }

        // Get all active courses
        if (active === "true") {
            if (withDetails === "true") {
                const courses = await findAllActiveAdmissionCoursesWithDetails();
                return NextResponse.json(courses);
            } else {
                const courses = await findAllActiveAdmissionCourses();
                return NextResponse.json(courses);
            }
        }

        // Get all courses
        if (withDetails === "true") {
            const courses = await findAllAdmissionCoursesWithDetails();
            return NextResponse.json(courses);
        } else {
            const courses = await findAllAdmissionCourses();
            return NextResponse.json(courses);
        }
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
        const action = searchParams.get("action");

        if (!id) {
            return NextResponse.json(
                { message: "Admission course ID is required" },
                { status: 400 }
            );
        }

        // Handle special actions
        if (action === "disable") {
            const disabledCourse = await disableAdmissionCourse(parseInt(id));
            if (!disabledCourse) {
                return NextResponse.json(
                    { message: "Admission course not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(disabledCourse);
        }

        if (action === "enable") {
            const enabledCourse = await enableAdmissionCourse(parseInt(id));
            if (!enabledCourse) {
                return NextResponse.json(
                    { message: "Admission course not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(enabledCourse);
        }

        // Regular update
        const body = await req.json();
        const updatedCourse = await updateAdmissionCourse({
            ...body,
            id: parseInt(id)
        } as AdmissionCourse);

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
