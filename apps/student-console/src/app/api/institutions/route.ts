import { NextRequest, NextResponse } from "next/server";
import {
  getAllInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  toggleInstitutionStatus,
  InstitutionResult,
} from "@/lib/services/institution.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await getInstitutionById(parseInt(id));
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Institution not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    }

    const institutions = await getAllInstitutions();
    return NextResponse.json({ success: true, data: institutions });
  } catch (error) {
    console.error("Error in GET /api/institutions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, degreeId, addressId, sequence } = body;

    if (!name || degreeId === undefined || degreeId === null) {
      return NextResponse.json(
        { success: false, error: "Name and degreeId are required" },
        { status: 400 }
      );
    }

    const result: InstitutionResult = await createInstitution(name, degreeId, addressId, sequence);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/institutions:", error);
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
    const { name, degreeId, addressId, sequence } = body;

    if (!name || degreeId === undefined || degreeId === null) {
      return NextResponse.json(
        { success: false, error: "Name and degreeId are required" },
        { status: 400 }
      );
    }

    const result: InstitutionResult = await updateInstitution(
      parseInt(id),
      name,
      degreeId,
      addressId,
      sequence
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/institutions:", error);
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

    const result: InstitutionResult = await toggleInstitutionStatus(
      parseInt(id)
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PATCH /api/institutions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 