import { NextRequest, NextResponse } from "next/server";
import {  createCourse, updateCourse, findAllDbCourses } from "@/lib/services/course.service";
import { verifyAccessToken } from "@/lib/auth";
import { Course } from "@/db/schema";

async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
        return { error: "Unauthorized", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token === "null") {
        return { error: "Invalid token format", status: 401 };
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return { error: "Invalid token", status: 401 };
    }

    return { payload };
}

export async function GET(request: NextRequest) {
    try {
        // const authResult = await verifyAuth(request);
        // if ('error' in authResult) {
        //     return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        // }

        const courses = await findAllDbCourses();
        return NextResponse.json(courses || []);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // const authResult = await verifyAuth(request);
        // if ('error' in authResult) {
        //     return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        // }

        const body = await request.json();
        const course = body as Course;

        const newCourse = await createCourse(course);
        if (!newCourse) {
            return NextResponse.json(
                { error: "Course with this name already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json(
            { error: "Failed to create course" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        // const authResult = await verifyAuth(request);
        // if ('error' in authResult) {
        //     return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        // }

        const body = await request.json();
        const { id, ...courseData } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            );
        }

        const updatedCourse = await updateCourse(id, courseData);
        if (!updatedCourse) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Error updating course:", error);
        return NextResponse.json(
            { error: "Failed to update course" },
            { status: 500 }
        );
    }
}

