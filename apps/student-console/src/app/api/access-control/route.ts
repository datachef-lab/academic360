import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// import { findAccessControlByStudentId } from "@/lib/services/access-control.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.getAll("studentId");

    if (isNaN(Number(studentIdParam))) {
      return NextResponse.json([]);
    }

    // const accessControl = await findAccessControlByStudentId(+studentIdParam);

    return NextResponse.json({});
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
