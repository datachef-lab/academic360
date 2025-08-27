import { NextResponse } from "next/server";
import { findCourseMaterialBySubject, addCourseMaterial, deleteCourseMaterial } from "@/lib/services/course-material.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get("subjectId");

        if (!subjectId) {
            return NextResponse.json(
                { error: "Subject ID is required" },
                { status: 400 }
            );
        }

        const materials = await findCourseMaterialBySubject(parseInt(subjectId));
        return NextResponse.json(materials);
    } catch (error) {
        console.error("Error fetching course materials:", error);
        return NextResponse.json(
            { error: "Failed to fetch course materials" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const subjectId = formData.get("subjectId");
        const title = formData.get("title");
        const type = formData.get("type");
        const url = formData.get("url");
        const file = formData.get("file") as File | null;

        if (!subjectId || !title || !type) {
            return NextResponse.json(
                { error: "Required fields are missing" },
                { status: 400 }
            );
        }

        const courseMaterial = {
            subject_id_fk: parseInt(subjectId.toString()),
            title: title.toString(),
            type: type.toString() as "file" | "link",
            url: url?.toString() || "",
            file_path: null,
        };

        const result = await addCourseMaterial(courseMaterial, file ? [file] : undefined);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error adding course material:", error);
        return NextResponse.json(
            { error: "Failed to add course material" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Material ID is required" },
                { status: 400 }
            );
        }

        const result = await deleteCourseMaterial(parseInt(id));
        if (!result) {
            return NextResponse.json(
                { error: "Failed to delete course material" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting course material:", error);
        return NextResponse.json(
            { error: "Failed to delete course material" },
            { status: 500 }
        );
    }
} 