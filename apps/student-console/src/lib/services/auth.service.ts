// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// import { NextResponse } from 'next/server';
// import { Student } from '@/types/academics/student';
// import { findStudentByEmail, findStudentByUid } from './student.service';
// import { ApplicationFormDto } from '@/types/admissions';
// import { axiosInstance } from '../utils';
import type { UserDto } from "@repo/db/dtos/user";
import { ApiResponse } from "@/types/api-response";
import { axiosInstance } from "@/lib/utils";

// Export all auth service functions

// // JWT Secret should be in environment variables
// const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

// // Token expiration times
// const ACCESS_TOKEN_EXPIRY = '1d'; // 1d
// const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// // Interface for token payloads
// export interface TokenPayload {
//     userId: number;
//     email: string;
//     uid: string,
//     name: string;
//     isAdmin?: boolean;
// }

// // Interface for auth tokens
// export interface AuthTokens {
//     accessToken: string;
//     refreshToken: string;
// }

// // Generate hash for password
// export async function hashPassword(password: string): Promise<string> {
//     const saltRounds = 10;
//     return await bcrypt.hash(password, saltRounds);
// }

// // Verify password against hash
// export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
//     return await bcrypt.compare(password, hashedPassword);
// }

// // Generate JWT tokens
// export function generateTokens(user: Student): AuthTokens {
//     const payload: TokenPayload = {
//         userId: user?.id as number,
//         uid: user.codeNumber as string,
//         email: user.institutionalemail as string,
//         name: user.name,
//         isAdmin: user.codeNumber === 'admin' // Add admin flag for admin user
//     };

//     const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
//     const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

//     return { accessToken, refreshToken };
// }

// // Verify JWT access token
// export function verifyAccessToken(token: string): TokenPayload | null {
//     try {
//         const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
//         return decoded;
//     } catch (error) {
//         console.log(error)
//         return null;
//     }
// }

// // Verify JWT refresh token
// export function verifyRefreshToken(token: string): TokenPayload | null {
//     try {
//         const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
//         return decoded;
//     } catch (error) {
//         console.log(error)
//         return null;
//     }
// }

// export function setAuthCookies(tokens: AuthTokens) {
//     const response = new NextResponse(JSON.stringify({ success: true }), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//     });

//     response.cookies.set({
//         name: 'refreshToken',
//         value: tokens.refreshToken,
//         httpOnly: true,
//         secure: false,
//         sameSite: 'strict',
//         maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
//         path: '/',
//     });

//     response.cookies.set({
//         name: 'accessToken',
//         value: tokens.accessToken,
//         httpOnly: true,
//         secure: false,
//         sameSite: 'strict',
//         maxAge: 15 * 60, // 15 minutes in seconds
//         path: '/',
//     });

//     return response;
// }

// // Generate JWT tokens
// export function generateApplicationFormToken(applicationForm: ApplicationFormDto): string {
//     const payload = { applicationForm };

//     const applicationFormToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

//     return applicationFormToken;
// }

// // Verify application-form
// export function verifyApplicationForm(applicationFormToken: string): ApplicationFormDto | null {
//     try {
//         const decoded = jwt.verify(applicationFormToken, JWT_REFRESH_SECRET) as { applicationForm: ApplicationFormDto };
//         return decoded.applicationForm;
//     } catch (error) {
//         console.log(error)
//         return null;
//     }
// }

// export function setApplicationFormCookies(applicationFormToken: string) {
//     const response = new NextResponse(JSON.stringify({ success: true }), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//     });

//     response.cookies.set({
//         name: 'applicationForm',
//         value: applicationFormToken,
//         httpOnly: true,
//         secure: false,
//         sameSite: 'strict',
//         maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
//         path: '/',
//     });

//     return response;
// }

// // Clear auth cookies
// export async function clearAuthCookies() {
//     const cookieStore = await cookies();
//     cookieStore.delete('refreshToken');
//     cookieStore.delete('accessToken');
// }

// // Get user by email
// export async function getUserByEmail(email: string): Promise<Student | null> {
//     const user = await findStudentByEmail(email);
//     return user;
// }

// // Get user by uid
// export async function getUserByUid(uid: string): Promise<Student | null> {
//     // Special case for admin user - no database check needed
//     if (uid === 'admin') {
//         return {
//             id: 0,
//             tmpApplicationId: null,
//             name: 'Admin',
//             codeNumber: 'admin',
//             institutionalemail: 'admin@example.com',
//             email: 'admin@example.com',
//             isAdmin: true,
//             // Add required fields with default values
//             mailingPinNo: '',
//             resiPinNo: '',
//             admissionYear: 0,
//             oldcodeNumber: '',
//             active: true,
//             alumni: false,
//             contactNo: '',
//             imgFile: '',
//             applicantSignature: '',
//             sexId: 0,
//             mailingAddress: '',
//             phoneMobileNo: '',
//             residentialAddress: '',
//             resiPhoneMobileNo: '',
//             religionId: 0,
//             studentCategoryId: 0,
//             motherTongueId: 0,
//             dateOfBirth: new Date(),
//             nationalityId: 0,
//             rollNumber: '',
//             bloodGroup: 0,
//             eyePowerLeft: '',
//             eyePowerRight: '',
//             emrgnResidentPhNo: '',
//             emrgnOfficePhNo: '',
//             emrgnMotherMobNo: '',
//             emrgnFatherMobNo: '',
//             lastInstitution: '',
//             lastInstitutionAddress: '',
//             handicapped: 'NO',
//             handicappedDetails: '',
//             lsmedium: '',
//             annualFamilyIncome: '',
//             lastBoardUniversity: 0,
//             institutionId: 0,
//             fatherName: '',
//             fatherOccupation: 0,
//             fatherOffPhone: '',
//             fatherMobNo: '',
//             fatherEmail: '',
//             motherName: '',
//             motherOccupation: 0,
//             motherOffPhone: '',
//             motherMobNo: '',
//             motherEmail: '',
//             guardianName: '',
//             guardianOccupation: 0,
//             guardianOffAddress: '',
//             guardianOffPhone: '',
//             guardianMobNo: '',
//             guardianEmail: '',
//             admissioncodeno: '',
//             placeofstay: '',
//             placeofstaycontactno: '',
//             placeofstayaddr: '',
//             universityRegNo: '',
//             admissiondate: new Date(),
//             emercontactpersonnm: '',
//             emerpersreltostud: '',
//             emercontactpersonmob: '',
//             emercontactpersonphr: '',
//             emercontactpersonpho: '',
//             leavingdate: new Date().toISOString(),
//             univregno: '',
//             univlstexmrollno: '',
//             communityid: 0,
//             lspassedyr: 0,
//             cuformno: '',
//             chkrepeat: false,
//             notes: '',
//             fatherPic: '',
//             motherPic: '',
//             guardianPic: '',
//             lastotherBoardUniversity: 0,
//             boardresultid: 0,
//             rfidno: '',
//             specialisation: '',
//             aadharcardno: '',
//             leavingreason: '',
//             localitytyp: '',
//             rationcardtyp: '',
//             fatheraadharno: '',
//             motheraadharno: '',
//             gurdianaadharno: '',
//             issnglprnt: '',
//             handicappedpercentage: '',
//             disabilitycode: '',
//             coursetype: null,
//             whatsappno: '',
//             alternativeemail: '',
//             othernationality: '',
//             pursuingca: '',
//             abcid: '',
//             apprid: '',
//             // Add Nationality fields
//             nationalityName: 'Admin',
//             pos: 0,
//             code: 'ADMIN'
//         };
//     }

//     const user = await findStudentByUid(uid);
//     return user;
// }

// // Get user by ID
// // export async function getUserById(id: number): Promise<User | null> {
// //     const users = await db.select().from(userModel).where(eq(userModel.id, id)).limit(1);
// //     return users.length > 0 ? users[0] : null;
// // }

// // Refresh access token using refresh token
// export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
//     const payload = verifyRefreshToken(refreshToken);
//     if (!payload) return null;

//     const user = await getUserByEmail(payload.email);
//     if (!user) return null;

//     const { accessToken } = generateTokens(user);
//     return accessToken;
// }

export async function doLogin(
  email: string,
  password: string,
): Promise<ApiResponse<{ accessToken: string; user: UserDto; redirectTo?: string }>> {
  const response = await axiosInstance.post("/auth/login", { email, password });
  return response.data;
}

export async function sendOtpRequest(
  email: string,
): Promise<ApiResponse<{ message: string; expiresIn: string; sentTo: { email: boolean; whatsapp: boolean } }>> {
  const response = await axiosInstance.post("/auth/otp/send-email", { email });
  return response.data;
}

export async function verifyOtpAndLogin(
  email: string,
  otp: string,
  app?: string,
): Promise<ApiResponse<{ accessToken: string; user: UserDto; redirectTo?: string }>> {
  const response = await axiosInstance.post("/auth/otp/verify", {
    email,
    otp,
    ...(app && { app }),
  });
  return response.data;
}

export async function checkOtpStatus(
  email: string,
): Promise<ApiResponse<{ hasValidOtp: boolean; expiresAt?: string; remainingTime?: number }>> {
  const response = await axiosInstance.get(`/auth/otp/status?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function lookupUser(
  email: string,
): Promise<ApiResponse<{ id: number; name: string; email: string; uid?: string }>> {
  const response = await axiosInstance.get(`/auth/otp/lookup?email=${encodeURIComponent(email)}`);
  return response.data;
}

export async function lookupUsersByPrefix(
  prefix: string,
): Promise<ApiResponse<{ users: { id: number; name: string; email: string }[] }>> {
  const response = await axiosInstance.get(`/auth/otp/lookup-prefix?prefix=${encodeURIComponent(prefix)}`);
  return response.data;
}

export async function adminBypassOtpLogin(
  uid: string,
  adminToken?: string,
  isSimulationMode?: boolean,
): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: UserDto }>> {
  const headers: Record<string, string> = {};
  // Only add header if token is provided (backend will check cookie if not provided)
  if (adminToken) {
    headers["X-Admin-Bypass-Token"] = adminToken;
  }
  // Add simulation mode header to help backend detect iframe context
  if (isSimulationMode) {
    headers["X-Simulation-Mode"] = "true";
    console.log("[SIMULATION] Sending X-Simulation-Mode header with admin bypass request");
  } else {
    console.log("[SIMULATION] NOT in simulation mode, not sending header");
  }

  console.log("[SIMULATION] Admin bypass request headers:", headers);

  const response = await axiosInstance.post(
    "/auth/otp/admin-bypass",
    { uid },
    {
      headers,
    },
  );
  return response.data;
}

export async function testTimeCalculation(): Promise<
  ApiResponse<{
    currentTime: string;
    testExpiryTime: string;
    remainingTime: number;
    timezone: string;
  }>
> {
  const response = await axiosInstance.get("/auth/otp/test-time");
  return response.data;
}
