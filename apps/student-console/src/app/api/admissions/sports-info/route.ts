import { NextRequest, NextResponse } from "next/server";
import { createSportsInfo, deleteSportsInfo, getSportsInfoByAdditionalInfoId, getSportsInfoById, updateSportsInfo } from "@/lib/services/adm-sports-info.service";
import { SportsInfo } from "@/db/schema";

// GET /api/admissions/sports-info/:id
export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        const additionalInfoId = request.nextUrl.searchParams.get("additionalInfoId");

        if (id) {
            const result = await getSportsInfoById(parseInt(id));
            return NextResponse.json(result);
        } else if (additionalInfoId) {
            const result = await getSportsInfoByAdditionalInfoId(parseInt(additionalInfoId));
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: "Either id or additionalInfoId is required" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in GET sports info:", error);
        return NextResponse.json({ error: "Failed to get sports info" }, { status: 500 });
    }
}

// POST /api/admissions/sports-info
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const result = await createSportsInfo(data);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in POST sports info:", error);
        return NextResponse.json({ error: "Failed to create sports info" }, { status: 500 });
    }
}

// PUT /api/admissions/sports-info/:id
export async function PUT(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const data = await request.json();
        const result = await updateSportsInfo(parseInt(id), data);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PUT sports info:", error);
        return NextResponse.json({ error: "Failed to update sports info" }, { status: 500 });
    }
}

// DELETE /api/admissions/sports-info/:id
export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const result = await deleteSportsInfo(parseInt(id));
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in DELETE sports info:", error);
        return NextResponse.json({ error: "Failed to delete sports info" }, { status: 500 });
    }
}
