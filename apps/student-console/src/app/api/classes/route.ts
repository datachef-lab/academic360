import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { findAllClasses } from "@/lib/services/class.service";

export async function GET() {
  try {
    const classes = await findAllClasses();
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
