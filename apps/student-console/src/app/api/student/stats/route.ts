import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// import { findStats } from "@/lib/services/access-control.service";

export async function GET() {
  try {
    // Use the server action instead of direct database call
    // const stats = await findStats();
    const stats: unknown = {};

    if (!stats) {
      return NextResponse.json({ error: "stats not found" }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
