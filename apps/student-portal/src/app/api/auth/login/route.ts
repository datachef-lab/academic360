import { NextRequest, NextResponse } from 'next/server';
import { generateTokens, setAuthCookies } from '@/lib/services/auth';
import { findAccessControlByStudentId } from '@/lib/services/access-control.service';
import { findStudentByUidAndContact } from '@/lib/services/student.service';

// export async function POST(req: NextRequest) {
//     try {
//         const { email, password } = await req.json();

//         // Validate input
//         if (!email || !password) {
//             return NextResponse.json(
//                 { error: 'Email and password are required' },
//                 { status: 400 }
//             );
//         }

//         // Get user by email
//         const user = await getUserByEmail(email);
//         if (!user) {
//             return NextResponse.json(
//                 { error: 'Invalid email or password' },
//                 { status: 401 }
//             );
//         }

//         // User is disabled
//         if (user.disabled) {
//             return NextResponse.json(
//                 { error: 'Your account has been disabled' },
//                 { status: 403 }
//             );
//         }

//         // Check if password is correct
//         const isPasswordValid = await verifyPassword(password, user.password || '');

//         if (!isPasswordValid) {
//             return NextResponse.json(
//                 { error: 'Invalid email or password' },
//                 { status: 401 }
//             );
//         }

//         // Generate tokens
//         const tokens = generateTokens(user);

//         // Set cookies
//         setAuthCookies(tokens);

//         // Return user data and access token (access token to be stored in app state)
//         return NextResponse.json({
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 isAdmin: user.isAdmin,
//                 picture: user.picture
//             },
//             accessToken: tokens.accessToken,
//         });
//     } catch (error) {
//         console.error('Login error:', error);
//         return NextResponse.json(
//             { error: 'An error occurred during login' },
//             { status: 500 }
//         );
//     }
// } 



export async function POST(req: NextRequest) {
    try {
        const { uid, password } = await req.json();

        if (!uid || !password) {
            return NextResponse.json({ error: 'UID and password are required' }, { status: 400 });
        }

        console.log(`Login attempt for UID: ${uid}`);

        // Admin login check - no database check needed
        if (uid === 'admin' && password === 'admin') {
            console.log("Admin login successful");
            const tokens = generateTokens({
                id: 0,
                tmpApplicationId: null,
                name: 'Admin',
                codeNumber: 'admin',
                institutionalemail: 'admin@example.com',
                email: 'admin@example.com',
                isAdmin: true,
                // Add required fields with default values
                mailingPinNo: '',
                resiPinNo: '',
                admissionYear: 0,
                oldcodeNumber: '',
                active: true,
                alumni: false,
                contactNo: '',
                imgFile: '',
                applicantSignature: '',
                sexId: 0,
                mailingAddress: '',
                phoneMobileNo: '',
                residentialAddress: '',
                resiPhoneMobileNo: '',
                religionId: 0,
                studentCategoryId: 0,
                motherTongueId: 0,
                dateOfBirth: new Date(),
                nationalityId: 0,
                rollNumber: '',
                bloodGroup: 0,
                eyePowerLeft: '',
                eyePowerRight: '',
                emrgnResidentPhNo: '',
                emrgnOfficePhNo: '',
                emrgnMotherMobNo: '',
                emrgnFatherMobNo: '',
                lastInstitution: '',
                lastInstitutionAddress: '',
                handicapped: 'NO',
                handicappedDetails: '',
                lsmedium: '',
                annualFamilyIncome: '',
                lastBoardUniversity: 0,
                institutionId: 0,
                fatherName: '',
                fatherOccupation: 0,
                fatherOffPhone: '',
                fatherMobNo: '',
                fatherEmail: '',
                motherName: '',
                motherOccupation: 0,
                motherOffPhone: '',
                motherMobNo: '',
                motherEmail: '',
                guardianName: '',
                guardianOccupation: 0,
                guardianOffAddress: '',
                guardianOffPhone: '',
                guardianMobNo: '',
                guardianEmail: '',
                admissioncodeno: '',
                placeofstay: '',
                placeofstaycontactno: '',
                placeofstayaddr: '',
                universityRegNo: '',
                admissiondate: new Date(),
                emercontactpersonnm: '',
                emerpersreltostud: '',
                emercontactpersonmob: '',
                emercontactpersonphr: '',
                emercontactpersonpho: '',
                leavingdate: new Date().toISOString(),
                univregno: '',
                univlstexmrollno: '',
                communityid: 0,
                lspassedyr: 0,
                cuformno: '',
                chkrepeat: false,
                notes: '',
                fatherPic: '',
                motherPic: '',
                guardianPic: '',
                lastotherBoardUniversity: 0,
                boardresultid: 0,
                rfidno: '',
                specialisation: '',
                aadharcardno: '',
                leavingreason: '',
                localitytyp: '',
                rationcardtyp: '',
                fatheraadharno: '',
                motheraadharno: '',
                gurdianaadharno: '',
                issnglprnt: '',
                handicappedpercentage: '',
                disabilitycode: '',
                coursetype: null,
                whatsappno: '',
                alternativeemail: '',
                othernationality: '',
                pursuingca: '',
                abcid: '',
                apprid: '',
                // Add Nationality fields
                nationalityName: 'Admin',
                pos: 0,
                code: 'ADMIN'
            });

            const response = setAuthCookies(tokens);
            return NextResponse.json({
                user: {
                    id: 0,
                    name: 'Admin',
                    uid: 'admin',
                    email: 'admin@example.com',
                    isAdmin: true,
                    isSuspended: false,
                    restrictedFeatures: []
                },
                accessToken: tokens.accessToken,
                redirectTo: '/settings'
            }, response);
        }

        // Normal login flow
        try {
            // const user = await getUserByUid(uid);
            const user = await findStudentByUidAndContact(uid, password);
            console.log("user in fetching:", user);
            console.log(`User found for UID ${uid}:`, user ? "Yes" : "No");

            if (!user) {
                return NextResponse.json({ error: 'Invalid UID or password' }, { status: 401 });
            }

            // Simple password check for development
            // if (password !== "123") {
            //     return NextResponse.json({ error: 'Invalid UID or password' }, { status: 401 });
            // }

            console.log("Login successful for user:", user.name);
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
        } catch (error) {
            console.error("Error during getUserByUid:", error);
            return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
    }
}