import { NextRequest, NextResponse } from "next/server";
import {
  createSportCategory,
  getAllSportCategories,
  getSportCategoryById,
  updateSportCategory,
  deleteSportCategory
} from "@/lib/services/adm-sports-category.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newCategory = await createSportCategory(body);
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
    const categories = await getAllSportCategories();
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
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
