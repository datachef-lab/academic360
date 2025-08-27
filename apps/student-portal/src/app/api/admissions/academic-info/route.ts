import { NextRequest, NextResponse } from "next/server";
import {
    createAcademicInfo,
    deleteAcademicInfo,
    findAcademicInfoById,
    findAcademicInfoByApplicationFormId,
    updateAcademicInfo
} from "@/lib/services/adm-academic-info.service";
import { AdmissionAcademicInfoDto } from "@/types/admissions";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const academicInfo = await createAcademicInfo(body as AdmissionAcademicInfoDto);
        return NextResponse.json(academicInfo, { status: 201 });
    } catch (error) {
        console.error("Error creating academic info:", error);
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

        if (id) {
            const academicInfo = await findAcademicInfoById(parseInt(id));
            if (!academicInfo) {
                return NextResponse.json(
                    { message: "Academic info not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(academicInfo);
        }

        if (applicationFormId) {
            const academicInfo = await findAcademicInfoByApplicationFormId(parseInt(applicationFormId));
            if (!academicInfo) {
                return NextResponse.json(
                    { message: "Academic info not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(academicInfo);
        }

        return NextResponse.json(
            { message: "Either id or applicationFormId is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching academic info:", error);
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
                { message: "Academic info ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        console.log("in academic-info, update, body:", body);
        console.log({
            ...body,
            id: parseInt(id)
        })
        const updatedAcademicInfo = await updateAcademicInfo({
            ...body,
            id: parseInt(id)
        } as AdmissionAcademicInfoDto);



        if (!updatedAcademicInfo) {
            return NextResponse.json(
                { message: "Academic info not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedAcademicInfo);
    } catch (error) {
        console.error("Error updating academic info:", error);
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
                { message: "Academic info ID is required" },
                { status: 400 }
            );
        }

        const result = await deleteAcademicInfo(parseInt(id));

        if (result === null) {
            return NextResponse.json(
                { message: "Academic info not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Academic info deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting academic info:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
