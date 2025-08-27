import { NextRequest, NextResponse } from "next/server";
import { createBloodGroup, getAllBloodGroups, getBloodGroupById, toggleBloodGroupStatus, updateBloodGroup } from "@/lib/services/blood-group.service";
import { createBloodGroupSchema } from "@/db/schema";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (id) {
            const result = await getBloodGroupById(parseInt(id));
            if (!result) {
                return NextResponse.json({ error: "Blood group not found" }, { status: 404 });
            }
            return NextResponse.json(result);
        }

        const bloodGroups = await getAllBloodGroups();
        return NextResponse.json(bloodGroups);
    } catch (error) {
        console.error("Error in GET /api/blood-groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createBloodGroupSchema.parse(body);
        
        const result = await createBloodGroup(validatedData);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result.data, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error in POST /api/blood-groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = createBloodGroupSchema.partial().parse(body);
        
        const result = await updateBloodGroup(parseInt(id), validatedData);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result.data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error in PUT /api/blood-groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const result = await toggleBloodGroupStatus(parseInt(id));
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json(result.data);
    } catch (error) {
        console.error("Error in PATCH /api/blood-groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 