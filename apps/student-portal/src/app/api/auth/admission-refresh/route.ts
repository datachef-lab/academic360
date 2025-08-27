import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateTokens, verifyApplicationForm, setAuthCookies, setApplicationFormCookies, generateApplicationFormToken } from '@/lib/services/auth';
import { Student } from '@/types/academics/student';
import { findAccessControlByStudentId } from '@/lib/services/access-control.service';
import { ApplicationForm } from '@/db/schema';
import { findApplicationFormById } from '@/lib/services/application-form.service';
import { findStudentByApplicationId } from '@/lib/services/student.service';
import { findAdmissionById } from '@/lib/services/admission.service';

export async function GET() {
    try {
        // Get `applicationForm` from cookies
        const cookieStore = await cookies();
        const applicationFormToken = cookieStore.get('applicationForm')?.value;

        // No application-form token, return error
        if (!applicationFormToken) {
            return NextResponse.json(
                { error: 'No application-form provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        let applicationForm = verifyApplicationForm(applicationFormToken);
        console.log("in applicationForm,", applicationForm);

        if (!applicationForm) {
            return NextResponse.json(
                { error: 'Invalid application-form-token' },
                { status: 401 }
            );
        }

        applicationForm = await findApplicationFormById(applicationForm.id!);

        if (!applicationForm) {
            return NextResponse.json(
                { error: 'application-form not found' },
                { status: 404 }
            );
        }

        const admision = await findAdmissionById(applicationForm.admissionId!);
        if (!admision || admision.isClosed == true) {
            return NextResponse.json(
                { error: 'application-form not found' },
                { status: 404 }
            );
        }

        let response: NextResponse<unknown> | undefined;

        if (applicationForm?.formStatus === "APPROVED") {
            const user = await findStudentByApplicationId(applicationForm.id!);
            if (user) {
                const tokens = generateTokens(user);

                const response = setAuthCookies(tokens);
                const accessControl = await findAccessControlByStudentId(user.id as number);
                return NextResponse.json({
                    user: {
                        id: user.id,
                        name: user.name,
                        uid: user.codeNumber,
                        email: user.institutionalemail,
                        isAdmin: user.isAdmin,
                    },
                    accessControl,
                    accessToken: tokens.accessToken,
                    redirectTo: '/dashboard'
                }, response);
            }
        }
        else {
            const token = generateApplicationFormToken(applicationForm!);
            response = setApplicationFormCookies(token);
            return NextResponse.json({ applicationForm }, response);
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'An error occurred during token refresh' },
            { status: 500 }
        );
    }
} 