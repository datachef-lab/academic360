import { NextRequest, NextResponse } from "next/server";
import {
    createGeneralInfo,
    deleteGeneralInfo,
    findGeneralInfoById,
    findGeneralInfoByApplicationFormId,
    updateGeneralInfo,
    findByLoginIdAndPassword,
    checkExistingEntry
} from "@/lib/services/adm-general-info.service";
import { AdmissionGeneralInfo } from "@/db/schema";

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");

        // Handle login action
        if (action === "login") {
            const { mobileNumber, password } = await req.json();
            
            if (!mobileNumber || !password) {
                return NextResponse.json(
                    { message: "Mobile number and password are required" },
                    { status: 400 }
                );
            }

            const result = await findByLoginIdAndPassword(mobileNumber, password);
            if (!result) {
                return NextResponse.json(
                    { message: "Invalid credentials" },
                    { status: 401 }
                );
            }

            return NextResponse.json(result);
        }

        // Handle create action
        const body = await req.json();
        const result = await createGeneralInfo(body as Omit<AdmissionGeneralInfo, "id" | "createdAt" | "updatedAt">);

        if (result.message === "General info already exists for this student.") {
            return NextResponse.json(
                { message: result.message, generalInfo: result.generalInfo },
                { status: 409 }
            );
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error in general info operation:", error);
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
        const admissionId = searchParams.get("admissionId");
        const mobileNumber = searchParams.get("mobileNumber");

        if (admissionId && mobileNumber) {
            const entry = await checkExistingEntry(Number(admissionId), { mobileNumber: String(mobileNumber) });
            if (entry) {
                return NextResponse.json(entry, { status: 200 });
            } else {
                return NextResponse.json({ message: "No existing entry found" }, { status: 404 });
            }
        }

        if (id) {
            const generalInfo = await findGeneralInfoById(parseInt(id));
            if (!generalInfo) {
                return NextResponse.json(
                    { message: "General info not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(generalInfo);
        }

        if (applicationFormId) {
            const generalInfo = await findGeneralInfoByApplicationFormId(parseInt(applicationFormId));
            if (!generalInfo) {
                return NextResponse.json(
                    { message: "General info not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(generalInfo);
        }

        return NextResponse.json(
            { message: "Either id, applicationFormId, or (admissionId and mobileNumber) is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching general info:", error);
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
                { message: "General info ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const updatedGeneralInfo = await updateGeneralInfo({
            ...body,
            id: parseInt(id)
        } as AdmissionGeneralInfo);

        if (!updatedGeneralInfo) {
            return NextResponse.json(
                { message: "General info not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedGeneralInfo);
    } catch (error) {
        console.error("Error updating general info:", error);
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
                { message: "General info ID is required" },
                { status: 400 }
            );
        }

        const result = await deleteGeneralInfo(parseInt(id));

        if (result === null) {
            return NextResponse.json(
                { message: "General info not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "General info deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting general info:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
