import { NextResponse } from "next/server";
import { 
    createDegree, 
    getAllDegrees, 
    getDegreeById, 
    updateDegree, 
    toggleDegreeStatus 
} from "@/lib/services/degree.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            const result = await getDegreeById(parseInt(id));
            if (!result) {
                return NextResponse.json({ success: false, error: "Degree not found" }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: result });
        }

        const degrees = await getAllDegrees();
        return NextResponse.json({ success: true, data: degrees });
    } catch (error) {
        console.error("Error in GET /api/degrees:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await createDegree(body);
        
        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }
        
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/degrees:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const result = await updateDegree(parseInt(id), body);
        
        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PUT /api/degrees:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
        }

        const result = await toggleDegreeStatus(parseInt(id));
        
        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PATCH /api/degrees:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
} 