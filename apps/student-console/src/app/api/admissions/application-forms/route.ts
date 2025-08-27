import { NextRequest, NextResponse } from "next/server";
import { createApplicationForm, deleteApplicationForm, findApplicationFormById, findApplicationFormsByAdmissionId, updateApplicationForm } from "@/lib/services/application-form.service";
import { ApplicationForm, AdmissionGeneralInfo } from "@/db/schema";
import { ApplicationFormDto } from "@/types/admissions";
import { generateApplicationFormToken, setApplicationFormCookies } from "@/lib/services/auth";

async function tmp(applicationForm: ApplicationFormDto) {
    try {

        let response: NextResponse<unknown> | undefined;        
        const token = generateApplicationFormToken(applicationForm!);
        response = setApplicationFormCookies(token);
        return NextResponse.json({ applicationForm }, response);
        

    } catch (error) {
        console.error("Error during adm-create-login:", error);
        return NextResponse.json({ error: 'User lookup failed' }, { status: 404 });
    }
}
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { form, generalInfo } = body;
console.log(body);
        if (!form || !generalInfo) {
            return NextResponse.json(
                { message: "Form and general info are required" },
                { status: 400 }
            );
        }

        const result = await createApplicationForm(form as ApplicationForm, generalInfo as AdmissionGeneralInfo);
        
        if (!result.applicationForm) {
            return NextResponse.json(
                { message: result.message },
                { status: 400 }
            );
        }

        let response: NextResponse<unknown> | undefined;        
        const token = generateApplicationFormToken(result.applicationForm as ApplicationFormDto);
        response = setApplicationFormCookies(token);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating application form:", error);
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
        const admissionId = searchParams.get("admissionId");

        if (id) {
            const form = await findApplicationFormById(parseInt(id));
            if (!form) {
                return NextResponse.json(
                    { message: "Application form not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(form);
        }

        if (admissionId) {
            const forms = await findApplicationFormsByAdmissionId(parseInt(admissionId));
            return NextResponse.json(forms);
        }

        return NextResponse.json(
            { message: "Either id or admissionId is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching application form:", error);
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
                { message: "Application form ID is required" },
                { status: 400 }
            );
        }

        const body = await req.json();
        console.log("in application form update api:", body);
        const updatedForm = await updateApplicationForm(parseInt(id), body.form);

        if (!updatedForm) {
            return NextResponse.json(
                { message: "Application form not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedForm);
    } catch (error) {
        console.error("Error updating application form:", error);
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
                { message: "Application form ID is required" },
                { status: 400 }
            );
        }

        const result = await deleteApplicationForm(parseInt(id));

        if (result === null) {
            return NextResponse.json(
                { message: "Application form not found" },
                { status: 404 }
            );
        }

        if (typeof result === "object" && !result.success) {
            return NextResponse.json(
                { message: result.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Application form deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting application form:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
