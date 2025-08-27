import { NextRequest, NextResponse } from "next/server";
import { createAdmissionAdditionalInfo, deleteAdmissionAdditionalInfo, findAdditionalInfoByApplicationFormId, findAdditionalInfoById, updateAdmissionAdditionalInfo } from "@/lib/services/adm-additional-info.service";

// GET /api/admissions/additional-info
export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        const applicationFormId = request.nextUrl.searchParams.get("applicationFormId");

        if (id) {
            const result = await findAdditionalInfoById(parseInt(id));
            if (!result) {
                return NextResponse.json({ error: "Additional info not found" }, { status: 404 });
            }
            return NextResponse.json(result);
        } 
        
        if (applicationFormId) {
            const result = await findAdditionalInfoByApplicationFormId(parseInt(applicationFormId));
            if (!result) {
                return NextResponse.json({ error: "Additional info not found for this application" }, { status: 404 });
            }
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Either id or applicationFormId is required" }, { status: 400 });
    } catch (error) {
        console.error("Error in GET additional info:", error);
        return NextResponse.json({ error: "Failed to get additional info" }, { status: 500 });
    }
}

// POST /api/admissions/additional-info
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        
        if (!data.applicationFormId) {
            return NextResponse.json({ error: "Application form ID is required" }, { status: 400 });
        }

        const result = await createAdmissionAdditionalInfo(data);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in POST additional info:", error);
        return NextResponse.json({ error: "Failed to create additional info" }, { status: 500 });
    }
}

// PUT /api/admissions/additional-info/:id
export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        
        if (!data.id) {
            return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
        }

        const result = await updateAdmissionAdditionalInfo(data);
        if (!result) {
            return NextResponse.json({ error: "Additional info not found" }, { status: 404 });
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PUT additional info:", error);
        return NextResponse.json({ error: "Failed to update additional info" }, { status: 500 });
    }
}

// DELETE /api/admissions/additional-info/:id
export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const result = await deleteAdmissionAdditionalInfo(parseInt(id));
        if (!result) {
            return NextResponse.json({ error: "Additional info not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE additional info:", error);
        return NextResponse.json({ error: "Failed to delete additional info" }, { status: 500 });
    }
}
