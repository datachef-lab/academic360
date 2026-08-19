import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "@/lib/services/department.service";
import { createDepartmentSchema } from "@/db/schema";
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
    const allDepartments = await getAllDepartments();
    const payload = { success: true as const, data: allDepartments };
    listCache.set(undefined, payload);
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch departments", error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createDepartmentSchema.parse(body);
    const newDepartment = await createDepartment(validatedData);
    listCache.clear();
    return NextResponse.json({ success: true, data: newDepartment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create department", error: error.message },
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
    const validatedData = createDepartmentSchema.parse(body);
    const updatedDepartment = await updateDepartment(Number(id), validatedData);
    if (!updatedDepartment) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 },
      );
    }
    listCache.clear();
    return NextResponse.json({ success: true, data: updatedDepartment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update department", error: error.message },
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
    const deleted = await deleteDepartment(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Department not found" },
        { status: 404 },
      );
    }
    listCache.clear();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to delete department", error: error.message },
      { status: 500 },
    );
  }
}
