import { db } from "@/db/index.js";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import {
  studentModel,
  userModel,
  personalDetailsModel,
  addressModel,
} from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { specializationModel } from "@repo/db/schemas/models/course-design";
import {
  nationalityModel,
  religionModel,
  categoryModel,
  countryModel,
  stateModel,
  cityModel,
  districtModel,
  boardModel,
} from "@repo/db/schemas/models/resources";
import {
  postOfficeModel,
  policeStationModel,
  disabilityCodeModel,
} from "@repo/db/schemas/models/user";
import { studentSubjectSelectionModel } from "@repo/db/schemas/models/subject-selection/student-subject-selection.model";
import { subjectSelectionMetaModel } from "@repo/db/schemas/models/subject-selection/subject-selection-meta.model";
import { admissionAcademicInfoModel } from "@repo/db/schemas/models/admissions/admission-academic-info.model.js";
import { admissionCourseDetailsModel } from "@repo/db/schemas/models/admissions/adm-course-details.model";
import { familyModel } from "@repo/db/schemas/models/user/family.model";
import { personModel } from "@repo/db/schemas/models/user/person.model";
import { annualIncomeModel } from "@repo/db/schemas/models/resources/annualIncome.model";
import {
  sessionModel,
  academicYearModel,
  classModel,
  shiftModel,
} from "@repo/db/schemas/models/academics";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
  streamModel,
  programCourseModel,
  courseModel,
} from "@repo/db/schemas/models/course-design";
import { CuRegistrationFormData } from "./pdf-generation.service.js";
import path from "path";
import fs from "fs/promises";
import { CuRegistrationExcelService } from "./cu-registration-excel.service.js";
// QR code no longer required for physical submission schedule
import { fileURLToPath } from "url";
import { cuPhysicalRegModel } from "@repo/db/schemas/models/admissions/cu-physical-reg-model.js";

export interface CuRegistrationDataOptions {
  studentId: number;
  correctionRequestId: number;
  applicationNumber: string; // Application number for CU Form Number
  collegeLogoUrl?: string;
  collegeName?: string;
  collegeAddress?: string;
  collegeDetails1?: string;
  collegeDetails2?: string;
}

export class CuRegistrationDataService {
  // Resolve a file from public/ robustly across dev and dist
  private static async resolvePublicAssetPath(
    fileName: string,
  ): Promise<string> {
    const candidates: string[] = [];
    if (process.env.CU_REG_PUBLIC_DIR) {
      candidates.push(path.join(process.env.CU_REG_PUBLIC_DIR, fileName));
    }
    candidates.push(path.join(process.cwd(), "public", fileName));
    candidates.push(
      path.join(process.cwd(), "apps", "backend", "public", fileName),
    );
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      candidates.push(path.join(__dirname, "..", "..", "public", fileName));
      candidates.push(
        path.join(__dirname, "..", "..", "..", "public", fileName),
      );
    } catch {}

    for (const p of candidates) {
      try {
        await fs.access(p, fs.constants.R_OK);
        return p;
      } catch {}
    }
    return path.join(process.cwd(), "public", fileName);
  }
  public static async fetchStudentDataForPdf(
    options: CuRegistrationDataOptions,
  ): Promise<CuRegistrationFormData> {
    console.info("[CU-REG DATA] Fetching student data for PDF generation", {
      studentId: options.studentId,
      correctionRequestId: options.correctionRequestId,
      applicationNumber: options.applicationNumber,
    });

    try {
      // Fetch student with user and personal details
      const [studentData] = await db
        .select({
          // Student fields
          studentId: studentModel.id,
          uid: studentModel.uid,
          cuFormNumber: studentModel.cuFormNumber,
          apaarId: studentModel.apaarId,
          belongsToEWS: studentModel.belongsToEWS,
          handicapped: studentModel.handicapped,
          // User fields
          userName: userModel.name,
          userEmail: userModel.email,
          userPhone: userModel.phone,
          // Personal details fields
          firstName: personalDetailsModel.firstName,
          middleName: personalDetailsModel.middleName,
          lastName: personalDetailsModel.lastName,
          dateOfBirth: personalDetailsModel.dateOfBirth,
          gender: personalDetailsModel.gender,
          aadhaarCardNumber: personalDetailsModel.aadhaarCardNumber,
          // Program course fields
          programCourseName: programCourseModel.name,
          courseName: courseModel.name, // Fetch course name from course table
          specializationName: specializationModel.name,
        })
        .from(studentModel)
        .leftJoin(userModel, eq(studentModel.userId, userModel.id))
        .leftJoin(
          personalDetailsModel,
          eq(personalDetailsModel.userId, userModel.id),
        )
        .leftJoin(
          programCourseModel,
          eq(studentModel.programCourseId, programCourseModel.id),
        )
        .leftJoin(courseModel, eq(programCourseModel.courseId, courseModel.id))
        .leftJoin(
          specializationModel,
          eq(studentModel.specializationId, specializationModel.id),
        )
        .where(eq(studentModel.id, options.studentId));

      if (!studentData) {
        throw new Error("Student not found");
      }

      console.info("[CU-REG DATA] Raw student data from database:", {
        courseName: studentData.courseName,
        courseNameType: typeof studentData.courseName,
        handicapped: studentData.handicapped,
        handicappedType: typeof studentData.handicapped,
        belongsToEWS: studentData.belongsToEWS,
        belongsToEWSType: typeof studentData.belongsToEWS,
      });

      // Fetch correction request to check for rectification flags and get application number
      const [correctionRequest] = await db
        .select({
          id: cuRegistrationCorrectionRequestModel.id,
          cuRegistrationApplicationNumber:
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          genderCorrectionRequest:
            cuRegistrationCorrectionRequestModel.genderCorrectionRequest,
          nationalityCorrectionRequest:
            cuRegistrationCorrectionRequestModel.nationalityCorrectionRequest,
          apaarIdCorrectionRequest:
            cuRegistrationCorrectionRequestModel.apaarIdCorrectionRequest,
          aadhaarCardNumberCorrectionRequest:
            cuRegistrationCorrectionRequestModel.aadhaarCardNumberCorrectionRequest,
          subjectsCorrectionRequest:
            cuRegistrationCorrectionRequestModel.subjectsCorrectionRequest,
        })
        .from(cuRegistrationCorrectionRequestModel)
        .where(
          eq(
            cuRegistrationCorrectionRequestModel.id,
            options.correctionRequestId,
          ),
        );

      if (!correctionRequest) {
        throw new Error("Correction request not found");
      }

      // Check if any correction flags are set
      const showRectificationBanner =
        correctionRequest.genderCorrectionRequest ||
        correctionRequest.nationalityCorrectionRequest ||
        correctionRequest.apaarIdCorrectionRequest ||
        correctionRequest.aadhaarCardNumberCorrectionRequest ||
        correctionRequest.subjectsCorrectionRequest;

      // Fetch personal details with related data
      const [personalDetails] = await db
        .select({
          // Personal details
          firstName: personalDetailsModel.firstName,
          middleName: personalDetailsModel.middleName,
          lastName: personalDetailsModel.lastName,
          dateOfBirth: personalDetailsModel.dateOfBirth,
          gender: personalDetailsModel.gender,
          aadhaarCardNumber: personalDetailsModel.aadhaarCardNumber,
          disability: personalDetailsModel.disability,
          // Related data
          nationalityName: nationalityModel.name,
          religionName: religionModel.name,
          categoryName: categoryModel.name,
          disabilityCode: disabilityCodeModel.code,
        })
        .from(personalDetailsModel)
        .leftJoin(
          nationalityModel,
          eq(personalDetailsModel.nationalityId, nationalityModel.id),
        )
        .leftJoin(
          religionModel,
          eq(personalDetailsModel.religionId, religionModel.id),
        )
        .leftJoin(
          categoryModel,
          eq(personalDetailsModel.categoryId, categoryModel.id),
        )
        .leftJoin(
          disabilityCodeModel,
          eq(personalDetailsModel.disabilityCodeId, disabilityCodeModel.id),
        )
        .where(
          eq(
            personalDetailsModel.userId,
            await this.getUserIdByStudentId(options.studentId),
          ),
        );

      console.info("[CU-REG DATA] Raw personal details from database:", {
        disability: personalDetails?.disability,
        disabilityType: typeof personalDetails?.disability,
      });

      // Fetch residential address
      const [residentialAddress] = await db
        .select({
          addressLine: addressModel.addressLine,
          countryName: countryModel.name,
          stateName: stateModel.name,
          cityName: cityModel.name,
          districtName: districtModel.name,
          postOfficeName: postOfficeModel.name,
          policeStationName: policeStationModel.name,
          otherPostoffice: addressModel.otherPostoffice,
          otherPoliceStation: addressModel.otherPoliceStation,
          pincode: addressModel.pincode,
        })
        .from(addressModel)
        .leftJoin(countryModel, eq(addressModel.countryId, countryModel.id))
        .leftJoin(stateModel, eq(addressModel.stateId, stateModel.id))
        .leftJoin(cityModel, eq(addressModel.cityId, cityModel.id))
        .leftJoin(districtModel, eq(addressModel.districtId, districtModel.id))
        .leftJoin(
          postOfficeModel,
          eq(addressModel.postofficeId, postOfficeModel.id),
        )
        .leftJoin(
          policeStationModel,
          eq(addressModel.policeStationId, policeStationModel.id),
        )
        .where(
          and(
            eq(
              addressModel.personalDetailsId,
              personalDetails?.firstName
                ? await this.getPersonalDetailsIdByStudentId(options.studentId)
                : 0,
            ),
            eq(addressModel.type, "RESIDENTIAL"),
          ),
        );

      // Fetch academic details (board information)
      const [academicDetails] = await db
        .select({
          boardName: boardModel.name,
          boardCode: boardModel.code,
          yearOfPassing: admissionAcademicInfoModel.yearOfPassing,
          rollNumber: admissionAcademicInfoModel.rollNumber,
          cuRegistrationNumber: admissionAcademicInfoModel.cuRegistrationNumber,
        })
        .from(admissionAcademicInfoModel)
        .leftJoin(
          boardModel,
          eq(admissionAcademicInfoModel.boardId, boardModel.id),
        )
        .where(eq(admissionAcademicInfoModel.studentId, options.studentId));

      // Get current session ID for dynamic subject details
      const [currentSession] = await db
        .select({ id: sessionModel.id })
        .from(sessionModel)
        .where(eq(sessionModel.isCurrentSession, true))
        .limit(1);
      // Resolve student's latest shift and class from promotions
      let shiftName: string = "Day";
      let latestClassId: number | null = null;
      try {
        const [promotionWithShift] = await db
          .select({
            shiftName: shiftModel.name,
            classId: promotionModel.classId,
          })
          .from(promotionModel)
          .leftJoin(
            shiftModel,
            eq(promotionModel.shiftId as any, shiftModel.id),
          )
          .where(eq(promotionModel.studentId, options.studentId))
          .orderBy(desc(promotionModel.createdAt))
          .limit(1);
        if (promotionWithShift?.shiftName) {
          shiftName = promotionWithShift.shiftName;
        }
        latestClassId = promotionWithShift?.classId ?? null;
      } catch (e) {
        console.warn(
          "[CU-REG DATA] Could not resolve shift from promotions, using default 'Day'",
          e,
        );
      }

      const sessionId = currentSession?.id || 1; // Fallback to session 1

      // Get program course ID from student data
      const [programCourseData] = await db
        .select({ id: programCourseModel.id })
        .from(programCourseModel)
        .where(eq(programCourseModel.name, studentData.programCourseName || ""))
        .limit(1);

      const programCourseId = programCourseData?.id || 1; // Fallback

      // Fetch dynamic subject details based on stream and program course
      console.info(
        "[CU-REG DATA] Fetching dynamic subject details for studentId:",
        options.studentId,
      );
      const subjectDetails = await this.getDynamicSubjectDetails(
        options.studentId,
        programCourseId,
        sessionId,
        studentData.courseName || "",
      );

      console.info("[CU-REG DATA] Dynamic subject details for template:", {
        count: subjectDetails?.length || 0,
        data: subjectDetails,
      });

      // Fetch family details for parent name and annual income
      const [familyDetails] = await db
        .select({
          id: familyModel.id,
          annualIncomeId: familyModel.annualIncomeId,
        })
        .from(familyModel)
        .where(
          eq(
            familyModel.userId,
            await this.getUserIdByStudentId(options.studentId),
          ),
        );

      // Fetch annual income range
      let annualIncomeRange = "";
      if (familyDetails?.annualIncomeId) {
        const [annualIncome] = await db
          .select({ range: annualIncomeModel.range })
          .from(annualIncomeModel)
          .where(eq(annualIncomeModel.id, familyDetails.annualIncomeId));
        annualIncomeRange = annualIncome?.range || "";
      }

      // Fetch parent name (father first, then mother)
      const parentName = await this.getParentNameFromFamily(familyDetails);

      // Get current session name from promotions table
      const sessionName = await this.getCurrentSessionName(options.studentId);

      // Build the form data
      const formData: CuRegistrationFormData = {
        // College Information
        collegeLogoUrl:
          options.collegeLogoUrl ||
          "https://besc.academic360.app/api/api/v1/settings/file/4",
        collegeName:
          options.collegeName || "The Bhawanipur Education Society College",
        collegeAddress:
          options.collegeAddress ||
          "5, Lala Lajpat Rai Sarani, Kolkata - 700020",
        collegeDetails1:
          options.collegeDetails1 ||
          "A Minority Run College. Affiliated to the University of Calcutta",
        collegeDetails2:
          options.collegeDetails2 ||
          "Recognised under Section 2(F) & 12 (B) of the UGC Act, 1956",

        // Student Basic Information
        studentName: this.formatStudentName(personalDetails),
        studentUid: studentData.uid || "",
        cuFormNumber:
          options.applicationNumber ||
          correctionRequest.cuRegistrationApplicationNumber ||
          studentData.cuFormNumber ||
          academicDetails?.cuRegistrationNumber ||
          "",
        programCourseName: studentData.programCourseName || "",
        shiftName,
        studentPhotoUrl: `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${studentData.uid}.jpg`,

        // Debug: Log the photo URL being generated
        photoUrlDebug: `Photo URL: https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${studentData.uid}.jpg`,

        // Rectification Banner
        showRectificationBanner,

        // Personal Information
        dateOfBirth: this.formatDate(personalDetails?.dateOfBirth),
        gender: personalDetails?.gender || "",
        parentName: parentName,
        categoryName: personalDetails?.categoryName || "",
        nationalityName: personalDetails?.nationalityName || "",
        aadhaarCardNumber: this.formatAadhaarCard(
          personalDetails?.aadhaarCardNumber,
        ),
        religionName: personalDetails?.religionName || "",
        annualIncome: annualIncomeRange,
        pwdStatus:
          studentData.handicapped || !!personalDetails?.disability
            ? "Yes"
            : "No",
        pwdCode: personalDetails?.disability || "",
        ewsStatus: studentData.belongsToEWS ? "Yes" : "No",

        // Address Information
        residentialAddress: residentialAddress?.addressLine || "",
        countryName: residentialAddress?.countryName || "",
        stateName: residentialAddress?.stateName || "",
        policeStationName:
          residentialAddress?.policeStationName ||
          residentialAddress?.otherPoliceStation ||
          "",
        postOfficeName:
          residentialAddress?.postOfficeName ||
          residentialAddress?.otherPostoffice ||
          "",
        cityName: residentialAddress?.cityName || "",
        pincode: residentialAddress?.pincode || "",

        // Academic Information
        boardName: academicDetails?.boardName || "",
        boardCode: academicDetails?.boardCode || "",
        yearOfPassing: academicDetails?.yearOfPassing?.toString() || "",
        apaarId: this.formatApaarId(studentData.apaarId),
        cuRegistrationNumber:
          academicDetails?.cuRegistrationNumber ||
          studentData.cuFormNumber ||
          "",
        boardRollNumber: academicDetails?.rollNumber || "",

        // Subject Details
        subjectDetails,

        // Document filtering flags
        isIndian:
          (personalDetails?.nationalityName || "").toLowerCase() === "indian",
        isSCSTOBC: ["SC", "ST", "OBC"].includes(
          (personalDetails?.categoryName || "").toUpperCase(),
        ),
        isPWD: studentData.handicapped || !!personalDetails?.disability,
        isEWS: !!studentData.belongsToEWS,
        isForeignNational:
          (personalDetails?.nationalityName || "").toLowerCase() !== "indian",
        hasCURegistration: !!academicDetails?.cuRegistrationNumber,

        // Form download date
        formDownloadDate: new Date().toLocaleDateString("en-GB"), // dd/mm/yyyy format

        // Session information
        sessionName: sessionName,

        // Initialize physical registration fields (will be populated if Excel data is found)
        physicalRegistrationQrCodeDataUrl: undefined,
        physicalRegistrationTime: undefined,
        physicalRegistrationVenue: undefined,
        physicalRegistrationSubmissionDate: undefined,
        noticeBoardQrUrl: undefined,
      };

      console.info("[CU-REG DATA] Document filtering flags:", {
        isIndian: formData.isIndian,
        isSCSTOBC: formData.isSCSTOBC,
        isPWD: formData.isPWD,
        isEWS: formData.isEWS,
        isForeignNational: formData.isForeignNational,
        hasCURegistration: formData.hasCURegistration,
        belongsToEWS: studentData.belongsToEWS,
        handicapped: studentData.handicapped,
        disability: personalDetails?.disability,
      });

      // Fetch physical registration time and venue from DB first; fallback to Excel
      try {
        if (latestClassId) {
          const [reg] = await db
            .select({
              time: cuPhysicalRegModel.time,
              venue: cuPhysicalRegModel.venue,
              submissionDate: cuPhysicalRegModel.submissionDate,
            })
            .from(cuPhysicalRegModel)
            .where(
              and(
                eq(cuPhysicalRegModel.studentId, options.studentId),
                eq(cuPhysicalRegModel.classId, latestClassId),
              ),
            )
            .limit(1);

          if (reg) {
            const submissionDateStr =
              CuRegistrationDataService.formatDateYYYYMMDDToDDMMYYYY(
                reg.submissionDate as unknown as string,
              );
            formData.physicalRegistrationTime = reg.time || "";
            formData.physicalRegistrationVenue = reg.venue || "";
            formData.physicalRegistrationSubmissionDate =
              submissionDateStr || "";
            console.info(
              "[CU-REG DATA] Populated schedule from DB model (cu_physical_reg)",
            );
          }
        }

        if (
          !formData.physicalRegistrationTime ||
          !formData.physicalRegistrationVenue
        ) {
          console.info(
            "[CU-REG DATA] Falling back to Excel for time/venue using UID",
            { uid: formData.studentUid },
          );
          const timeVenueInfo =
            await CuRegistrationExcelService.getStudentTimeVenueInfo(
              formData.studentUid,
            );
          if (timeVenueInfo.found) {
            formData.physicalRegistrationTime = timeVenueInfo.time;
            formData.physicalRegistrationVenue = timeVenueInfo.venue;
            formData.physicalRegistrationSubmissionDate =
              timeVenueInfo.submissionDate;
          }
        }
      } catch (error) {
        console.error(
          "[CU-REG DATA] Error fetching schedule from DB/Excel:",
          error,
        );
      }

      // Ensure notice-board QR loads inside PDF by embedding as Data URL
      try {
        const noticePath =
          await CuRegistrationDataService.resolvePublicAssetPath(
            "notice-board-qrcode.png",
          );
        const noticeBuffer = await fs.readFile(noticePath);
        formData.noticeBoardQrUrl = `data:image/png;base64,${noticeBuffer.toString("base64")}`;
      } catch (e) {
        console.warn(
          "[CU-REG DATA] Could not embed notice-board-qrcode.png:",
          e,
        );
      }

      // If collegeLogoUrl is a local public path, embed it as data URL too
      try {
        const logoUrl = formData.collegeLogoUrl || "";
        const isDataUrl = logoUrl.startsWith("data:");
        const isHttp = /^https?:\/\//i.test(logoUrl);
        const isLocalPath = !isDataUrl && !isHttp && logoUrl.trim() !== "";
        if (isLocalPath) {
          const relative = logoUrl.startsWith("/") ? logoUrl.slice(1) : logoUrl;
          const logoPath =
            await CuRegistrationDataService.resolvePublicAssetPath(relative);
          const buf = await fs.readFile(logoPath);
          formData.collegeLogoUrl = `data:image/png;base64,${buf.toString("base64")}`;
        }
      } catch (e) {
        console.warn("[CU-REG DATA] Could not embed local collegeLogoUrl:", e);
      }

      console.info("[CU-REG DATA] Student data fetched successfully", {
        studentName: formData.studentName,
        studentUid: formData.studentUid,
        cuFormNumber: formData.cuFormNumber,
        applicationNumberPassed: options.applicationNumber,
        cuFormNumberFromDB: studentData.cuFormNumber,
        correctionRequestAppNumber:
          correctionRequest.cuRegistrationApplicationNumber,
        academicDetailsCuReg: academicDetails?.cuRegistrationNumber,
        showRectificationBanner: formData.showRectificationBanner,
        photoUrl: formData.studentPhotoUrl,
        courseName: studentData.courseName,
        programCourseName: studentData.programCourseName,
        hasPhysicalRegistrationQrCode:
          !!formData.physicalRegistrationQrCodeDataUrl,
        physicalRegistrationTime: formData.physicalRegistrationTime,
        physicalRegistrationVenue: formData.physicalRegistrationVenue,
        physicalRegistrationSubmissionDate:
          formData.physicalRegistrationSubmissionDate,
      });

      return formData;
    } catch (error) {
      console.error("[CU-REG DATA] Error fetching student data:", error);
      throw new Error(
        `Failed to fetch student data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private static formatDateYYYYMMDDToDDMMYYYY(
    input: string | undefined | null,
  ): string {
    if (!input) return "";
    // input may be YYYY-MM-DD or a Date string; try both
    const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    const dt = new Date(input);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-GB");
    }
    return String(input);
  }

  private static formatStudentName(personalDetails: any): string {
    if (!personalDetails) return "";
    const parts = [
      personalDetails.firstName,
      personalDetails.middleName,
      personalDetails.lastName,
    ].filter(Boolean);
    return parts.join(" ");
  }

  private static formatDate(date: any): string {
    if (!date) return "";
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("en-GB");
    }
    return date.toLocaleDateString("en-GB");
  }

  private static formatApaarId(apaarId: string | null | undefined): string {
    if (!apaarId) return "";
    // Remove any existing dashes and format as 3-3-3-3
    const cleanId = apaarId.replace(/-/g, "");
    if (cleanId.length === 12) {
      return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}-${cleanId.slice(9, 12)}`;
    }
    return apaarId; // Return original if not 12 digits
  }

  private static async getParentNameFromFamily(
    familyDetails: any,
  ): Promise<string> {
    try {
      if (!familyDetails?.id) return "";

      // Get family members (father, mother, guardian)
      const familyMembers = await db
        .select({
          name: personModel.name,
          type: personModel.type,
        })
        .from(personModel)
        .where(eq(personModel.familyId, familyDetails.id));

      // Try father first
      const father = familyMembers.find((m) => m.type === "FATHER");
      if (father?.name) {
        return father.name;
      }

      // If no father, try mother
      const mother = familyMembers.find((m) => m.type === "MOTHER");
      if (mother?.name) {
        return mother.name;
      }

      return "";
    } catch (error) {
      console.warn("[CU-REG DATA] Could not fetch parent name:", error);
      return "";
    }
  }

  private static formatAadhaarCard(
    aadhaarCardNumber: string | null | undefined,
  ): string {
    if (!aadhaarCardNumber) return "";
    const cleanNumber = aadhaarCardNumber.replace(/\D/g, "");
    if (cleanNumber.length === 12) {
      return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4, 8)}-${cleanNumber.slice(8, 12)}`;
    }
    return aadhaarCardNumber;
  }

  private static formatSubjectDetails(
    subjectSelections: any[],
    isBcomProgram: boolean = false,
    programCourseName: string = "",
  ): Array<{ headers: string[]; subjects: string[] }> {
    console.info("[CU-REG DATA] formatSubjectDetails called with:", {
      count: subjectSelections?.length || 0,
      data: subjectSelections,
      courseName: programCourseName,
      courseNameType: typeof programCourseName,
    });

    if (!subjectSelections || subjectSelections.length === 0) {
      console.info(
        "[CU-REG DATA] No subject selections provided, returning empty array",
      );
      return [];
    }

    // Group subjects by their label (Minor 1, Minor 2, IDC 1, AEC 1, etc.)
    const subjectsByLabel = subjectSelections.reduce((acc, selection) => {
      const label = selection.label || "";
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(selection);
      return acc;
    }, {});

    console.info("[CU-REG DATA] Subjects grouped by label:", subjectsByLabel);

    const subjectDetails = [];

    // Core/Major subjects table - look for Core subjects and Minor subjects
    const coreSubjects =
      subjectsByLabel["Core"] || subjectsByLabel["Major"] || [];
    const minor1 =
      subjectsByLabel["Minor 1"] ||
      subjectsByLabel["Minor1"] ||
      subjectsByLabel["Minor 1 (Semester I & II)"] ||
      [];
    const minor2 =
      subjectsByLabel["Minor 2"] ||
      subjectsByLabel["Minor2"] ||
      subjectsByLabel["Minor 2 (Semester III & IV)"] ||
      [];
    const minor3 =
      subjectsByLabel["Minor 3"] ||
      subjectsByLabel["Minor3"] ||
      subjectsByLabel["Minor 3 (Semester III)"] ||
      subjectsByLabel["Minor 3 (Semester III & IV)"] ||
      subjectsByLabel["Minor 3 (Semester V & VI)"] ||
      [];
    const minor4 =
      subjectsByLabel["Minor 4"] ||
      subjectsByLabel["Minor4"] ||
      subjectsByLabel["Minor 4 (Semester VII & VIII)"] ||
      [];

    console.info("[CU-REG DATA] Core/Major subjects found:", {
      coreSubjects: coreSubjects.length,
      minor1: minor1.length,
      minor2: minor2.length,
      minor3: minor3.length,
      minor4: minor4.length,
    });

    console.info(
      "[CU-REG DATA] Available labels for matching:",
      Object.keys(subjectsByLabel),
    );

    if (
      coreSubjects.length > 0 ||
      minor1.length > 0 ||
      minor2.length > 0 ||
      minor3.length > 0 ||
      minor4.length > 0
    ) {
      // For Sem III & IV, use minor2 if available, otherwise use minor3
      const minorSem3And4 = minor2.length > 0 ? minor2 : minor3;

      console.info(
        "[CU-REG DATA] Creating Core/Major table with courseName:",
        programCourseName,
        "Type:",
        typeof programCourseName,
      );

      const coreMinorTable = {
        headers: [
          "Core/Major",
          "Minor For Sem I",
          "Minor For Sem II",
          "Minor For Sem III",
          "Minor For Sem IV",
        ],
        subjects: [
          programCourseName || "", // Use course name for Core/Major
          minor1[0]?.subjectName || "",
          minor1[0]?.subjectName || "", // Minor For Sem II uses minor1
          minorSem3And4[0]?.subjectName || "", // Minor For Sem III uses minor2 or minor3
          minorSem3And4[0]?.subjectName || "", // Minor For Sem IV uses minor2 or minor3
        ],
      };
      subjectDetails.push(coreMinorTable);
      console.info("[CU-REG DATA] Added Core/Major table:", coreMinorTable);
      console.info("[CU-REG DATA] Using for Sem III & IV:", {
        minor2Available: minor2.length > 0,
        minor3Available: minor3.length > 0,
        usingMinor: minor2.length > 0 ? "minor2" : "minor3",
        subjectName: minorSem3And4[0]?.subjectName || "none",
      });
    }

    // AEC/IDC subjects table - look for AEC and IDC subjects (or MDC for BCOM)
    const aec1 =
      subjectsByLabel["AEC 1"] ||
      subjectsByLabel["AEC1"] ||
      subjectsByLabel["AEC (Semester I & II)"] ||
      [];
    const aec2 = subjectsByLabel["AEC 2"] || subjectsByLabel["AEC2"] || [];
    const aec3 =
      subjectsByLabel["AEC 3"] ||
      subjectsByLabel["AEC3"] ||
      subjectsByLabel["AEC (Semester III & IV)"] ||
      [];
    const aec4 =
      subjectsByLabel["AEC 4"] ||
      subjectsByLabel["AEC4"] ||
      subjectsByLabel["AEC (Semester V & VI)"] ||
      [];

    // For BCOM students, look for MDC subjects instead of IDC
    const idc1 = isBcomProgram
      ? subjectsByLabel["MDC 1"] ||
        subjectsByLabel["MDC1"] ||
        subjectsByLabel["MDC 1 (Semester I)"] ||
        subjectsByLabel["Major Discipline Course 1"] ||
        subjectsByLabel["Multi Disciplinary Course 1"] ||
        []
      : subjectsByLabel["IDC 1"] ||
        subjectsByLabel["IDC1"] ||
        subjectsByLabel["IDC 1 (Semester I)"] ||
        [];
    const idc2 = isBcomProgram
      ? subjectsByLabel["MDC 2"] ||
        subjectsByLabel["MDC2"] ||
        subjectsByLabel["MDC 2 (Semester II)"] ||
        subjectsByLabel["Major Discipline Course 2"] ||
        subjectsByLabel["Multi Disciplinary Course 2"] ||
        []
      : subjectsByLabel["IDC 2"] ||
        subjectsByLabel["IDC2"] ||
        subjectsByLabel["IDC 2 (Semester II)"] ||
        [];
    const idc3 = isBcomProgram
      ? subjectsByLabel["MDC 3"] ||
        subjectsByLabel["MDC3"] ||
        subjectsByLabel["MDC 3 (Semester III)"] ||
        subjectsByLabel["Major Discipline Course 3"] ||
        subjectsByLabel["Multi Disciplinary Course 3"] ||
        []
      : subjectsByLabel["IDC 3"] ||
        subjectsByLabel["IDC3"] ||
        subjectsByLabel["IDC 3 (Semester III)"] ||
        [];

    console.info("[CU-REG DATA] AEC/IDC subjects found:", {
      aec1: aec1.length,
      aec2: aec2.length,
      aec3: aec3.length,
      aec4: aec4.length,
      idc1: idc1.length,
      idc2: idc2.length,
      idc3: idc3.length,
    });

    console.info("[CU-REG DATA] AEC/IDC matching details:", {
      "AEC (Semester III & IV) -> AEC3":
        subjectsByLabel["AEC (Semester III & IV)"]?.length || 0,
      "IDC 1 (Semester I)": subjectsByLabel["IDC 1 (Semester I)"]?.length || 0,
      "IDC 2 (Semester II)":
        subjectsByLabel["IDC 2 (Semester II)"]?.length || 0,
      "IDC 3 (Semester III)":
        subjectsByLabel["IDC 3 (Semester III)"]?.length || 0,
    });

    if (
      aec1.length > 0 ||
      aec2.length > 0 ||
      aec3.length > 0 ||
      aec4.length > 0 ||
      idc1.length > 0 ||
      idc2.length > 0 ||
      idc3.length > 0
    ) {
      const subjectTypeLabel = isBcomProgram ? "MDC" : "IDC";
      const aecIdcTable = {
        headers: [
          "AEC For Sem I",
          "AEC For Sem II",
          "AEC For Sem III",
          "AEC For Sem IV",
          `${subjectTypeLabel} For Sem I`,
          `${subjectTypeLabel} For Sem II`,
          `${subjectTypeLabel} For Sem III`,
        ],
        subjects: [
          aec1[0]?.subjectCode || "",
          aec2[0]?.subjectCode || "",
          aec3[0]?.subjectCode || "",
          aec4[0]?.subjectCode || "",
          idc1[0]?.subjectCode || "",
          idc2[0]?.subjectCode || "",
          idc3[0]?.subjectCode || "",
        ],
      };
      subjectDetails.push(aecIdcTable);
      console.info("[CU-REG DATA] Added AEC/IDC table:", aecIdcTable);
    }

    console.info("[CU-REG DATA] Final subject details result:", {
      count: subjectDetails.length,
      data: subjectDetails,
    });

    return subjectDetails;
  }

  private static async getUserIdByStudentId(
    studentId: number,
  ): Promise<number> {
    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, studentId));
    return student?.userId || 0;
  }

  private static async getAdmissionSubjectSelections(studentId: number) {
    console.info(
      "[CU-REG DATA] getAdmissionSubjectSelections called for studentId:",
      studentId,
    );

    const subjectSelections = await db
      .select({
        id: studentSubjectSelectionModel.id,
        subjectId: studentSubjectSelectionModel.subjectId,
        subjectSelectionMetaId:
          studentSubjectSelectionModel.subjectSelectionMetaId,
        isActive: studentSubjectSelectionModel.isActive,
        // Subject details
        subjectName: subjectModel.name,
        subjectCode: subjectModel.code,
        // Subject selection meta details
        label: subjectSelectionMetaModel.label,
        sequence: subjectSelectionMetaModel.sequence,
        // Subject type details
        subjectTypeName: subjectTypeModel.name,
      })
      .from(studentSubjectSelectionModel)
      .leftJoin(
        subjectModel,
        eq(studentSubjectSelectionModel.subjectId, subjectModel.id),
      )
      .leftJoin(
        subjectSelectionMetaModel,
        eq(
          studentSubjectSelectionModel.subjectSelectionMetaId,
          subjectSelectionMetaModel.id,
        ),
      )
      .leftJoin(
        subjectTypeModel,
        eq(subjectSelectionMetaModel.subjectTypeId, subjectTypeModel.id),
      )
      .where(
        and(
          eq(studentSubjectSelectionModel.studentId, studentId),
          eq(studentSubjectSelectionModel.isActive, true),
        ),
      )
      .orderBy(
        desc(studentSubjectSelectionModel.version),
        desc(studentSubjectSelectionModel.createdAt),
      );

    console.info("[CU-REG DATA] Database query result:", {
      count: subjectSelections.length,
      data: subjectSelections,
    });

    if (subjectSelections.length === 0) {
      console.info(
        "[CU-REG DATA] No subject selections found for studentId:",
        studentId,
      );
      return null;
    }

    return subjectSelections;
  }

  private static async getPersonalDetailsIdByStudentId(
    studentId: number,
  ): Promise<number> {
    const [personalDetails] = await db
      .select({ id: personalDetailsModel.id })
      .from(personalDetailsModel)
      .leftJoin(
        studentModel,
        eq(personalDetailsModel.userId, studentModel.userId),
      )
      .where(eq(studentModel.id, studentId));
    return personalDetails?.id || 0;
  }

  /**
   * Get current session name for PDF generation using promotions table
   */
  private static async getCurrentSessionName(
    studentId: number,
  ): Promise<string> {
    try {
      // Get session from promotions table for the specific student
      const [studentPromotion] = await db
        .select({
          sessionName: sessionModel.name,
          sessionId: promotionModel.sessionId,
        })
        .from(promotionModel)
        .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
        .where(eq(promotionModel.studentId, studentId))
        .orderBy(desc(promotionModel.createdAt)) // Get the most recent promotion
        .limit(1);

      if (studentPromotion?.sessionName) {
        console.log(
          "[CU-REG DATA] Found session from promotions table:",
          studentPromotion.sessionName,
        );
        return studentPromotion.sessionName;
      }

      // Fallback: Try to get current session directly
      const [currentSession] = await db
        .select({ name: sessionModel.name })
        .from(sessionModel)
        .where(eq(sessionModel.isCurrentSession, true))
        .limit(1);

      if (currentSession?.name) {
        console.log(
          "[CU-REG DATA] Found current session as fallback:",
          currentSession.name,
        );
        return currentSession.name;
      }

      // Fallback: Try to get from current academic year
      const [currentAcademicYear] = await db
        .select({
          year: academicYearModel.year,
          sessionName: sessionModel.name,
        })
        .from(academicYearModel)
        .leftJoin(
          sessionModel,
          eq(academicYearModel.id, sessionModel.academicYearId),
        )
        .where(eq(academicYearModel.isCurrentYear, true))
        .limit(1);

      if (currentAcademicYear?.sessionName) {
        console.log(
          "[CU-REG DATA] Found session from current academic year:",
          currentAcademicYear.sessionName,
        );
        return currentAcademicYear.sessionName;
      }

      if (currentAcademicYear?.year) {
        // Fallback to academic year format
        const sessionName = `${currentAcademicYear.year}-${parseInt(currentAcademicYear.year) + 1}`;
        console.log(
          "[CU-REG DATA] Using academic year as session name:",
          sessionName,
        );
        return sessionName;
      }

      // Final fallback
      console.warn(
        "[CU-REG DATA] No session found for student or current session, using default",
      );
      return "2025-2026";
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error fetching session from promotions:",
        error,
      );
      return "2025-2026"; // Fallback
    }
  }

  /**
   * Get dynamic subject details based on stream and program course
   */
  private static async getDynamicSubjectDetails(
    studentId: number,
    programCourseId: number,
    sessionId: number,
    programCourseName: string = "",
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      console.log("[CU-REG DATA] Getting dynamic subject details", {
        studentId,
        programCourseId,
        sessionId,
      });

      // Get program course details with stream information
      const [programCourse] = await db
        .select({
          streamName: streamModel.name,
          streamCode: streamModel.code,
          programCourseId: programCourseModel.id,
        })
        .from(programCourseModel)
        .leftJoin(streamModel, eq(programCourseModel.streamId, streamModel.id))
        .where(eq(programCourseModel.id, programCourseId));

      if (!programCourse) {
        console.warn(
          "[CU-REG DATA] Program course not found, using fallback subject selection",
        );
        return await this.getFallbackSubjectDetails(
          studentId,
          programCourseName,
        );
      }

      console.log("[CU-REG DATA] Program course details:", programCourse);

      const isCommerceStream =
        programCourse.streamName?.toLowerCase() === "commerce";
      console.log("[CU-REG DATA] Is Commerce stream:", isCommerceStream);

      if (isCommerceStream) {
        return await this.getCommerceStreamSubjects(
          studentId,
          programCourseId,
          sessionId,
          programCourseName,
        );
      } else {
        // For non-Commerce streams, get subjects from both student selection AND papers table
        return await this.getNonCommerceStreamSubjects(
          studentId,
          programCourseId,
          sessionId,
          programCourseName,
        );
      }
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error getting dynamic subject details:",
        error,
      );
      return await this.getFallbackSubjectDetails(studentId, programCourseName);
    }
  }

  /**
   * Get subjects for Commerce stream from papers table
   */
  private static async getCommerceStreamSubjects(
    studentId: number,
    programCourseId: number,
    sessionId: number,
    programCourseName: string = "",
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      // Get current academic year for the session
      const [academicYear] = await db
        .select({ id: academicYearModel.id })
        .from(academicYearModel)
        .leftJoin(
          sessionModel,
          eq(academicYearModel.id, sessionModel.academicYearId),
        )
        .where(eq(sessionModel.id, sessionId))
        .limit(1);

      if (!academicYear) {
        console.warn(
          "[CU-REG DATA] Academic year not found for session, using fallback",
        );
        return [];
      }

      // Get semester classes
      const semesterClasses = await db
        .select({ id: classModel.id, name: classModel.name })
        .from(classModel)
        .where(eq(classModel.name, "SEMESTER I"));

      const semester1Class = semesterClasses.find(
        (c) => c.name === "SEMESTER I",
      );
      if (!semester1Class) {
        console.warn("[CU-REG DATA] SEMESTER I class not found");
        return [];
      }

      // Get program course name to check if it's BCOM
      const [programCourseInfo] = await db
        .select({ name: programCourseModel.name })
        .from(programCourseModel)
        .where(eq(programCourseModel.id, programCourseId));

      const isBcomProgram = programCourseInfo?.name
        ?.normalize("NFKD")
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase()
        .startsWith("BCOM");

      console.log(
        "[CU-REG DATA] Program course name:",
        programCourseInfo?.name,
      );
      console.log("[CU-REG DATA] Is BCOM program:", isBcomProgram);

      // Get subject types - for BCOM, fetch MDC instead of IDC
      const subjectTypeCodes = isBcomProgram
        ? ["DSCC", "MN", "AEC", "MDC"]
        : ["DSCC", "MN", "AEC", "IDC"];

      const subjectTypes = await db
        .select({
          id: subjectTypeModel.id,
          code: subjectTypeModel.code,
          name: subjectTypeModel.name,
        })
        .from(subjectTypeModel)
        .where(inArray(subjectTypeModel.code, subjectTypeCodes));

      const dsccType = subjectTypes.find((st) => st.code === "DSCC");
      const mnType = subjectTypes.find((st) => st.code === "MN");
      const aecType = subjectTypes.find((st) => st.code === "AEC");
      const idcType = isBcomProgram
        ? subjectTypes.find((st) => st.code === "MDC") // For BCOM, use MDC as IDC
        : subjectTypes.find((st) => st.code === "IDC");

      if (!dsccType || !mnType || !aecType || !idcType) {
        console.warn("[CU-REG DATA] Required subject types not found");
        return [];
      }

      // Get papers for different subject types and semesters
      const papers = await db
        .select({
          subjectName: subjectModel.name,
          subjectCode: subjectModel.code,
          subjectTypeCode: subjectTypeModel.code,
          className: classModel.name,
        })
        .from(paperModel)
        .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
        .leftJoin(
          subjectTypeModel,
          eq(paperModel.subjectTypeId, subjectTypeModel.id),
        )
        .leftJoin(classModel, eq(paperModel.classId, classModel.id))
        .where(
          and(
            eq(paperModel.programCourseId, programCourseId),
            eq(paperModel.academicYearId, academicYear.id),
            inArray(
              paperModel.subjectTypeId,
              [dsccType?.id, mnType?.id, aecType?.id, idcType?.id].filter(
                Boolean,
              ),
            ),
          ),
        );

      console.log("[CU-REG DATA] Found papers:", papers.length);
      console.log("[CU-REG DATA] Papers details:", papers);
      console.log("[CU-REG DATA] Subject type IDs used:", [
        dsccType?.id,
        mnType?.id,
        aecType?.id,
        idcType?.id,
      ]);
      console.log("[CU-REG DATA] Program course ID:", programCourseId);
      console.log("[CU-REG DATA] Academic year ID:", academicYear.id);

      // Organize subjects by type and semester
      const subjectsByType: Record<string, Record<string, string>> = {};

      papers.forEach((paper) => {
        console.log("[CU-REG DATA] Processing paper:", {
          subjectName: paper.subjectName,
          subjectTypeCode: paper.subjectTypeCode,
          className: paper.className,
        });
        if (paper.subjectTypeCode && paper.className) {
          if (!subjectsByType[paper.subjectTypeCode]) {
            subjectsByType[paper.subjectTypeCode] = {};
          }
          subjectsByType[paper.subjectTypeCode][paper.className] =
            paper.subjectName || "";
        }
      });

      console.log("[CU-REG DATA] Organized subjects by type:", subjectsByType);

      // Build Core/Major and Minor table
      const coreMinorTable = {
        headers: [
          "Core/Major",
          "Minor For Sem I",
          "Minor For Sem II",
          "Minor For Sem III",
          "Minor For Sem IV",
        ],
        subjects: [
          subjectsByType["DSCC"]?.["SEMESTER I"] || "",
          subjectsByType["MN"]?.["SEMESTER I"] || "",
          subjectsByType["MN"]?.["SEMESTER II"] || "",
          "", // Minor 3 - from student selection
          "", // Minor 4 - same as Minor 3
        ],
      };

      // Build AEC/IDC table (fetch IDC from papers if available, or MDC for BCOM)
      const subjectTypeKey = isBcomProgram ? "MDC" : "IDC";
      const subjectTypeLabel = isBcomProgram ? "MDC" : "IDC";

      const aecIdcTable = {
        headers: [
          "AEC For Sem I",
          "AEC For Sem II",
          "AEC For Sem III",
          "AEC For Sem IV",
          `${subjectTypeLabel} For Sem I`,
          `${subjectTypeLabel} For Sem II`,
          `${subjectTypeLabel} For Sem III`,
        ],
        subjects: [
          subjectsByType["AEC"]?.["SEMESTER I"] || "",
          subjectsByType["AEC"]?.["SEMESTER II"] || "",
          subjectsByType["AEC"]?.["SEMESTER III"] || "",
          subjectsByType["AEC"]?.["SEMESTER III"] || "", // AEC4 = AEC3
          subjectsByType[subjectTypeKey]?.["SEMESTER I"] || "", // IDC1/MDC1 from papers
          subjectsByType[subjectTypeKey]?.["SEMESTER II"] || "", // IDC2/MDC2 from papers
          subjectsByType[subjectTypeKey]?.["SEMESTER III"] || "", // IDC3/MDC3 from papers
        ],
      };

      console.log("[CU-REG DATA] Commerce stream subjects built:", {
        coreMinor: coreMinorTable,
        aecIdc: aecIdcTable,
      });

      // Also get student-selected subjects for Commerce stream to populate Minor 3/4
      const subjectSelections =
        await this.getAdmissionSubjectSelections(studentId);
      const studentSubjects = this.formatSubjectDetails(
        subjectSelections || [],
        isBcomProgram,
        programCourseName,
      );
      const papersSubjects = [coreMinorTable, aecIdcTable];

      // Merge student subjects with papers subjects
      return this.mergeSubjectSources(studentSubjects, papersSubjects);
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error getting Commerce stream subjects:",
        error,
      );
      return [];
    }
  }

  /**
   * Get subjects for non-Commerce stream from both student-subject-selection and papers table
   */
  private static async getNonCommerceStreamSubjects(
    studentId: number,
    programCourseId: number,
    sessionId: number,
    programCourseName: string = "",
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      console.log(
        "[CU-REG DATA] Getting non-Commerce stream subjects with papers data",
      );

      // Get program course name
      const [programCourseInfo] = await db
        .select({ name: programCourseModel.name })
        .from(programCourseModel)
        .where(eq(programCourseModel.id, programCourseId));

      // Get subjects from student selection
      const subjectSelections =
        await this.getAdmissionSubjectSelections(studentId);
      const studentSubjects = this.formatSubjectDetails(
        subjectSelections || [],
        false, // Non-commerce streams don't use BCOM logic
        programCourseName,
      );

      // Get additional subjects from papers table for missing categories
      const papersSubjects = await this.getAdditionalSubjectsFromPapers(
        programCourseId,
        sessionId,
        programCourseName,
      );

      // Merge the two sources
      return this.mergeSubjectSources(studentSubjects, papersSubjects);
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error getting non-Commerce stream subjects:",
        error,
      );
      return [];
    }
  }

  /**
   * Get additional subjects from papers table for missing categories
   */
  private static async getAdditionalSubjectsFromPapers(
    programCourseId: number,
    sessionId: number,
    programCourseName: string = "",
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      console.log(
        "[CU-REG DATA] Getting additional subjects from papers table",
      );

      // Get current academic year for the session
      const [academicYear] = await db
        .select({ id: academicYearModel.id })
        .from(academicYearModel)
        .leftJoin(
          sessionModel,
          eq(academicYearModel.id, sessionModel.academicYearId),
        )
        .where(eq(sessionModel.id, sessionId))
        .limit(1);

      if (!academicYear) {
        console.warn(
          "[CU-REG DATA] Academic year not found for session, skipping papers",
        );
        return [];
      }

      // Get subject types - look for both codes and names
      const subjectTypes = await db
        .select({
          id: subjectTypeModel.id,
          code: subjectTypeModel.code,
          name: subjectTypeModel.name,
        })
        .from(subjectTypeModel);

      console.log("[CU-REG DATA] All subject types:", subjectTypes);

      // Look for subject types by exact code first, then by name patterns
      const dsccType =
        subjectTypes.find((st) => st.code === "DSCC") ||
        subjectTypes.find(
          (st) =>
            st.name?.toLowerCase().includes("discipline specific core") ||
            st.name?.toLowerCase().includes("core course") ||
            st.name?.toLowerCase().includes("major"),
        );

      const aecType =
        subjectTypes.find((st) => st.code === "AEC") ||
        subjectTypes.find((st) =>
          st.name?.toLowerCase().includes("ability enhancement"),
        );

      const idcType =
        subjectTypes.find((st) => st.code === "IDC") ||
        subjectTypes.find((st) =>
          st.name?.toLowerCase().includes("inter disciplinary"),
        );

      console.log("[CU-REG DATA] Mapped subject types:", {
        dscc: dsccType,
        aec: aecType,
        idc: idcType,
      });

      if (!dsccType && !aecType && !idcType) {
        console.warn(
          "[CU-REG DATA] No subject types found with codes DSCC, AEC, IDC",
        );
        // Let's check what subject types actually exist
        const allSubjectTypes = await db
          .select({
            id: subjectTypeModel.id,
            code: subjectTypeModel.code,
            name: subjectTypeModel.name,
          })
          .from(subjectTypeModel);
        console.log(
          "[CU-REG DATA] All available subject types:",
          allSubjectTypes,
        );
        return [];
      }

      // Get papers for different subject types and semesters
      const subjectTypeIds = [dsccType?.id, aecType?.id, idcType?.id].filter(
        (id): id is number => id !== undefined,
      );

      if (subjectTypeIds.length === 0) {
        console.warn(
          "[CU-REG DATA] No valid subject type IDs found, skipping papers query",
        );
        return [];
      }

      const papers = await db
        .select({
          subjectName: subjectModel.name,
          subjectCode: subjectModel.code,
          subjectTypeCode: subjectTypeModel.code,
          subjectTypeName: subjectTypeModel.name,
          className: classModel.name,
        })
        .from(paperModel)
        .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
        .leftJoin(
          subjectTypeModel,
          eq(paperModel.subjectTypeId, subjectTypeModel.id),
        )
        .leftJoin(classModel, eq(paperModel.classId, classModel.id))
        .where(
          and(
            eq(paperModel.programCourseId, programCourseId),
            eq(paperModel.academicYearId, academicYear.id),
            inArray(paperModel.subjectTypeId, subjectTypeIds),
          ),
        );

      console.log("[CU-REG DATA] Found additional papers:", papers.length);
      console.log("[CU-REG DATA] Papers details:", papers);
      console.log(
        "[CU-REG DATA] Subject type IDs used for papers:",
        subjectTypeIds,
      );
      console.log(
        "[CU-REG DATA] Program course ID for papers:",
        programCourseId,
      );
      console.log(
        "[CU-REG DATA] Academic year ID for papers:",
        academicYear.id,
      );

      // Organize subjects by type and semester
      const subjectsByType: Record<string, Record<string, string>> = {};

      papers.forEach((paper) => {
        console.log("[CU-REG DATA] Processing additional paper:", {
          subjectName: paper.subjectName,
          subjectTypeCode: paper.subjectTypeCode,
          className: paper.className,
        });
        if (paper.subjectTypeCode && paper.className) {
          if (!subjectsByType[paper.subjectTypeCode]) {
            subjectsByType[paper.subjectTypeCode] = {};
          }
          subjectsByType[paper.subjectTypeCode][paper.className] =
            paper.subjectName || "";
        }
      });

      console.log("[CU-REG DATA] Organized subjects by type:", subjectsByType);

      console.info(
        "[CU-REG DATA] Creating Core/Major table from papers with courseName:",
        programCourseName,
        "Type:",
        typeof programCourseName,
      );

      // Build Core/Major and Minor table (only Core/Major from papers)
      const coreMinorTable = {
        headers: [
          "Core/Major",
          "Minor For Sem I",
          "Minor For Sem II",
          "Minor For Sem III",
          "Minor For Sem IV",
        ],
        subjects: [
          programCourseName || "", // Use course name for Core/Majorid
          "", // Minor 1 - from student selection
          "", // Minor 2 - from student selection
          "", // Minor 3 - from student selection
          "", // Minor 4 - from student selection
        ],
      };

      // Build AEC/IDC table (use papers data wherever available, student selection fills gaps)
      const aecIdcTable = {
        headers: [
          "AEC For Sem I",
          "AEC For Sem II",
          "AEC For Sem III",
          "AEC For Sem IV",
          "IDC For Sem I",
          "IDC For Sem II",
          "IDC For Sem III",
        ],
        subjects: [
          subjectsByType["AEC"]?.["SEMESTER I"] || "", // AEC1 from papers
          subjectsByType["AEC"]?.["SEMESTER II"] || "", // AEC2 from papers
          subjectsByType["AEC"]?.["SEMESTER III"] || "", // AEC3 from papers if exists
          subjectsByType["AEC"]?.["SEMESTER IV"] || "", // AEC4 from papers if exists
          subjectsByType["IDC"]?.["SEMESTER I"] || "", // IDC1 from papers if exists
          subjectsByType["IDC"]?.["SEMESTER II"] || "", // IDC2 from papers if exists
          subjectsByType["IDC"]?.["SEMESTER III"] || "", // IDC3 from papers if exists
        ],
      };

      console.log("[CU-REG DATA] Additional papers subjects built:", {
        coreMinor: coreMinorTable,
        aecIdc: aecIdcTable,
      });

      return [coreMinorTable, aecIdcTable];
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error getting additional subjects from papers:",
        error,
      );
      return [];
    }
  }

  /**
   * Merge subject sources - student selection + papers table
   */
  private static mergeSubjectSources(
    studentSubjects: Array<{ headers: string[]; subjects: string[] }>,
    papersSubjects: Array<{ headers: string[]; subjects: string[] }>,
  ): Array<{ headers: string[]; subjects: string[] }> {
    try {
      console.log("[CU-REG DATA] Merging subject sources");
      console.log(
        "[CU-REG DATA] Student subjects Core/Major:",
        studentSubjects[0]?.subjects[0],
      );
      console.log(
        "[CU-REG DATA] Papers subjects Core/Major:",
        papersSubjects[0]?.subjects[0],
      );

      if (studentSubjects.length === 0) {
        return papersSubjects;
      }

      if (papersSubjects.length === 0) {
        return studentSubjects;
      }

      // Merge Core/Major and Minor table
      const mergedCoreMinor = {
        headers:
          studentSubjects[0]?.headers || papersSubjects[0]?.headers || [],
        subjects: [
          studentSubjects[0]?.subjects[0] ||
            papersSubjects[0]?.subjects[0] ||
            "", // Core/Major from student (course name)
          studentSubjects[0]?.subjects[1] ||
            papersSubjects[0]?.subjects[1] ||
            "", // Minor 1 from student
          studentSubjects[0]?.subjects[2] ||
            papersSubjects[0]?.subjects[2] ||
            "", // Minor 2 from student
          studentSubjects[0]?.subjects[3] ||
            papersSubjects[0]?.subjects[3] ||
            "", // Minor 3 from student
          studentSubjects[0]?.subjects[3] ||
            papersSubjects[0]?.subjects[3] ||
            "", // Minor 4 = Minor 3 (duplicated)
        ],
      };

      // Merge AEC/IDC table (always 7 columns: AEC 1-4 + IDC 1-3)
      const mergedAecIdc = {
        headers:
          studentSubjects[1]?.headers || papersSubjects[1]?.headers || [],
        subjects: [
          papersSubjects[1]?.subjects[0] ||
            studentSubjects[1]?.subjects[0] ||
            "", // AEC1 from papers
          papersSubjects[1]?.subjects[1] ||
            studentSubjects[1]?.subjects[1] ||
            "", // AEC2 from papers
          studentSubjects[1]?.subjects[2] ||
            papersSubjects[1]?.subjects[2] ||
            "", // AEC3 from student
          studentSubjects[1]?.subjects[2] ||
            papersSubjects[1]?.subjects[2] ||
            "", // AEC4 = AEC3 (duplication)
          studentSubjects[1]?.subjects[4] ||
            papersSubjects[1]?.subjects[4] ||
            "", // IDC1 from student (empty for Commerce)
          studentSubjects[1]?.subjects[5] ||
            papersSubjects[1]?.subjects[5] ||
            "", // IDC2 from student (empty for Commerce)
          studentSubjects[1]?.subjects[6] ||
            papersSubjects[1]?.subjects[6] ||
            "", // IDC3 from student (empty for Commerce)
        ],
      };

      console.log("[CU-REG DATA] Merged subjects:", {
        coreMinor: mergedCoreMinor,
        aecIdc: mergedAecIdc,
      });
      console.log(
        "[CU-REG DATA] Final Core/Major value:",
        mergedCoreMinor.subjects[0],
      );

      return [mergedCoreMinor, mergedAecIdc];
    } catch (error) {
      console.error("[CU-REG DATA] Error merging subject sources:", error);
      return studentSubjects; // Fallback to student subjects
    }
  }

  /**
   * Fallback method using existing subject selection logic
   */
  private static async getFallbackSubjectDetails(
    studentId: number,
    programCourseName: string = "",
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      const subjectSelections =
        await this.getAdmissionSubjectSelections(studentId);
      return this.formatSubjectDetails(
        subjectSelections || [],
        false,
        programCourseName,
      );
    } catch (error) {
      console.error("[CU-REG DATA] Error in fallback subject details:", error);
      return [];
    }
  }
}
