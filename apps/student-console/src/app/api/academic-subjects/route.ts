import { NextResponse } from "next/server";
import { dbPostgres } from "@/db";
import { academicSubjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSubject, updateSubject, toggleSubjectStatus, getAllSubjects } from "@/lib/services/academic-subject.service";

export async function GET() {
  try {
    const academicSubjects = await getAllSubjects();
    return NextResponse.json({ success: true, data: academicSubjects });
  } catch (error) {
    console.error("Error fetching academic subjects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch academic subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createSubject(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating academic subject:", error);
    return NextResponse.json({ error: "Failed to create academic subject" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const updatedSubject = await updateSubject(parseInt(id), body);

    if (!updatedSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error("Error updating academic subject:", error);
    return NextResponse.json({ error: "Failed to update academic subject" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await toggleSubjectStatus(parseInt(id));

    if (!result) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling subject status:", error);
    return NextResponse.json({ error: "Failed to toggle subject status" }, { status: 500 });
  }
} 