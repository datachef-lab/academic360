import { NextRequest, NextResponse } from "next/server";
import { createAnnualIncome, getAllAnnualIncomes, getAnnualIncomeById, toggleAnnualIncomeStatus, updateAnnualIncome } from "@/lib/services/annual-income.service";
// import { createAnnualIncomeSchema } from "@/db/schema";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (id) {
            const result = await getAnnualIncomeById(parseInt(id));
            if (!result) {
                return NextResponse.json({ error: "Annual income not found" }, { status: 404 });
            }
            return NextResponse.json(result);
        }

        const annualIncomes = await getAllAnnualIncomes();
        return NextResponse.json(annualIncomes);
    } catch (error) {
        console.error("Error in GET /api/annual-incomes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // const validatedData = createAnnualIncomeSchema.parse(body);
        
        const result = await createAnnualIncome(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result.data, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error in POST /api/annual-incomes:", error);
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
        // const validatedData = createAnnualIncomeSchema.partial().parse(body);
        
        const result = await updateAnnualIncome(parseInt(id), body);
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result.data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error in PUT /api/annual-incomes:", error);
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

        const result = await toggleAnnualIncomeStatus(parseInt(id));
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json(result.data);
    } catch (error) {
        console.error("Error in PATCH /api/annual-incomes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 