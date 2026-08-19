import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
} from "@/lib/services/academic-year.service";
import { createAcademicYearSchema } from "@/db/schema";
import { z } from "zod";
import { createTtlCache } from "@/lib/utils/ttl-cache";

// See @/lib/utils/ttl-cache for scope/limitations (60s, per-instance).
const listCache = createTtlCache<{ success: true; data: unknown }>(60_000);

export async function GET() {
  try {
    const cached = listCache.get();
    if (cached) {
      return NextResponse.json(cached);
    }
    const allAcademicYears = await getAllAcademicYears();
    const payload = { success: true as const, data: allAcademicYears };
    listCache.set(undefined, payload);
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch academic years", error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createAcademicYearSchema.parse(body);
    const newAcademicYear = await createAcademicYear(validatedData);
    listCache.clear();
    return NextResponse.json({ success: true, data: newAcademicYear });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create academic year", error: error.message },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }
    const body = await req.json();
    const validatedData = createAcademicYearSchema.parse(body);
    const updatedAcademicYear = await updateAcademicYear(Number(id), validatedData);
    if (!updatedAcademicYear) {
      return NextResponse.json(
        { success: false, message: "Academic year not found" },
        { status: 404 },
      );
    }
    listCache.clear();
    return NextResponse.json({ success: true, data: updatedAcademicYear });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update academic year", error: error.message },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }
    const deleted = await deleteAcademicYear(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Academic year not found" },
        { status: 404 },
      );
    }
    listCache.clear();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to delete academic year", error: error.message },
      { status: 500 },
    );
  }
}
