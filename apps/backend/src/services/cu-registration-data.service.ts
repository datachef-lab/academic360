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
} from "@repo/db/schemas/models/academics";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model";
import {
  paperModel,
  subjectModel,
  subjectTypeModel,
  streamModel,
  programCourseModel,
} from "@repo/db/schemas/models/course-design";
import { CuRegistrationFormData } from "./pdf-generation.service.js";

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
        .leftJoin(
          specializationModel,
          eq(studentModel.specializationId, specializationModel.id),
        )
        .where(eq(studentModel.id, options.studentId));

      if (!studentData) {
        throw new Error("Student not found");
      }

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
        shiftName: "Day", // Default shift - this might need to be fetched from actual data
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
        pwdStatus: personalDetails?.disability ? "Yes" : "No",
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
      };

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
      });

      return formData;
    } catch (error) {
      console.error("[CU-REG DATA] Error fetching student data:", error);
      throw new Error(
        `Failed to fetch student data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
  ): Array<{ headers: string[]; subjects: string[] }> {
    console.info("[CU-REG DATA] formatSubjectDetails called with:", {
      count: subjectSelections?.length || 0,
      data: subjectSelections,
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
      const coreMinorTable = {
        headers: [
          "Core/Major",
          "Minor For Sem I & II",
          "Minor For Sem III & IV",
          "Minor For Sem V & VI",
          "Minor For Sem VII & VIII",
        ],
        subjects: [
          coreSubjects[0]?.subjectName || "",
          minor1[0]?.subjectName || "",
          minor2[0]?.subjectName || "",
          minor3[0]?.subjectName || "",
          minor4[0]?.subjectName || "", // Minor 4 = Minor 3 if minor3 exists
        ],
      };
      subjectDetails.push(coreMinorTable);
      console.info("[CU-REG DATA] Added Core/Major table:", coreMinorTable);
    }

    // AEC/IDC subjects table - look for AEC and IDC subjects
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
    const idc1 =
      subjectsByLabel["IDC 1"] ||
      subjectsByLabel["IDC1"] ||
      subjectsByLabel["IDC 1 (Semester I)"] ||
      [];
    const idc2 =
      subjectsByLabel["IDC 2"] ||
      subjectsByLabel["IDC2"] ||
      subjectsByLabel["IDC 2 (Semester II)"] ||
      [];
    const idc3 =
      subjectsByLabel["IDC 3"] ||
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
        return await this.getFallbackSubjectDetails(studentId);
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
        );
      } else {
        // For non-Commerce streams, get subjects from both student selection AND papers table
        return await this.getNonCommerceStreamSubjects(
          studentId,
          programCourseId,
          sessionId,
        );
      }
    } catch (error) {
      console.error(
        "[CU-REG DATA] Error getting dynamic subject details:",
        error,
      );
      return await this.getFallbackSubjectDetails(studentId);
    }
  }

  /**
   * Get subjects for Commerce stream from papers table
   */
  private static async getCommerceStreamSubjects(
    studentId: number,
    programCourseId: number,
    sessionId: number,
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

      // Get subject types
      const subjectTypes = await db
        .select({
          id: subjectTypeModel.id,
          code: subjectTypeModel.code,
          name: subjectTypeModel.name,
        })
        .from(subjectTypeModel)
        .where(inArray(subjectTypeModel.code, ["DSCC", "MN", "AEC", "IDC"]));

      const dsccType = subjectTypes.find((st) => st.code === "DSCC");
      const mnType = subjectTypes.find((st) => st.code === "MN");
      const aecType = subjectTypes.find((st) => st.code === "AEC");
      const idcType = subjectTypes.find((st) => st.code === "IDC");

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
          "Minor For 1",
          "Minor For 2",
          "Minor For 3",
          "Minor For 4",
        ],
        subjects: [
          subjectsByType["DSCC"]?.["SEMESTER I"] || "",
          subjectsByType["MN"]?.["SEMESTER I"] || "",
          subjectsByType["MN"]?.["SEMESTER II"] || "",
          "", // Minor 3 - from student selection
          "", // Minor 4 - same as Minor 3
        ],
      };

      // Build AEC/IDC table (fetch IDC from papers if available)
      const aecIdcTable = {
        headers: [
          "AEC For 1",
          "AEC For 2",
          "AEC For 3",
          "AEC For 4",
          "IDC For Sem 1",
          "IDC For Sem 2",
          "IDC For Sem 3",
        ],
        subjects: [
          subjectsByType["AEC"]?.["SEMESTER I"] || "",
          subjectsByType["AEC"]?.["SEMESTER II"] || "",
          subjectsByType["AEC"]?.["SEMESTER III"] || "",
          subjectsByType["AEC"]?.["SEMESTER III"] || "", // AEC4 = AEC3
          subjectsByType["IDC"]?.["SEMESTER I"] || "", // IDC1 from papers
          subjectsByType["IDC"]?.["SEMESTER II"] || "", // IDC2 from papers
          subjectsByType["IDC"]?.["SEMESTER III"] || "", // IDC3 from papers
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
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      console.log(
        "[CU-REG DATA] Getting non-Commerce stream subjects with papers data",
      );

      // Get subjects from student selection
      const subjectSelections =
        await this.getAdmissionSubjectSelections(studentId);
      const studentSubjects = this.formatSubjectDetails(
        subjectSelections || [],
      );

      // Get additional subjects from papers table for missing categories
      const papersSubjects = await this.getAdditionalSubjectsFromPapers(
        programCourseId,
        sessionId,
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

      // Build Core/Major and Minor table (only Core/Major from papers)
      const coreMinorTable = {
        headers: [
          "Core/Major",
          "Minor For 1",
          "Minor For 2",
          "Minor For 3",
          "Minor For 4",
        ],
        subjects: [
          subjectsByType["DSCC"]?.["SEMESTER I"] || "", // Core/Major from papers
          "", // Minor 1 - from student selection
          "", // Minor 2 - from student selection
          "", // Minor 3 - from student selection
          "", // Minor 4 - from student selection
        ],
      };

      // Build AEC/IDC table (use papers data wherever available, student selection fills gaps)
      const aecIdcTable = {
        headers: [
          "AEC For 1",
          "AEC For 2",
          "AEC For 3",
          "AEC For 4",
          "IDC For Sem 1",
          "IDC For Sem 2",
          "IDC For Sem 3",
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
          papersSubjects[0]?.subjects[0] ||
            studentSubjects[0]?.subjects[0] ||
            "", // Core/Major from papers
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
  ): Promise<Array<{ headers: string[]; subjects: string[] }>> {
    try {
      const subjectSelections =
        await this.getAdmissionSubjectSelections(studentId);
      return this.formatSubjectDetails(subjectSelections || []);
    } catch (error) {
      console.error("[CU-REG DATA] Error in fallback subject details:", error);
      return [];
    }
  }
}
