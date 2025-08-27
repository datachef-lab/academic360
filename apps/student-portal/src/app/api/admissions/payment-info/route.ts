import { NextRequest, NextResponse } from "next/server";
import {
    createPayment,
    deletePayment,
    findPaymentById,
    findPaymentInfoByApplicationFormId,
    findPaymentsByApplicationFormId,
    updatePayment
} from "@/lib/services/adm-payment.service";
import { Payment } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await createPayment(body as Payment);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const applicationFormId = searchParams.get("applicationFormId");
        const type = searchParams.get("type"); // "single" or "all"

        if (id) {
            const payment = await findPaymentById(parseInt(id));
            if (!payment) {
                return NextResponse.json(
                    { message: "Payment not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(payment);
        }

        if (applicationFormId) {
            if (type === "all") {
                const payments = await findPaymentsByApplicationFormId(parseInt(applicationFormId));
                return NextResponse.json(payments);
            } else {
                const payment = await findPaymentInfoByApplicationFormId(parseInt(applicationFormId));
                if (!payment) {
                    return NextResponse.json(
                        { message: "Payment not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json(payment);
            }
        }

        return NextResponse.json(
            { message: "Either id or applicationFormId is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Payment ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        try {
            const updatedPayment = await updatePayment({
                ...body,
                id: parseInt(id)
            } as Payment);

            if (!updatedPayment) {
                return NextResponse.json(
                    { message: "Payment not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(updatedPayment);
        } catch (error) {
            if (error instanceof Error && error.message === "Payment ID is required for update.") {
                return NextResponse.json(
                    { message: error.message },
                    { status: 400 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { message: "Payment ID is required" },
                { status: 400 }
            );
        }

        const success = await deletePayment(parseInt(id));

        if (!success) {
            return NextResponse.json(
                { message: "Payment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Payment deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting payment:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
