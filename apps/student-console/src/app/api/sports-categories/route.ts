import { NextRequest, NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  createSportCategory,
  getAllSportCategories,
  getSportCategoryById,
  updateSportCategory,
  deleteSportCategory,
} from "@/lib/services/adm-sports-category.service";
import { createTtlCache } from "@/lib/utils/ttl-cache";

// See @/lib/utils/ttl-cache for scope/limitations (60s, per-instance).
const listCache = createTtlCache<unknown>(60_000);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newCategory = await createSportCategory(body);
    listCache.clear();
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const category = await getSportCategoryById(Number(id));
      if (!category) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      return NextResponse.json(category);
    }
    const cached = listCache.get();
    if (cached) {
      return NextResponse.json(cached);
    }
    const categories = await getAllSportCategories();
    listCache.set(undefined, categories);
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    const body = await req.json();
    const updated = await updateSportCategory(Number(id), body);
    if (!updated) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    listCache.clear();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    const deleted = await deleteSportCategory(Number(id));
    if (!deleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    listCache.clear();
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
