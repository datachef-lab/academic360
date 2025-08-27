import { NextRequest, NextResponse } from "next/server";
import {
  getAllLanguageMediums,
  getLanguageMediumById,
  createLanguageMedium,
  updateLanguageMedium,
  toggleLanguageMediumStatus,
  LanguageMediumResult,
} from "@/lib/services/language-medium.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await getLanguageMediumById(parseInt(id));
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Language medium not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    }

    const languageMediums = await getAllLanguageMediums();
    return NextResponse.json({ success: true, data: languageMediums });
  } catch (error) {
    console.error("Error in GET /api/language-mediums:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const result: LanguageMediumResult = await createLanguageMedium(name);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/language-mediums:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const result: LanguageMediumResult = await updateLanguageMedium(
      parseInt(id),
      name
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/language-mediums:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const result: LanguageMediumResult = await toggleLanguageMediumStatus(
      parseInt(id)
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PATCH /api/language-mediums:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 