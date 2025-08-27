import { NextRequest, NextResponse } from 'next/server';
import { generateApplicationFormToken, generateTokens, setApplicationFormCookies, setAuthCookies } from '@/lib/services/auth';
import { findAccessControlByStudentId } from '@/lib/services/access-control.service';
import { findStudentByApplicationId } from '@/lib/services/student.service';
import { findByLoginIdAndPassword } from '@/lib/services/adm-general-info.service';

export async function POST(req: NextRequest) {
    try {
        const { loginId, password } = await req.json();

        if (!loginId || !password) {
            return NextResponse.json({ error: 'Login-Id and password are required' }, { status: 400 });
        }

        console.log(`Login attempt for: ${loginId}`);


        // Normal login flow
        try {
            const result = await findByLoginIdAndPassword(loginId, password);
            console.log("result in adm-fetching:", result);
            console.log(`User found for loginid ${loginId}:`, result ? "Yes" : "No");

            if (!result) {
                return NextResponse.json({ error: 'Invalid login-id or password' }, { status: 401 });
            }

            const { applicationForm } = result;

            console.log("Login successful for applicant:", applicationForm?.generalInfo!.firstName);

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
            console.error("Error during adm-login:", error);
            return NextResponse.json({ error: 'User lookup failed' }, { status: 404 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
    }
}