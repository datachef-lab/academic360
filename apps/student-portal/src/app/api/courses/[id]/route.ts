import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { findCourseById } from "@/lib/services/course.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const user = await verifyAccessToken(token);
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const course = await findCourseById(+(await params).id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 