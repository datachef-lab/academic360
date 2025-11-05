import bcrypt from "bcryptjs";
import { and, eq, ilike, or } from "drizzle-orm";
import { Pool } from "mysql2/typings/mysql/lib/Pool";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { db, mysqlConnection } from "@/db";
import {
  OldCourseDetails,
  OldAdmStudentPersonalDetail,
  OldAdmSubjectDetails,
  OldCvSubjectSelection,
  OldMeritList,
  OldStudentCategory,
  OldBoardSubjectMappingSub,
  OldBoardSubjectName,
  OldBoardSubjectMapping,
  OldBoardResultStatus,
} from "@repo/db/legacy-system-types/admissions";
import {
  OldCityMaintab,
  OldCitySubtab,
  OldCountry,
  OldCountrySubTab,
  OldDegree,
  OldDistrict,
  OldInstitution,
  OldPoliceStation,
  OldPostOffice,
} from "@repo/db/legacy-system-types/resources";

interface OldLanguageMedium {
  readonly id: number;
  name: string;
}
import {
  OldHistoricalRecord,
  OldStaff,
  OldStudent,
} from "@repo/db/legacy-system-types/users";
import {
  addressModel,
  annualIncomeModel,
  bloodGroupModel,
  categoryModel,
  cityModel,
  countryModel,
  districtModel,
  languageMediumModel,
  nationalityModel,
  occupationModel,
  religionModel,
  specializationModel,
  stateModel,
  accommodationModel,
  Address,
  BloodGroup,
  healthModel,
  Health,
  emergencyContactModel,
  EmergencyContact,
  personalDetailsModel,
  admissionCourseDetailsModel,
  Student,
  Stream,
  CourseType,
  courseTypeModel,
  AdmissionCourseDetails,
  affiliationModel,
  classModel,
  regulationTypeModel,
  academicYearModel,
  subjectModel,
  subjectTypeModel,
  paperModel,
  courseLevelModel,
  programCourseModel,
  studentCategoryModel,
  streamModel,
  courseModel,
  eligibilityCriteriaModel,
  shiftModel,
  meritListModel,
  bankModel,
  bankBranchModel,
  admSubjectPaperSelectionModel,
  ProgramCourse,
  Course,
  personModel,
  familyModel,
  Occupation,
  gradeModel,
  userTypeEnum,
  userModel,
  User,
  studentModel,
  applicationFormModel,
  admissionModel,
  sessionModel,
  Session,
  ApplicationForm,
  admissionGeneralInfoModel,
  EligibilityCriteria,
  StudentCategory,
  PersonalDetails,
  Accommodation,
  BankBranch,
  admissionAcademicInfoModel,
  AdmissionAcademicInfo,
  Board,
  boardModel,
  Degree,
  degreeModel,
  LanguageMedium,
  LanguageMediumT,
  Institution,
  institutionModel,
  Specialization,
  studentAcademicSubjectModel,
  Subject,
  BoardSubject,
  boardSubjectModel,
  admissionProgramCourseModel,
  AcademicYear,
  CancelSource,
  cancelSourceModel,
  sectionModel,
  admissionAdditionalInfoModel,
  transportDetailsModel,
  Class,
  RegulationType,
  Affiliation,
  BoardResultStatus,
  boardResultStatusModel,
  Section,
  Family,
  Person,
} from "@repo/db/schemas";
import { AdmissionCourseDetailsT } from "@repo/db/schemas/models/admissions/adm-course-details.model";
// import { processStudent } from "../controllers/oldStudent.controller"; // Removed to avoid conflict
import {
  OldClass,
  OldCourse,
  OldEligibilityCriteria,
  OldSubject,
  OldSubjectType,
} from "@repo/db/legacy-system-types/course-design";
import { OldShift } from "@/types/old-data/old-shift";
import { OldBank, OldBankBranch } from "@repo/db/legacy-system-types/payment";
import { staffModel } from "@repo/db/schemas/models/user/staff.model";
import {
  OldAcademicDetails,
  OldAcademicYear,
  OldBoard,
  OldSection,
  OldSession,
} from "@repo/db/legacy-system-types/academics";
import { addDegree } from "@/features/resources/services/degree.service";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions/board-subject-name.model";
import {
  PromotionInsertSchema,
  promotionModel,
  PromotionT,
} from "@repo/db/schemas/models/batches/promotions.model";
import { OldPromotionStatus } from "@repo/db/legacy-system-types/batches";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model";
import { postOfficeModel } from "@repo/db/schemas/models/user/post-office.model";
import { policeStationModel } from "@repo/db/schemas/models/user/police-station.model";
import { upsertUser } from "./refactor-old-migration.service";
import { CLIENT_RENEG_LIMIT } from "tls";

const BATCH_SIZE = 500;

type DbType = NodePgDatabase<Record<string, never>> & {
  $client: Pool;
};

const isStaff = (d: OldAdmStudentPersonalDetail | OldStaff): d is OldStaff =>
  "isTeacher" in d;
const isAdmStudent = (
  d: OldAdmStudentPersonalDetail | OldStaff,
): d is OldAdmStudentPersonalDetail => "applevel" in d;

export function formatAadhaarCardNumber(
  aadhaar: string | number,
): string | undefined {
  // Convert to string and remove any non-digit characters (just in case)
  const digits = String(aadhaar).replace(/\D/g, "");
  console.log("aadhaar:", aadhaar);
  // Validate that it contains exactly 12 digits
  if (digits.length !== 12) {
    return undefined;
    // throw new Error("Invalid Aadhaar number: must contain exactly 12 digits.");
  }

  // Return formatted Aadhaar number (4-4-4 pattern)
  return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1-$2-$3");
}

async function fetchData(
  isTransferred: boolean,
  offset: number,
  limit: number = BATCH_SIZE,
) {
  if (isTransferred) {
    const [personalDetailsResult] = await mysqlConnection.query(`
            SELECT COUNT(pd.id) AS totalRows
            FROM
                personaldetails pd,
                studentpersonaldetails s,
                coursedetails cd
            WHERE 
                cd.id = s.admissionid
                AND pd.id = cd.parent_id
            ORDER BY cd.id;
        `);
    const { totalRows } = (personalDetailsResult as { totalRows: number }[])[0];
    const [rows] = (await mysqlConnection.query(`
            SELECT pd.* 
            FROM 
                personaldetails pd,
                studentpersonaldetails s,
                coursedetails cd
            WHERE 
                cd.id = s.admissionid
                AND pd.id = cd.parent_id
            ORDER BY cd.id
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [OldAdmStudentPersonalDetail[], any];

    return { totalRows, oldDataArr: rows as OldAdmStudentPersonalDetail[] };
  } else {
    const [personalDetailsResult] = await mysqlConnection.query(`
            SELECT COUNT(pd.id) AS totalRows 
            FROM 
                personaldetails pd,
                coursedetails cd
            WHERE
                (cd.transferred = false OR cd.transferred IS NULL)
                AND cd.parent_id = pd.id
            ORDER BY cd.id;
        `);
    const { totalRows } = (personalDetailsResult as { totalRows: number }[])[0];
    const [rows] = (await mysqlConnection.query(`
            SELECT pd.* 
            FROM 
                personaldetails pd,
                coursedetails cd
            WHERE
                (cd.transferred = false OR cd.transferred IS NULL)
                AND cd.parent_id = pd.id
            ORDER BY cd.id;
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [OldAdmStudentPersonalDetail[], any];
    return { totalRows, oldDataArr: rows as OldAdmStudentPersonalDetail[] };
  }
}

export async function loadOldBoards() {
  const [oldBoards] = (await mysqlConnection.query(`
        SELECT * FROM board;
    `)) as [OldBoard[], any];

  for (let i = 0; i < oldBoards.length; i++) {
    console.log("oldBoards[i].id", oldBoards[i].boardName);
    const board = await addBoard(oldBoards[i].id!);
    // Add the board subjects
    const [oldBoardSubjectMappingMains] = (await mysqlConnection.query(`
            SELECT * FROM boardsubjectmappingmain WHERE boardid = ${oldBoards[i].id};
        `)) as [OldBoardSubjectMapping[], any];

    for (let j = 0; j < oldBoardSubjectMappingMains.length; j++) {
      const oldBoardSubjectMappingMain = oldBoardSubjectMappingMains[j];
      const [oldBoardSubjects] = (await mysqlConnection.query(`
                SELECT * FROM boardsubjectmappingsub WHERE parent_id = ${oldBoardSubjectMappingMain.id};
            `)) as [OldBoardSubjectMappingSub[], any];

      console.log("oldBoardSubjects.length", oldBoardSubjects.length);
      for (let k = 0; k < oldBoardSubjects.length; k++) {
        await addBoardSubject(oldBoardSubjects[k].subjectid, oldBoards[i].id!);
        console.log(
          `Done adding board subject ${k + 1} of ${oldBoardSubjects.length}`,
        );
      }
    }
  }
}

// export async function loadData(byIsTransferred: boolean) {
//     console.log("loading the boards and subjects");
//     await loadOldBoards();
//     // Do fetch the data from the old database which are transferred first
//     const { totalRows } = await fetchData(byIsTransferred, 0, BATCH_SIZE);

//     // STEP 1: Count the total numbers of students
//     console.log(
//         `\n\nCounting rows from table \`personaldetails\`... for ${byIsTransferred ? "transferred" : "not transferred"}`,
//     );
//     // STEP 2: Calculate the number of batches
//     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches
//     console.log(`\nTotal rows to migrate for personaldetails: ${totalRows}`);
//     // STEP 3: Loop over the batches
//     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//         const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//         const { oldDataArr } = await fetchData(byIsTransferred, offset, BATCH_SIZE);

//         console.log(
//             `\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`,
//         );

//         for (let i = 0; i < oldDataArr.length; i++) {
//             // Fetch the related studentpersonalDetail
//             try {
//                 await processOldStudentApplicationForm(oldDataArr[i]);
//                 const name = [
//                     oldDataArr[i]?.firstName,
//                     oldDataArr[i]?.middleName,
//                     oldDataArr[i]?.lastName,
//                 ]
//                     .filter(Boolean)
//                     .join(" ");
//                 console.log(
//                     `Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${name}`,
//                 );
//             } catch (error) {
//                 console.log(error);
//             }
//         }
//     }

//     console.log("Application forms migrated successfully");

//     // await loadAllStaffs();
// }

// async function loadAllStaffs() {
//     // Step 1: Load all the old staffs and admins
//     const [rowsStaffs] = await mysqlConnection.query(`
//         SELECT COUNT(*) AS totalRows
//         FROM staffpersonaldetails
//     `);
//     const { totalRows } = (rowsStaffs as { totalRows: number }[])[0];
//     // STEP 2: Calculate the number of batches
//     const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches
//     console.log(`\nTotal rows to migrate: ${totalRows}`);
//     // STEP 3: Loop over the batches
//     for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
//         const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

//         console.log(
//             `\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`,
//         );
//         const [rows] = (await mysqlConnection.query(`
//             SELECT *
//             FROM staffpersonaldetails
//             LIMIT ${BATCH_SIZE}
//             OFFSET ${offset};
//         `)) as [OldStaff[], any];

//         const oldDataArr = rows as OldStaff[];

//         for (let i = 0; i < oldDataArr.length; i++) {
//             // Fetch the related staffs
//             const [staffPersonalDetailRows] = (await mysqlConnection.query(`
//                 SELECT *
//                 FROM staffpersonaldetails
//                 WHERE id = ${oldDataArr[i].id};
//             `)) as [OldStaff[], any];

//             await addUser(oldDataArr[i], "STAFF");

//             console.log(
//                 `StaffsBatch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Name: ${staffPersonalDetailRows[0]?.name}`,
//             );
//         }
//     }
// }

export async function addAdmissionApplicationForm(
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
) {
  const [[oldSession]] = (await mysqlConnection.query(`
        SELECT *
        FROM currentsessionmaster
        WHERE id = ${oldAdmStudentPersonalDetails.sessionId};
    `)) as [OldSession[], any];

  if (!oldSession) {
    throw new Error("No session info found");
  }
  // console.log("oldSession", oldSession);
  const [[oldAcademicYear]] = (await mysqlConnection.query(`
        SELECT *
        FROM accademicyear
        WHERE sessionId = ${oldSession.id};
    `)) as [OldAcademicYear[], any];

  if (!oldAcademicYear) {
    throw new Error("No academic year found");
  }

  const academicYearName = `${oldAcademicYear.accademicYearName}-${(Number(oldAcademicYear.accademicYearName) + 1) % 100}`;
  const codePrefix = Number(oldAcademicYear.accademicYearName) % 100;

  let [foundAcademicYear] = await db
    .select()
    .from(academicYearModel)
    .where(
      or(
        ilike(academicYearModel.year, academicYearName),
        eq(academicYearModel.legacyAcademicYearId, oldAcademicYear.id),
      ),
    );

  if (!foundAcademicYear) {
    foundAcademicYear = (
      await db
        .insert(academicYearModel)
        .values({
          legacyAcademicYearId: oldAcademicYear.id,
          year: academicYearName,
          isCurrentYear: oldAcademicYear.presentAcademicYear,
          codePrefix: codePrefix.toString(),
        })
        .returning()
    )[0];
  }

  let [foundSession] = await db
    .select()
    .from(sessionModel)
    .where(
      or(
        eq(sessionModel.legacySessionId, oldSession.id!),
        eq(sessionModel.academicYearId, foundAcademicYear.id),
        eq(sessionModel.name, oldSession.sessionName),
      ),
    );

  if (!foundSession) {
    foundSession = (
      await db
        .insert(sessionModel)
        .values({
          legacySessionId: oldSession.id!,
          academicYearId: foundAcademicYear.id,
          name: oldSession.sessionName,
          from: new Date(oldSession.fromDate as any).toISOString().slice(0, 10),
          to: new Date(oldSession.toDate as any).toISOString().slice(0, 10),
          isCurrentSession: oldSession.iscurrentsession,
          codePrefix: oldSession.codeprefix,
        } as Session)
        .returning()
    )[0];
  }

  let [foundAdmission] = await db
    .select()
    .from(admissionModel)
    .where(eq(admissionModel.sessionId, foundSession.id));

  if (!foundAdmission) {
    foundAdmission = (
      await db
        .insert(admissionModel)
        .values({
          sessionId: foundSession.id,
          status: "SUBJECT_PAPER_SELECTION",
          isClosed: false,
          isArchived: false,
        })
        .returning()
    )[0];
  }

  let admApprovedBy: User | null = null;
  if (oldAdmStudentPersonalDetails.admapprovedby) {
    const [[oldStaffAdmApprovedBy]] = (await mysqlConnection.query(`
            SELECT *
            FROM staffpersonaldetails
            WHERE id = ${oldAdmStudentPersonalDetails.admapprovedby};
        `)) as [OldStaff[], any];

    admApprovedBy = (await upsertUser(oldStaffAdmApprovedBy, "STAFF")) ?? null;
  }

  const [applicationForm] = await db
    .insert(applicationFormModel)
    .values({
      admissionId: foundAdmission.id!,
      level:
        oldAdmStudentPersonalDetails.applevel?.trim().toUpperCase() === "UG"
          ? "UNDER_GRADUATE"
          : "POST_GRADUATE",
      applicationNumber: "",
      admApprovedBy: admApprovedBy?.id,
      admApprovedDate: oldAdmStudentPersonalDetails.admapprovedt
        ? new Date(oldAdmStudentPersonalDetails.admapprovedt)
        : null,
      verifyType: oldAdmStudentPersonalDetails.verifytype || undefined,
      verifyRemarks: oldAdmStudentPersonalDetails.verifyremarks || undefined,
    })
    .returning();

  return applicationForm;
}

export async function addAdmGeneralInformation(
  oldStudent: OldStudent,
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
  applicationForm: ApplicationForm,
) {
  let eligibilityCriteria: EligibilityCriteria | null = null;
  if (oldAdmStudentPersonalDetails.eligibilityCriteriaId) {
    eligibilityCriteria = await addEligibilityCriteria(
      oldAdmStudentPersonalDetails.eligibilityCriteriaId,
    );
  }
  let studentCategory: StudentCategory | null = null;
  if (oldAdmStudentPersonalDetails.studentCategoryId) {
    studentCategory = await addStudentCategory(
      oldAdmStudentPersonalDetails.studentCategoryId,
    );
  }

  // let family = await addFamily(oldAdmStudentPersonalDetails, oldStudent); // TO BE ADDED IN Add Student

  let spqtaApprovedBy: User | null = null;
  if (oldAdmStudentPersonalDetails.spqtaapprovedby) {
    const [[oldStaffSpqtaApprovedBy]] = (await mysqlConnection.query(`
            SELECT *
            FROM staffpersonaldetails
            WHERE id = ${oldAdmStudentPersonalDetails.spqtaapprovedby};
        `)) as [OldStaff[], any];

    spqtaApprovedBy =
      (await upsertUser(oldStaffSpqtaApprovedBy, "STAFF")) ?? null;
  }

  // let transportDetails = await addTransportDetails(oldStudent, personalDetails);

  const hashedPassword = await bcrypt.hash(
    oldAdmStudentPersonalDetails.contactNo?.trim() || "default",
    10,
  );
  const values = {
    email: oldAdmStudentPersonalDetails.email || "",
    password: hashedPassword,
    applicationFormId: applicationForm.id!,
    residenceOfKolkata: Boolean(oldAdmStudentPersonalDetails.residentOfBengal),
    legacyPersonalDetailsId: oldAdmStudentPersonalDetails.id,
    clubAId: oldAdmStudentPersonalDetails.clubaid || undefined,
    clubBId: oldAdmStudentPersonalDetails.clubbid || undefined,
    tshirtSize: oldAdmStudentPersonalDetails.tshirtsize || undefined,
    gujaratiClass: oldAdmStudentPersonalDetails.gujraticlass
      ? Number(oldAdmStudentPersonalDetails.gujraticlass)
      : undefined,
    dtls: oldAdmStudentPersonalDetails.dtls || undefined,
    isMinority: Boolean(oldAdmStudentPersonalDetails.isMinority),
    spqtaApprovedBy: spqtaApprovedBy?.id,
    spqtaApprovedDate: oldAdmStudentPersonalDetails.spqtaapproveddt
      ? new Date(oldAdmStudentPersonalDetails.spqtaapproveddt)
          .toISOString()
          .slice(0, 10)
      : undefined,
    separated: Boolean(oldAdmStudentPersonalDetails.separated),
    chkFlats: oldAdmStudentPersonalDetails.chkflats || undefined,
    backDoorFlag: oldAdmStudentPersonalDetails.backdoorflag || undefined,
    eligibilityCriteriaId: eligibilityCriteria?.id,
    studentCategoryId: studentCategory?.id,
  };

  const [admGeneralInformation] = await db
    .insert(admissionGeneralInfoModel)
    .values(values)
    .returning();

  let health = await upsertHealth(
    oldStudent,
    undefined,
    admGeneralInformation.id,
  );

  let accommodation: Accommodation | null = null;
  if (oldStudent && oldStudent.placeofstay) {
    accommodation = await addAccommodation(
      oldStudent.placeofstay,
      oldStudent.placeofstayaddr || "",
      oldStudent.localitytyp || "",
      oldStudent.placeofstaycontactno || "",
      admGeneralInformation.id,
    );
  }

  let emergencyContact: EmergencyContact | null = null;
  if (oldStudent) {
    emergencyContact = await upsertEmergencyContact(
      oldStudent as unknown as EmergencyContact,
      undefined,
      admGeneralInformation.id,
    );
  }

  let personalDetails = await upsertPersonalDetails(
    oldAdmStudentPersonalDetails,
    undefined,
    admGeneralInformation.id,
  );

  return admGeneralInformation;
}

export async function addAdmAcademicInfo(
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
  applicationForm: ApplicationForm,
) {
  const [[oldAcademicDetails]] = (await mysqlConnection.query(`
        SELECT *
        FROM academicdetail
        WHERE parent_id = ${oldAdmStudentPersonalDetails.id};
    `)) as [OldAcademicDetails[], any];

  if (!oldAcademicDetails) {
    console.log(
      "no academic details found for personal-details ID: ",
      oldAdmStudentPersonalDetails.id,
    );
    return undefined;
  }

  const [existingAdmAcademicInfo] = await db
    .select()
    .from(admissionAcademicInfoModel)
    .where(
      and(
        eq(admissionAcademicInfoModel.applicationFormId, applicationForm.id!),
        eq(
          admissionAcademicInfoModel.legacyAcademicDetailsId,
          oldAcademicDetails.id!,
        ),
      ),
    );

  if (existingAdmAcademicInfo) {
    return existingAdmAcademicInfo;
  }

  let board: Board | undefined;
  if (oldAcademicDetails?.boardId) {
    board = await addBoard(oldAcademicDetails.boardId);
  }

  // Ensure we have a board - create fallback if needed
  if (!board) {
    const [existingBoard] = await db
      .select()
      .from(boardModel)
      .where(eq(boardModel.name, "UNKNOWN"));
    if (existingBoard) {
      board = existingBoard;
    } else {
      board = (
        await db.insert(boardModel).values({ name: "UNKNOWN" }).returning()
      )[0];
    }
  }

  // At this point, board is guaranteed to be defined
  const finalBoard = board!;

  // Ensure we have a valid board ID
  if (!finalBoard.id) {
    throw new Error("Board ID is missing after creation/selection");
  }

  let lastSchool: Institution | undefined;
  if (oldAcademicDetails.lastschoolId) {
    lastSchool = await addInstitution(oldAcademicDetails.lastschoolId);
  }

  let previousInstitute: Institution | undefined;
  if (oldAcademicDetails.previnstid) {
    previousInstitute = await addInstitution(oldAcademicDetails.previnstid);
  }

  const [admAcademicInfo] = await db
    .insert(admissionAcademicInfoModel)
    .values({
      legacyAcademicDetailsId: oldAcademicDetails.id,
      applicationFormId: applicationForm.id!,
      boardId: finalBoard.id as number,

      boardResultStatus:
        oldAcademicDetails.boardResultStatus?.trim().toUpperCase() === "PASS"
          ? "PASS"
          : "FAIL", // Required field
      yearOfPassing: oldAcademicDetails.yearofPassing || 0, // Required field

      // Board and result information
      otherBoard: oldAcademicDetails.otherBoardName || undefined,
      percentageOfMarks: oldAcademicDetails.percentageOfMarks || undefined,
      division: oldAcademicDetails.division || undefined,
      rank: oldAcademicDetails.rank
        ? Number(oldAcademicDetails.rank)
        : undefined,
      totalPoints: oldAcademicDetails.totalPoints || undefined,
      aggregate: oldAcademicDetails.aggregate || undefined,

      // Subject and school information
      subjectStudied: oldAcademicDetails.subjectStudied || undefined,
      lastSchoolId: lastSchool?.id,
      lastSchoolName: oldAcademicDetails.lastschoolName || undefined,

      // Registration and exam details
      registrationNumber: oldAcademicDetails.regno || undefined,
      rollNumber: oldAcademicDetails.rollNo || undefined,
      schoolNumber: oldAcademicDetails.schoolno || undefined,
      centerNumber: oldAcademicDetails.centerno || undefined,
      admitCardId: oldAcademicDetails.admintcardid || undefined,
      indexNumber1: oldAcademicDetails.indexno1 || undefined,
      indexNumber2: oldAcademicDetails.indexno2 || undefined,

      // Previous institute information
      previousInstituteId: previousInstitute?.id,
      otherPreviousInstitute: oldAcademicDetails.previnstother || undefined,

      // Additional fields
      studiedUpToClass: undefined, // Not available in old data
      bestOfFour: oldAdmStudentPersonalDetails.bestofFour || undefined, // Not available in old data
      totalScore: oldAdmStudentPersonalDetails.totalscore || undefined, // Not available in old data
      oldBestOfFour: oldAdmStudentPersonalDetails.bo4_old || undefined, // Not available in old data
      oldTotalScore: oldAdmStudentPersonalDetails.totscore_old || undefined, // Not available in old data
      isRegisteredForUGInCU: Boolean(oldAcademicDetails.prevregno), // Default value
      cuRegistrationNumber: oldAcademicDetails.prevregno, // Not available in old data
      previouslyRegisteredProgramCourseId: undefined, // Not available in old data
      otherPreviouslyRegisteredProgramCourse: undefined, // Not available in old data
    })
    .returning();

  return admAcademicInfo;
}

export async function addAdmCourseApps(
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
  applicationForm: ApplicationForm,
) {
  const [oldAdmCourseDetails] = (await mysqlConnection.query(`
        SELECT *
        FROM coursedetails
        WHERE parent_id = ${oldAdmStudentPersonalDetails.id};
    `)) as [OldCourseDetails[], any];

  let transferredAdmCourseDetails: AdmissionCourseDetails | undefined =
    undefined;
  for (let i = 0; i < oldAdmCourseDetails.length; i++) {
    const oldCourseDetail = oldAdmCourseDetails[i];

    const admissionCourseDetails = await processOldCourseDetails(
      oldCourseDetail,
      applicationForm,
    );
    if (admissionCourseDetails?.isTransferred) {
      transferredAdmCourseDetails = admissionCourseDetails;
    }
  }

  return transferredAdmCourseDetails!;
}

export async function processAdmissionApplicationForm(
  oldStudent: OldStudent,
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
): Promise<{
  applicationForm: ApplicationForm;
  oldAcademicDetails: OldAcademicDetails;
  transferredAdmCourseDetails: AdmissionCourseDetails;
}> {
  const [[oldAcademicDetails]] = (await mysqlConnection.query(`
        SELECT *
        FROM academicdetail
        WHERE parent_id = ${oldAdmStudentPersonalDetails.id};
    `)) as [OldAcademicDetails[], any];

  const applicationForm = await addAdmissionApplicationForm(
    oldAdmStudentPersonalDetails,
  );

  await addAdmGeneralInformation(
    oldStudent,
    oldAdmStudentPersonalDetails,
    applicationForm,
  );

  const admAcademicInfo = await addAdmAcademicInfo(
    oldAdmStudentPersonalDetails,
    applicationForm,
  );

  await addAdmAcademSubjects(oldAdmStudentPersonalDetails, admAcademicInfo);

  const transferredAdmCourseDetails = await addAdmCourseApps(
    oldAdmStudentPersonalDetails,
    applicationForm,
  );

  await addAdmAdditionalInfo(oldAdmStudentPersonalDetails, applicationForm);

  return { applicationForm, oldAcademicDetails, transferredAdmCourseDetails };
}

export async function addAdmAcademSubjects(
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
  admAcademicInfo: AdmissionAcademicInfo,
) {
  const [[oldAcademicDetails]] = (await mysqlConnection.query(`
        SELECT *
        FROM academicdetail
        WHERE parent_id = ${oldAdmStudentPersonalDetails.id};
    `)) as [OldAcademicDetails[], any];

  if (!oldAcademicDetails) {
    console.warn(
      `No academic details found for personal-details ID: ${oldAdmStudentPersonalDetails.id}`,
    );
    return { oldAcademicDetails: null, admAcademicSubjects: [] };
  }

  const [admAcademicSubjects] = (await mysqlConnection.query(`
        SELECT *
        FROM subjectdetail
        WHERE parent_id = ${oldAcademicDetails.id};
    `)) as [OldAdmSubjectDetails[], any];

  if (!admAcademicSubjects || admAcademicSubjects.length === 0) {
    console.warn(
      `No academic subjects found for academic details ID: ${oldAcademicDetails.id}`,
    );
    return { oldAcademicDetails, admAcademicSubjects: [] };
  }

  for (let i = 0; i < admAcademicSubjects.length; i++) {
    const oldAdmAcademicSubject = admAcademicSubjects[i];

    // Create Board and subject mapping and use that mapping as fk in student-adm-academic-subject
    let boardSubject = await addBoardSubject(
      oldAdmAcademicSubject.subjectId!,
      oldAcademicDetails.boardId!,
    );

    if (!boardSubject) {
      console.log(
        `No board subject found for subject ID: ${oldAdmAcademicSubject.subjectId}`,
      );

      const [[oldAdmRelevantSubject]] = (await mysqlConnection.query(`
                SELECT * FROM admrelevantpaper WHERE id = ${oldAdmAcademicSubject.subjectId};
            `)) as [OldBoardSubjectName[], any];

      if (!oldAdmRelevantSubject) {
        console.log(
          `No relevant subject found for ID: ${oldAdmAcademicSubject.subjectId}`,
        );
        continue; // Skip this subject if no relevant subject found
      }

      let [foundBoardSubjectName] = await db
        .select()
        .from(boardSubjectNameModel)
        .where(
          ilike(
            boardSubjectNameModel.name,
            oldAdmRelevantSubject.paperName.trim(),
          ),
        );

      if (!foundBoardSubjectName) {
        const [newBoardSubjectName] = await db
          .insert(boardSubjectNameModel)
          .values({
            name: oldAdmRelevantSubject.paperName.trim(),
          })
          .returning();
        foundBoardSubjectName = newBoardSubjectName;
      }

      const foundBoard = await addBoard(oldAcademicDetails.boardId!);
      if (!foundBoard) {
        console.log(`No board found for ID: ${oldAcademicDetails.boardId}`);
        continue; // Skip this subject if no board found
      }

      // Check if board subject already exists with these exact parameters
      const [existingBoardSubject] = await db
        .select()
        .from(boardSubjectModel)
        .where(
          and(
            eq(boardSubjectModel.boardId, foundBoard.id!),
            eq(boardSubjectModel.boardSubjectNameId, foundBoardSubjectName.id!),
            eq(
              boardSubjectModel.passingMarksTheory,
              oldAdmAcademicSubject.theoryPassMarks || 0,
            ),
            eq(
              boardSubjectModel.passingMarksPractical,
              oldAdmAcademicSubject.practicalPassMarks || 0,
            ),
            eq(
              boardSubjectModel.fullMarksTheory,
              oldAdmAcademicSubject.theoryFullMarks || 0,
            ),
            eq(
              boardSubjectModel.fullMarksPractical,
              oldAdmAcademicSubject.practicalFullMarks || 0,
            ),
          ),
        );

      if (existingBoardSubject) {
        boardSubject = existingBoardSubject;
      } else {
        const [newBoardSubject] = await db
          .insert(boardSubjectModel)
          .values({
            boardId: foundBoard.id!,
            boardSubjectNameId: foundBoardSubjectName.id!,
            passingMarksTheory: oldAdmAcademicSubject.theoryPassMarks || 0,
            passingMarksPractical:
              oldAdmAcademicSubject.practicalPassMarks || 0,
            fullMarksTheory: oldAdmAcademicSubject.theoryFullMarks || 0,
            fullMarksPractical: oldAdmAcademicSubject.practicalFullMarks || 0,
          })
          .returning();
        boardSubject = newBoardSubject;
      }
    }

    const [existingSubject] = await db
      .select()
      .from(studentAcademicSubjectModel)
      .where(
        and(
          eq(
            studentAcademicSubjectModel.legacySubjectDetailsId,
            oldAdmAcademicSubject.id,
          ),
          eq(
            studentAcademicSubjectModel.admissionAcademicInfoId,
            admAcademicInfo.id!,
          ),
          eq(studentAcademicSubjectModel.boardSubjectId, boardSubject.id!),
        ),
      );

    if (!existingSubject) {
      // Resolve grade ID from legacy grade ID
      let resolvedGradeId: number | undefined = undefined;
      if (oldAdmAcademicSubject.gradeid) {
        const [existingGrade] = await db
          .select()
          .from(gradeModel)
          .where(eq(gradeModel.legacygradeId, oldAdmAcademicSubject.gradeid));
        resolvedGradeId = existingGrade?.id;
      }

      await db.insert(studentAcademicSubjectModel).values({
        legacySubjectDetailsId: oldAdmAcademicSubject.id,
        admissionAcademicInfoId: admAcademicInfo.id!,
        boardSubjectId: boardSubject.id!,
        theoryMarks: oldAdmAcademicSubject.theoryMarksobtained || 0,
        practicalMarks: oldAdmAcademicSubject.practicalMarksobtained || 0,
        totalMarks: oldAdmAcademicSubject.totalMarks || 0,
        gradeId: resolvedGradeId,
        resultStatus:
          (oldAdmAcademicSubject.status?.toUpperCase() as
            | "PASS"
            | "FAIL"
            | "FAIL IN THEORY"
            | "FAIL IN PRACTICAL") ?? undefined,
      });
    }
  }

  return { oldAcademicDetails, admAcademicSubjects };
}

export async function addAdmAdditionalInfo(
  oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
  applicationForm: ApplicationForm,
) {
  const annualIncome = await categorizeIncome(
    oldAdmStudentPersonalDetails.familyIncome,
  );

  const [existingAdmAdditionalInfo] = await db
    .select()
    .from(admissionAdditionalInfoModel)
    .where(
      eq(admissionAdditionalInfoModel.applicationFormId, applicationForm.id!),
    );

  if (existingAdmAdditionalInfo) {
    await upsertFamily2(
      oldAdmStudentPersonalDetails,
      undefined,
      existingAdmAdditionalInfo.id,
    );
    return existingAdmAdditionalInfo;
  }

  const [newAdmAdditionalInfo] = await db
    .insert(admissionAdditionalInfoModel)
    .values({
      applicationFormId: applicationForm.id!,
      // familyDetailsId: familyDetails?.id as number,

      applyUnderNCCCategory: !!oldAdmStudentPersonalDetails.nccQuota,
      applyUnderSportsCategory: !!oldAdmStudentPersonalDetails.sportsquota,
      familyExStudentName: oldAdmStudentPersonalDetails.famexstdname,
      familyExStudentRelation: oldAdmStudentPersonalDetails.famexstdrelation,

      hasSmartphone: !!oldAdmStudentPersonalDetails.resismartphone,
      hasLaptopOrDesktop: !!oldAdmStudentPersonalDetails.resilaptop,
      hasInternetAccess: !!oldAdmStudentPersonalDetails.resiinternet,
      annualIncomeId: annualIncome?.id || undefined,
    })
    .returning();
  await upsertFamily2(
    oldAdmStudentPersonalDetails,
    undefined,
    newAdmAdditionalInfo.id,
  );
  return newAdmAdditionalInfo;
}

export async function addBoardSubject(
  oldAdmRelevantSubjectId: number,
  oldBoardId: number,
): Promise<BoardSubject | undefined> {
  const [[oldBoard]] = (await mysqlConnection.query(`
        SELECT *
        FROM board
        WHERE id = ${oldBoardId};
    `)) as [OldBoard[], any];

  if (!oldBoard) {
    return undefined;
  }

  const board = await addBoard(oldBoard.id!);

  const [oldBoardSubjectMappingMains] = (await mysqlConnection.query(`
        SELECT *
        FROM boardsubjectmappingmain
        WHERE boardid = ${oldBoardId};
    `)) as [OldBoardSubjectMapping[], any];

  if (
    !oldBoardSubjectMappingMains ||
    oldBoardSubjectMappingMains.length === 0
  ) {
    console.warn(`No boardsubjectmappingmain found for boardId: ${oldBoardId}`);
    return undefined;
  }

  const oldBoardSubjectMappingMain = oldBoardSubjectMappingMains[0];

  const [boardSubjectSubMappings] = (await mysqlConnection.query(`
        SELECT *
        FROM boardsubjectmappingsub
        WHERE
            subjectid = ${oldAdmRelevantSubjectId} 
            AND parent_id = ${oldBoardSubjectMappingMain.id};
    `)) as [OldBoardSubjectMappingSub[], any];

  const boardSubjectSubMapping = boardSubjectSubMappings?.[0];
  if (!boardSubjectSubMapping) {
    console.log(
      `No old-board-subject mapping found for subject ID: ${oldAdmRelevantSubjectId}`,
    );
    return undefined;
  }

  const [oldBoardSubjectNames] = (await mysqlConnection.query(`
        SELECT *
        FROM admrelevantpaper
        WHERE id = ${boardSubjectSubMapping.subjectid};
    `)) as [OldBoardSubjectName[], any];

  const oldBoardSubjectName = oldBoardSubjectNames?.[0];
  if (!oldBoardSubjectName) {
    console.warn(
      `No admrelevantpaper found for id: ${boardSubjectSubMapping.subjectid}`,
    );
    return undefined;
  }

  let [foundBoardSubjectName] = await db
    .select()
    .from(boardSubjectNameModel)
    .where(
      and(
        ilike(boardSubjectNameModel.name, oldBoardSubjectName.paperName.trim()),
        eq(
          boardSubjectNameModel.legacyBoardSubjectNameId,
          oldBoardSubjectName.id!,
        ),
      ),
    );

  if (!foundBoardSubjectName) {
    const [newBoardSubjectName] = await db
      .insert(boardSubjectNameModel)
      .values({
        name: oldBoardSubjectName.paperName.trim(),
        legacyBoardSubjectNameId: oldBoardSubjectName.id!,
      })
      .returning();
    foundBoardSubjectName = newBoardSubjectName;
  }

  const [foundBoardSubject] = await db
    .select()
    .from(boardSubjectModel)
    .where(
      and(
        eq(
          boardSubjectModel.legacyBoardSubjectMappingSubId,
          boardSubjectSubMapping.id,
        ),
        eq(boardSubjectModel.boardId, board?.id!),
        eq(boardSubjectModel.boardSubjectNameId, foundBoardSubjectName.id!),
      ),
    );

  if (foundBoardSubject) {
    return foundBoardSubject;
  }

  const [newBoardSubject] = await db
    .insert(boardSubjectModel)
    .values({
      legacyBoardSubjectMappingSubId: boardSubjectSubMapping.id,
      boardId: board?.id!,
      boardSubjectNameId: foundBoardSubjectName.id!,
      fullMarksTheory: boardSubjectSubMapping.thfull || 0,
      passingMarksTheory: boardSubjectSubMapping.thpass || 0,
      fullMarksPractical: boardSubjectSubMapping.pracfull || 0,
      passingMarksPractical: boardSubjectSubMapping.pracpass || 0,
    })
    .returning();

  return newBoardSubject;
}

export async function processOldStudentApplicationForm(
  oldStudent: OldStudent,
  student: Student,
): Promise<{
  applicationForm: ApplicationForm;
  transferredAdmCourseDetails: AdmissionCourseDetails;
}> {
  // Check if student application form already exists
  const [[oldAdmStudentPersonalDetails]] = (await mysqlConnection.query(`
        SELECT pd.*
        FROM personaldetails pd
        JOIN coursedetails cd ON pd.id = cd.parent_id
        JOIN studentpersonaldetails spd ON spd.admissionid = cd.id
        WHERE spd.id = ${oldStudent.id};
    `)) as [OldAdmStudentPersonalDetail[], any];

  // Check if personaldetails exists
  const [existingAdmGeneralInfo] = await db
    .select()
    .from(admissionGeneralInfoModel)
    .where(
      eq(
        admissionGeneralInfoModel.legacyPersonalDetailsId,
        oldAdmStudentPersonalDetails.id!,
      ),
    );

  if (existingAdmGeneralInfo) {
    const [existingApplicationForm] = await db
      .select()
      .from(applicationFormModel)
      .where(
        eq(applicationFormModel.id, existingAdmGeneralInfo.applicationFormId),
      );

    // Try to fetch the transferred admission course details for this application
    const transferredRows = await db
      .select()
      .from(admissionCourseDetailsModel)
      .where(
        and(
          eq(
            admissionCourseDetailsModel.applicationFormId,
            existingApplicationForm.id,
          ),
          eq(admissionCourseDetailsModel.isTransferred, true),
        ),
      );

    let transferredAdmCourseDetails =
      transferredRows[0] as AdmissionCourseDetails;

    // Fallback: if no transferred row yet, pick the most recent course details for this app and program
    if (!transferredAdmCourseDetails) {
      const fallbackRows = await db
        .select()
        .from(admissionCourseDetailsModel)
        .leftJoin(
          admissionProgramCourseModel,
          eq(
            admissionCourseDetailsModel.admissionProgramCourseId,
            admissionProgramCourseModel.id,
          ),
        )
        .where(
          and(
            eq(
              admissionCourseDetailsModel.applicationFormId,
              existingApplicationForm.id,
            ),
            eq(
              admissionProgramCourseModel.programCourseId,
              student.programCourseId!,
            ),
            eq(admissionCourseDetailsModel.isTransferred, true),
          ),
        )
        .limit(1);
      transferredAdmCourseDetails = fallbackRows[0]?.admission_course_details;
    }

    if (!transferredAdmCourseDetails) {
      throw new Error(
        "Admission course details not found for existing application form",
      );
    }

    return {
      applicationForm: existingApplicationForm,
      transferredAdmCourseDetails,
    };
  }

  // Do the admission application form
  const admApp = await processAdmissionApplicationForm(
    oldStudent,
    oldAdmStudentPersonalDetails,
  );

  if (!admApp) {
    throw new Error("Admission application form not found");
  }

  const { applicationForm, transferredAdmCourseDetails } = admApp;

  console.log(
    "in processStudent(), existingAdmCourseDetails",
    transferredAdmCourseDetails,
  );

  const [{ academic_years: academicYear }] = await db
    .select()
    .from(admissionModel)
    .leftJoin(sessionModel, eq(admissionModel.sessionId, sessionModel.id))
    .leftJoin(
      academicYearModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    .where(eq(admissionModel.id, applicationForm.admissionId as number));

  const [[oldCourseDetailsTransferred]] = (await mysqlConnection.query(`
            SELECT * 
            FROM coursedetails
            WHERE transferred = true and id = ${transferredAdmCourseDetails.legacyCourseDetailsId};
        `)) as [OldCourseDetails[], any];

  console.log(
    "in processStudent(), oldCourseDetailsTransferred",
    oldCourseDetailsTransferred,
  );

  await getSubjectRelatedFields(
    oldCourseDetailsTransferred,
    transferredAdmCourseDetails,
    academicYear!,
    student.id!,
  );

  return { applicationForm, transferredAdmCourseDetails };
}

// export async function addPromotion(
//     studentId: number,
//     applicationForm: ApplicationForm,
//     oldStudentId: number,
//     admissionCourseDetails: AdmissionCourseDetails,
// ) {
//     const [foundAdmission] = await db
//         .select()
//         .from(admissionModel)
//         .where(eq(admissionModel.id, applicationForm.admissionId!));

//     const [[oldHistoricalRecord]] = (await mysqlConnection.query(`
//         SELECT * FROM historicalrecord WHERE parent_id = ${oldStudentId}
//     `)) as [OldHistoricalRecord[], any];

//     const [foundSession] = await db
//         .select()
//         .from(sessionModel)
//         .where(eq(sessionModel.id, foundAdmission?.sessionId!));

//     const foundClass = await addClass(oldHistoricalRecord?.classId!);

//     const [foundAdmissionProgramCourse] = await db
//         .select()
//         .from(admissionProgramCourseModel)
//         .where(
//             eq(
//                 admissionProgramCourseModel.id,
//                 admissionCourseDetails.admissionProgramCourseId,
//             ),
//         );

//     const [foundProgramCourse] = await db
//         .select()
//         .from(programCourseModel)
//         .where(
//             eq(programCourseModel.id, foundAdmissionProgramCourse?.programCourseId!),
//         );

//     const [[oldPromotionStatus]] = (await mysqlConnection.query(`
//         SELECT * FROM promotionstatus WHERE id = ${oldHistoricalRecord?.promotionstatus}
//     `)) as [OldPromotionStatus[], any];

//     let [foundPromotionStatus] = await db
//         .select()
//         .from(promotionStatusModel)
//         .where(
//             eq(promotionStatusModel.legacyPromotionStatusId, oldPromotionStatus?.id!),
//         );

//     if (!foundPromotionStatus) {
//         foundPromotionStatus = (
//             await db
//                 .insert(promotionStatusModel)
//                 .values({
//                     legacyPromotionStatusId: oldPromotionStatus?.id!,
//                     name: oldPromotionStatus?.name!,
//                     type: oldPromotionStatus?.spltype.toUpperCase().trim() as
//                         | "REGULAR"
//                         | "READMISSION"
//                         | "CASUAL",
//                 })
//                 .returning()
//         )[0];
//     }

//     let foundBoardResultStatus: BoardResultStatus | undefined;
//     if (oldHistoricalRecord?.boardresultid) {
//         foundBoardResultStatus = (
//             await db
//                 .select()
//                 .from(boardResultStatusModel)
//                 .where(
//                     eq(
//                         boardResultStatusModel.legacyBoardResultStatusId,
//                         oldHistoricalRecord?.boardresultid!,
//                     ),
//                 )
//         )[0];

//         if (!foundBoardResultStatus) {
//             const [[oldBoardResultStatus]] = (await mysqlConnection.query(`
//                 SELECT * FROM boardresultstatus WHERE id = ${oldHistoricalRecord?.boardresultid}
//             `)) as [OldBoardResultStatus[], any];
//             foundBoardResultStatus = (
//                 await db
//                     .insert(boardResultStatusModel)
//                     .values({
//                         legacyBoardResultStatusId: oldBoardResultStatus?.id!,
//                         name: oldBoardResultStatus?.name!,
//                         spclType: oldBoardResultStatus?.spcltype,
//                     })
//                     .returning()
//             )[0];
//         }
//     }

//     const foundSection = await addSection(oldHistoricalRecord?.sectionId!);

//     await db.insert(promotionModel).values({
//         studentId: studentId,
//         sectionId: foundSection?.id,
//         legacyHistoricalRecordId: oldHistoricalRecord?.id!,
//         programCourseId: foundProgramCourse?.id!,
//         sessionId: foundSession?.id!,
//         shiftId: admissionCourseDetails.shiftId!,
//         classId: foundClass?.id!,
//         classRollNumber: String(oldHistoricalRecord?.rollNo!),
//         dateOfJoining: oldHistoricalRecord?.dateofJoining!,
//         promotionStatusId: foundPromotionStatus?.id!,
//         boardResultStatusId: foundBoardResultStatus?.id!,
//         startDate: oldHistoricalRecord?.startDate,
//         endDate: oldHistoricalRecord?.endDate,
//         remarks: oldHistoricalRecord?.specialisation,
//         rollNumber: oldHistoricalRecord?.univrollno,
//         rollNumberSI: oldHistoricalRecord?.univrollnosi,
//         examNumber: oldHistoricalRecord?.exmno,
//         examSerialNumber: oldHistoricalRecord?.exmsrl,
//     } as PromotionInsertSchema);
// }

export async function addSection(
  oldSectionId: number,
): Promise<Section | undefined> {
  const [rows] = (await mysqlConnection.query(
    `SELECT * FROM section WHERE id = ${oldSectionId}`,
  )) as [OldSection[], any];

  const [oldSection] = rows;

  if (!oldSection) {
    console.error("Section not found", oldSectionId);
    return undefined;
  }

  const [existingSection] = await db
    .select()
    .from(sectionModel)
    .where(
      and(
        eq(sectionModel.name, oldSection.sectionName.trim()),
        eq(sectionModel.legacySectionId, oldSection.id!),
      ),
    );

  let newSection: Section | undefined;
  if (existingSection) {
    return existingSection;
  } else {
    newSection = (
      await db
        .insert(sectionModel)
        .values({
          name: oldSection.sectionName.trim(),
          legacySectionId: oldSection.id!,
        })
        .returning()
    )[0];
  }

  return newSection;
}

export async function addInstitution(
  oldInstitutionId: number,
): Promise<Institution | undefined> {
  const [rows] = (await mysqlConnection.query(
    `SELECT * FROM lastinstitute WHERE id = ${oldInstitutionId}`,
  )) as [OldInstitution[], any];

  const [oldInstitution] = rows;

  if (!oldInstitution) {
    return undefined;
  }

  const [[oldDegree]] = (await mysqlConnection.query(
    `SELECT * FROM degree WHERE id = ${oldInstitution.degreeid}`,
  )) as [OldDegree[], any];

  let degree: Degree | undefined;
  if (oldDegree) {
    const [existingDegree] = await db
      .select()
      .from(degreeModel)
      .where(ilike(degreeModel.name, oldDegree.degreeName.trim()));
    if (existingDegree) {
      degree = existingDegree;
    } else {
      const [newDegree] = await db
        .insert(degreeModel)
        .values({ name: oldDegree.degreeName.trim() })
        .returning();
      degree = newDegree;
    }
  }

  const [existingInstitution] = await db
    .select()
    .from(institutionModel)
    .where(ilike(institutionModel.name, oldInstitution.name.trim()));
  if (existingInstitution) {
    return existingInstitution;
  }

  // Ensure a non-null degreeId (fallback to an 'UNKNOWN' degree if not resolvable)
  let degreeIdToUse = degree?.id as number | undefined;
  if (!degreeIdToUse) {
    const [existingUnknown] = await db
      .select()
      .from(degreeModel)
      .where(eq(degreeModel.name, ""));
    if (existingUnknown) {
      degreeIdToUse = existingUnknown.id as number;
    } else {
      const [createdUnknown] = await db
        .insert(degreeModel)
        .values({ name: "" })
        .returning();
      degreeIdToUse = createdUnknown.id as number;
    }
  }

  const [newInstitution] = await db
    .insert(institutionModel)
    .values({
      name: oldInstitution.name.trim(),
      legacyInstitutionId: oldInstitution.id,
      degreeId: degreeIdToUse,
    })
    .returning();

  return newInstitution;
}

// async function addLanguageMediumById(
//     oldLanguageMediumId: number,
// ): Promise<LanguageMedium | null> {
//     const [rows] = (await mysqlConnection.query(
//         `SELECT * FROM languagemedium WHERE id = ${oldLanguageMediumId}`,
//     )) as [OldLanguageMedium[], any];

//     const [oldLanguageMedium] = rows;

//     if (!oldLanguageMedium) {
//         return null;
//     }

//     const [existingLanguage] = await db
//         .select()
//         .from(languageMediumModel)
//         .where(eq(languageMediumModel.name, oldLanguageMedium.name.trim()));
//     if (existingLanguage) {
//         return existingLanguage;
//     }

//     const [newLanguage] = await db
//         .insert(languageMediumModel)
//         .values({
//             name: oldLanguageMedium.name.trim(),
//             legacyLanguageMediumId: oldLanguageMediumId,
//         })
//         .returning();

//     return newLanguage;
// }

export async function addBoard(oldBoardId: number): Promise<Board | undefined> {
  const [rows] = (await mysqlConnection.query(
    `SELECT * FROM board WHERE id = ${oldBoardId}`,
  )) as [OldBoard[], any];

  const [oldBoard] = rows;

  if (!oldBoard) {
    return undefined;
  }

  const [existingBoard] = await db
    .select()
    .from(boardModel)
    .where(
      and(
        ilike(boardModel.name, oldBoard.boardName.trim()),
        eq(boardModel.legacyBoardId, oldBoard.id!),
      ),
    );

  if (existingBoard) {
    return existingBoard;
  }

  let degree: Degree | undefined;
  const [degreeRows] = (await mysqlConnection.query(
    `SELECT * FROM degree WHERE id = ${oldBoard.degreeid}`,
  )) as [OldDegree[], any];
  const [oldDegree] = degreeRows;

  if (oldDegree) {
    const [existingDegree] = await db
      .select()
      .from(degreeModel)
      .where(eq(degreeModel.name, oldDegree.degreeName.trim()));

    if (existingDegree) {
      degree = existingDegree;
    } else {
      const [newDegree] = await db
        .insert(degreeModel)
        .values({
          name: oldDegree.degreeName.trim(),
          legacyDegreeId: oldDegree.id,
        })
        .returning();
      degree = newDegree;
    }
  }

  const [newBoard] = await db
    .insert(boardModel)
    .values({
      legacyBoardId: oldBoard.id,
      name: oldBoard.boardName.trim(),
      degreeId: degree ? degree.id : undefined,
      passingMarks: oldBoard.passmrks ? Number(oldBoard.passmrks) : undefined,
      code: oldBoard.code && oldBoard.code !== "" ? oldBoard.code : undefined,
    })
    .returning();

  return newBoard;
}

// export async function addUser(
//     oldData: OldAdmStudentPersonalDetail | OldStaff,
//     type: (typeof userTypeEnum.enumValues)[number],
//     uid?: string,
// ) {
//     if (!oldData) {
//         return undefined;
//     }

//     if (type === "STUDENT" && (!uid || uid.trim() === "")) {
//         throw new Error("UID is required for student");
//     }

//     // console.log("oldData in addUser() ----->", oldData);
//     if (type !== "STAFF" && type !== "STUDENT") {
//         throw new Error("Invalid old details type");
//     }

//     // Fetch personal details based on type
//     // let personalDetails = await addPersonalDetails(oldData);
//     let phone: string | undefined = oldData.contactNo?.trim();
//     let whatsappNumber: string | undefined = oldData.contactNo?.trim();

//     const cleanString = (value: unknown): string | undefined => {
//         if (typeof value === "string") {
//             return value.replace(/[\s\-\/]/g, "").trim();
//         }
//         return undefined;
//     };

//     // const email = `${cleanString(codeNumber)}@thebges.edu.in`;
//     const hashedPassword = await bcrypt.hash("default", 10);

//     // Check if user already exists by legacyId OR email
//     let existingUser;
//     const email =
//         type === "STUDENT"
//             ? `${cleanString(uid)}@thebges.edu.in`
//             : oldData.email?.trim();
//     if (email) {
//         // Check by both legacyId and email
//         [existingUser] = await db
//             .select()
//             .from(userModel)
//             .where(
//                 or(eq(userModel.legacyId, oldData.id!), eq(userModel.email, email)),
//             );
//     } else {
//         // Check only by legacyId
//         [existingUser] = await db
//             .select()
//             .from(userModel)
//             .where(eq(userModel.legacyId, oldData.id!));
//     }

//     if (existingUser) {
//         console.log(
//             `User with legacy ID ${oldData.id} or email ${oldData?.email} already exists, skipping creation`,
//         );
//         return existingUser;
//     }

//     // Create the new user
//     let newUser: User | undefined;
//     let nameToUse = "";
//     if (type === "STUDENT") {
//         nameToUse = [
//             (oldData as OldAdmStudentPersonalDetail).firstName,
//             (oldData as OldAdmStudentPersonalDetail).middleName,
//             (oldData as OldAdmStudentPersonalDetail).lastName,
//         ]
//             .filter(Boolean)
//             .join(" ")
//             .trim();
//     } else if (type === "STAFF") {
//         nameToUse = [(oldData as OldStaff).name].filter(Boolean).join(" ").trim();
//     }
//     try {
//         [newUser] = await db
//             .insert(userModel)
//             .values({
//                 name: nameToUse,
//                 legacyId: oldData.id!,
//                 email: email ?? "",
//                 password: hashedPassword,
//                 phone: phone,
//                 type,
//                 whatsappNumber: whatsappNumber,
//             })
//             .returning();
//     } catch (error: any) {
//         // If there's a duplicate key error, try to find the existing user
//         throw error;
//     }

//     if (!newUser) {
//         throw new Error("Failed to create or find user");
//     }

//     if (type === "STAFF") {
//         if (oldData.id) {
//             await addStaff(oldData.id, newUser);
//             await db
//                 .update(userModel)
//                 .set({
//                     isActive: !!(oldData as OldStaff).active,
//                 })
//                 .where(eq(userModel.id, newUser.id as number));
//         }
//     }

//     return newUser;
// }

// export async function addStaff(oldStaffId: number, user: User) {
//     const [existingStaff] = await db
//         .select()
//         .from(staffModel)
//         .where(eq(staffModel.userId, user.id as number));
//     if (existingStaff) {
//         return existingStaff;
//     }

//     const [[oldStaff]] = (await mysqlConnection.query(`
//         SELECT *
//         FROM staffpersonaldetails
//         WHERE id = ${oldStaffId}
//         `)) as [OldStaff[], any];

//     if (!oldStaff) {
//         return null;
//     }

//     const shift = await addShift(oldStaff.empShiftId);

//     const personalDetails = await addPersonalDetails(oldStaff);

//     const familyDetails = await addFamily(oldStaff);

//     const studentCategory = await addStudentCategory(oldStaff.studentCategoryId);

//     const health = await addHealth(oldStaff);

//     const emergencyContact = await addEmergencyContact({
//         personName: oldStaff.emergencyname ?? undefined,
//         havingRelationAs: oldStaff.emergencyrelationship ?? undefined,
//         email: undefined,
//         phone: oldStaff.emergencytelmobile ?? undefined,
//         officePhone: oldStaff.emergencytellandno ?? undefined,
//         residentialPhone: undefined,
//     } as EmergencyContact);

//     // Previous employer address if present
//     let previousEmployeeAddressId: number | undefined = undefined;
//     if (oldStaff.privempaddrs) {
//         const [addr] = await db
//             .insert(addressModel)
//             .values({
//                 addressLine: oldStaff.privempaddrs.trim(),
//                 localityType: null,
//             } as any)
//             .returning();
//         previousEmployeeAddressId = addr.id as number;
//     }

//     const bank = await addBank(oldStaff.bankid);
//     let board: Board | undefined = undefined;
//     if (oldStaff.board) {
//         const [existingBoard] = await db
//             .select()
//             .from(boardModel)
//             .where(eq(boardModel.name, oldStaff.board.trim()));
//         if (!existingBoard) {
//             const [newBoard] = await db
//                 .insert(boardModel)
//                 .values({
//                     name: oldStaff.board.trim(),
//                 })
//                 .returning();
//             board = newBoard;
//         } else {
//             board = existingBoard;
//         }
//     }

//     const [newStaff] = await db
//         .insert(staffModel)
//         .values({
//             userId: user.id as number,
//             boardId: board?.id ?? undefined,
//             attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
//             uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
//             codeNumber: oldStaff.codeNumber ?? undefined,
//             shiftId: shift?.id ?? undefined,
//             gratuityNumber: oldStaff.gratuityno ?? undefined,
//             personalDetailsId: personalDetails?.id ?? undefined,
//             familyDetailsId: familyDetails?.id ?? undefined,
//             studentCategoryId: studentCategory?.id ?? undefined,
//             healthId: health?.id ?? undefined,
//             emergencyContactId: emergencyContact?.id ?? undefined,
//             computerOperationKnown: !!oldStaff.computeroperationknown,
//             bankBranchId: undefined,
//             // Optional academic links not resolvable from legacy staff payload
//             bankAccountNumber: oldStaff.bankAccNo ?? undefined,
//             banlIfscCode: oldStaff.bankifsccode ?? undefined,
//             bankAccountType: oldStaff.bankacctype
//                 ? (((t) =>
//                     t === "SAVINGS" ||
//                         t === "CURRENT" ||
//                         t === "FIXED_DEPOSIT" ||
//                         t === "RECURRING_DEPOSIT" ||
//                         t === "OTHER"
//                         ? t
//                         : "OTHER")(String(oldStaff.bankacctype).trim()) as any)
//                 : undefined,
//             providentFundAccountNumber: oldStaff.providentFundAccNo ?? undefined,
//             panNumber: oldStaff.panNo ?? undefined,
//             esiNumber: oldStaff.esiNo ?? undefined,
//             impNumber: oldStaff.impNo ?? undefined,
//             clinicAddress: oldStaff.clinicAddress ?? undefined,
//             hasPfNomination: !!oldStaff.pfnomination,
//             childrens: oldStaff.childrens ?? undefined,
//             majorChildName: oldStaff.majorChildName ?? undefined,
//             majorChildPhone: oldStaff.majorChildContactNo ?? undefined,
//             previousEmployeeName: oldStaff.privempnm ?? undefined,
//             previousEmployeePhone: undefined,
//             previousEmployeeAddressId: previousEmployeeAddressId,
//             gratuityNominationDate: oldStaff.gratuitynominationdt
//                 ? new Date(oldStaff.gratuitynominationdt as any)
//                 : undefined,
//             univAccountNumber: oldStaff.univAccNo ?? undefined,
//             dateOfConfirmation: oldStaff.dateofconfirmation
//                 ? new Date(oldStaff.dateofconfirmation)
//                 : undefined,
//             dateOfProbation: oldStaff.dateofprobation
//                 ? new Date(oldStaff.dateofprobation)
//                 : undefined,
//         })
//         .returning();

//     let name = oldStaff.name ?? "";
//     if (personalDetails?.middleName) {
//         name += `${personalDetails?.middleName}`;
//     }
//     if (personalDetails?.lastName) {
//         name += ` ${personalDetails?.lastName}`;
//     }

//     await db
//         .update(userModel)
//         .set({
//             name,
//         })
//         .where(eq(userModel.id, user.id as number));

//     return newStaff;
// }

// export async function addStudent(
//     oldStudent: OldStudent,
//     oldAdmStudentPersonalDetails: OldAdmStudentPersonalDetail,
//     oldOldCourseDetails: OldCourseDetails,
//     user: User,
//     programCourse: ProgramCourse,
//     applicationForm: ApplicationForm,
//     admCourseDetails: AdmissionCourseDetails,
// ) {
//     // Check for existing student by userId OR legacyStudentId to prevent duplicates
//     const [existingStudent] = await db
//         .select()
//         .from(studentModel)
//         .where(
//             or(
//                 eq(studentModel.userId, user.id as number),
//                 eq(studentModel.legacyStudentId, oldStudent.id as number),
//             ),
//         );
//     if (existingStudent) {
//         console.log(
//             `Student already exists with legacy ID: ${oldStudent.id}, skipping creation`,
//         );
//         return existingStudent;
//     }

//     let level: "UNDER_GRADUATE" | "POST_GRADUATE" | undefined = "UNDER_GRADUATE";
//     if (
//         oldAdmStudentPersonalDetails.uid?.startsWith("11") ||
//         oldAdmStudentPersonalDetails.uid?.startsWith("14")
//     ) {
//         level = "POST_GRADUATE";
//     } else if (!oldAdmStudentPersonalDetails.uid?.startsWith("B")) {
//         level = "UNDER_GRADUATE";
//     }

//     // Determine the active and alumni status based on oldStudent data
//     // let active: boolean | undefined = !!oldAdmStudentPersonalDetails.active;
//     // let alumni: boolean | undefined = !!oldAdmStudentPersonalDetails.alumni;

//     // if (oldStudent.leavingdate) {
//     //     active = false; // If leaving date is present, student has left
//     //     alumni = true;  // Mark as alumni
//     // } else if (!oldStudent.alumni && !oldStudent.active) {
//     //     active = false; // Dropped off
//     // } else if (oldStudent.alumni && !oldStudent.active) {
//     //     active = false; // Fully graduated and left
//     // } else if (!oldStudent.alumni && oldStudent.active) {
//     //     active = true; // Regular student
//     // } else if (oldStudent.alumni && oldStudent.active) {
//     //     active = true; // Graduated but has supplementary papers left
//     // }

//     const [newStudent] = await db
//         .insert(studentModel)
//         .values({
//             userId: user.id as number,
//             uid: oldStudent.codeNumber
//                 ? String(oldStudent.codeNumber)
//                 : oldStudent.oldcodeNumber
//                     ? String(oldStudent.oldcodeNumber)
//                     : "",
//             programCourseId: programCourse.id as number,
//             legacyStudentId: oldStudent.id as number,
//             rfidNumber: oldStudent.rfidno ? String(oldStudent.rfidno) : undefined,
//             registrationNumber: oldStudent.univregno
//                 ? String(oldStudent.univregno)
//                 : undefined,
//             rollNumber: oldStudent.univlstexmrollno
//                 ? String(oldStudent.univlstexmrollno)
//                 : undefined,
//             cuFormNumber: oldStudent.cuformno
//                 ? String(oldStudent.cuformno)
//                 : undefined,
//             classRollNumber: oldStudent.rollNumber
//                 ? String(oldStudent.rollNumber)
//                 : undefined,
//             apaarId: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
//             abcId: oldStudent.abcid ? String(oldStudent.abcid) : undefined,
//             apprid: oldStudent.apprid ? String(oldStudent.apprid) : undefined,
//             checkRepeat: !!oldStudent.chkrepeat,
//             shiftId: admCourseDetails.shiftId,
//             applicationId: applicationForm.id as number,
//             community:
//                 oldStudent.communityid === 0 || oldStudent.communityid === null
//                     ? null
//                     : oldStudent.communityid === 1
//                         ? "GUJARATI"
//                         : "NON-GUJARATI",
//             handicapped: !!oldStudent.handicapped,
//             lastPassedYear: oldStudent.lspassedyr ?? undefined,
//             notes: oldStudent.notes ?? undefined,
//             active: !!oldStudent.active,
//             alumni: !!oldStudent.alumni,

//             leavingDate: oldStudent.leavingdate
//                 ? new Date(oldStudent.leavingdate)
//                 : undefined,
//             leavingReason: oldStudent.leavingreason ?? undefined,
//         })
//         .returning();

//     await db
//         .update(userModel)
//         .set({
//             name: `${oldStudent.name}`,
//         })
//         .where(eq(userModel.id, user.id as number));

//     return newStudent;
// }

export async function addAccommodation(
  placeOfStay: string,
  placeOfStayAddr: string,
  localityType: string,
  placeOfStayContactNo: string,
  admissionGeneralInfoId: number,
) {
  switch (placeOfStay) {
    case "Own":
      placeOfStay = "OWN";
      break;
    case "Hostel":
      placeOfStay = "HOSTEL";
      break;
    case "Relatives":
      placeOfStay = "RELATIVES";
      break;
    case "Family Friends":
      placeOfStay = "FAMILY_FRIENDS";
      break;
    case "Paying Guest":
      placeOfStay = "PAYING_GUEST";
      break;
    default:
      placeOfStay = "";
  }

  // const address = await addAddress({ cityId: city.id, districtId: district.id, stateId: stateId, countryId: countryId, otherCity: otherCity, otherDistrict: otherDistrict, otherState: otherState, otherCountry: otherCountry, pincode: pincode, landmark: landmark, postofficeId: postofficeId, addressLine: placeOfStayAddr?.trim(), localityType: localityType === "URBAN" ? "URBAN" : (localityType === "RURAL" ? "RURAL" : null), phone: placeOfStayContactNo?.trim(), otherPostoffice: otherPostoffice, otherPoliceStation: otherPoliceStation, policeStationId: policeStationId });

  const [newAccommodation] = await db
    .insert(accommodationModel)
    .values({
      placeOfStay: placeOfStay as
        | "OWN"
        | "HOSTEL"
        | "FAMILY_FRIENDS"
        | "PAYING_GUEST"
        | "RELATIVES",
      // addressId: address.id
      admissionGeneralInfoId,
    })
    .returning();

  return newAccommodation;
}

export async function addOccupation(name: string, legacyOccupationId: number) {
  const [existingOccupation] = await db
    .select()
    .from(occupationModel)
    .where(ilike(occupationModel.name, name.trim()));
  if (existingOccupation) {
    return existingOccupation;
  }
  const [newOccupation] = await db
    .insert(occupationModel)
    .values({
      name: name.trim(),
      legacyOccupationId: legacyOccupationId,
    })
    .returning();

  return newOccupation;
}

export async function addBloodGroup(type: string, legacyBloodGroupId?: number) {
  const [existingBloodGroup] = await db
    .select()
    .from(bloodGroupModel)
    .where(ilike(bloodGroupModel.type, type.trim()));
  if (existingBloodGroup) {
    return existingBloodGroup;
  }
  const [newBloodGroup] = await db
    .insert(bloodGroupModel)
    .values({ legacyBloodGroupId: legacyBloodGroupId, type: type.trim() })
    .returning();

  return newBloodGroup;
}

export async function addNationality(
  name: string,
  code: number | undefined | null,
  legacyNationalityId?: number,
) {
  const [existingNationality] = await db
    .select()
    .from(nationalityModel)
    .where(ilike(nationalityModel.name, name.trim()));
  if (existingNationality) {
    return existingNationality;
  }
  const [newNationality] = await db
    .insert(nationalityModel)
    .values({
      legacyNationalityId: legacyNationalityId,
      name: name.trim(),
      code,
    })
    .returning();

  return newNationality;
}

export async function addCategory(
  name: string,
  code: string,
  documentRequired: boolean | undefined,
  legacyCategoryId: number,
) {
  // Check if category exists by name OR code
  const [existingCategory] = await db
    .select()
    .from(categoryModel)
    .where(
      or(
        ilike(categoryModel.name, name.trim()),
        ilike(categoryModel.code, code),
      ),
    );
  if (existingCategory) {
    return existingCategory;
  }
  const [newCategory] = await db
    .insert(categoryModel)
    .values({
      legacyCategoryId: legacyCategoryId,
      name: name.trim(),
      code,
      documentRequired,
    })
    .returning();

  return newCategory;
}

export async function addReligion(name: string, legacyReligionId: number) {
  const [existingReligion] = await db
    .select()
    .from(religionModel)
    .where(ilike(religionModel.name, name.trim()));
  if (existingReligion) {
    return existingReligion;
  }
  const [newReligion] = await db
    .insert(religionModel)
    .values({ legacyReligionId: legacyReligionId, name: name.trim() })
    .returning();

  return newReligion;
}

export async function addLanguageMedium(
  name: string,
  legacyLanguageMediumId: number,
) {
  const [existingLanguage] = await db
    .select()
    .from(languageMediumModel)
    .where(ilike(languageMediumModel.name, name.trim()));
  if (existingLanguage) {
    return existingLanguage;
  }
  const [newLanguage] = await db
    .insert(languageMediumModel)
    .values({
      legacyLanguageMediumId: legacyLanguageMediumId,
      name: name.trim(),
    })
    .returning();

  return newLanguage;
}

export async function addSpecialization(
  name: string,
  db: DbType,
  legacySpecializationId?: number,
) {
  const [existingSpecialization] = await db
    .select()
    .from(specializationModel)
    .where(ilike(specializationModel.name, name.trim()));
  if (existingSpecialization) {
    return existingSpecialization;
  }
  const [newSpecialization] = await db
    .insert(specializationModel)
    .values({
      legacySpecializationId: legacySpecializationId,
      name: name.trim(),
    })
    .returning();

  return newSpecialization;
}

export async function loadAllCountry() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM countrymaintab;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [countries] = (await mysqlConnection.query(`
            SELECT * FROM countrymaintab LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldCountry[], any];

    for (const country of countries) {
      await addCountry(country);
      console.log("country", country);
    }
  }
}

export async function addCountry(oldCountry: OldCountry) {
  console.log("oldCountry:", oldCountry);
  const [existingCountry] = await db
    .select()
    .from(countryModel)
    .where(
      and(
        ilike(countryModel.name, oldCountry.countryName.trim()),
        eq(countryModel.legacyCountryId, oldCountry.id),
      ),
    );
  if (existingCountry) {
    return existingCountry;
  }
  const [newCountry] = await db
    .insert(countryModel)
    .values({
      legacyCountryId: oldCountry.id,
      name: oldCountry.countryName.trim(),
    })
    .returning();

  return newCountry;
}

export async function addStateByCityMaintabOrLegacyStateId(
  legacyCityMainTabId?: number,
  legacyStateId?: number,
) {
  if (!legacyCityMainTabId && !legacyStateId) {
    return null;
  }

  const whereConditionForOldCityMainTab = legacyCityMainTabId
    ? `WHERE id = ${legacyCityMainTabId}`
    : `WHERE stateId = ${legacyStateId}`;
  const [[oldCityMaintab]] = (await mysqlConnection.query(`
        SELECT * 
        FROM citymaintab
        ${whereConditionForOldCityMainTab};
    `)) as [OldCityMaintab[], any];

  if (!oldCityMaintab) {
    return null;
  }

  const [[oldState]] = (await mysqlConnection.query(`
        SELECT * 
        FROM countrysubtab
        WHERE id = ${oldCityMaintab.stateId};
    `)) as [OldCountrySubTab[], any];

  const [[oldCountry]] = (await mysqlConnection.query(`
        SELECT * 
        FROM countrymaintab
        WHERE id = ${oldCityMaintab.countryId};
    `)) as [OldCountry[], any];

  if (!oldState || !oldCountry) {
    return null;
  }

  const country = await addCountry(oldCountry);
  if (!country) {
    return null;
  }

  // Check if state exists
  const [existingState] = await db
    .select()
    .from(stateModel)
    .where(
      and(
        ilike(stateModel.name, oldState.stateName.trim()),
        eq(stateModel.countryId, country.id),
        eq(stateModel.legacyStateId, oldState.id),
      ),
    );
  if (existingState) {
    return existingState;
  }

  const [newState] = await db
    .insert(stateModel)
    .values({
      countryId: country.id,
      legacyStateId: oldState.id,
      name: oldState.stateName.trim(),
    })
    .returning();

  return newState;
}

export async function loadAllState() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM countrysubtab;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [states] = (await mysqlConnection.query(`
            SELECT * FROM countrysubtab LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldCountrySubTab[], any];

    for (const state of states) {
      await addStateByName(state.stateName);
      console.log("state", state);
    }
  }
}

export async function addStateByName(name: string) {
  const [[oldState]] = (await mysqlConnection.query(
    `
        SELECT * 
        FROM countrysubtab
        WHERE stateName = ?;
    `,
    [name],
  )) as [OldCountrySubTab[], any];

  if (!oldState) {
    console.log("oldState not found", name);
    return null;
  }

  const [[oldCountry]] = (await mysqlConnection.query(
    `
        SELECT * 
        FROM countrymaintab
        WHERE id = ?;
    `,
    [oldState.parent_id],
  )) as [OldCountry[], any];

  const country = await addCountry(oldCountry);
  if (!country) {
    console.log("country not found", oldCountry);
    return null;
  }
  const [existingState] = await db
    .select()
    .from(stateModel)
    .where(
      and(
        ilike(stateModel.name, oldState.stateName.trim()),
        eq(stateModel.countryId, country.id),
      ),
    );

  if (existingState) {
    return existingState;
  }

  const [newState] = await db
    .insert(stateModel)
    .values({
      countryId: country.id,
      name: oldState.stateName.trim(),
      legacyStateId: oldState.id,
    })
    .returning();

  return newState;
}

export async function loadAllPostOffice() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM statepostoffice;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [postOffices] = (await mysqlConnection.query(`
            SELECT * FROM statepostoffice LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldPostOffice[], any];

    for (const postOffice of postOffices) {
      const newPostOffice = await addPostOffice(postOffice.id);
      console.log("oldPostOffice", postOffice);
      console.log("newPostOffice", newPostOffice);
    }
  }
}

export async function loadAllPoliceStation() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM statepolicestation;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [policeStations] = (await mysqlConnection.query(`
            SELECT * FROM statepolicestation LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldPoliceStation[], any];

    for (const policeStation of policeStations) {
      const newPoliceStation = await addPoliceStation(policeStation.id);
      console.log("oliceStation", newPoliceStation);
    }
  }
}

export async function addPostOffice(oldPostOfficeId: number) {
  const [[oldPostOffice]] = (await mysqlConnection.query(`
        SELECT * 
        FROM statepostoffice
        WHERE id = ${oldPostOfficeId};
    `)) as [OldPostOffice[], any];

  if (!oldPostOffice) {
    console.log("oldPostOffice not found", oldPostOfficeId);
    return null;
  }

  const [existingPostOffice] = await db
    .select()
    .from(postOfficeModel)
    .where(
      and(
        ilike(postOfficeModel.name, oldPostOffice.postoffice.trim()),
        eq(postOfficeModel.legacyPostOfficeId, oldPostOffice.id),
      ),
    );
  if (existingPostOffice) {
    return existingPostOffice;
  }

  const state = await addStateByName(oldPostOffice.state);
  if (!state) {
    console.log("state not found", oldPostOffice.state);
    return null;
  }

  const [newPostOffice] = await db
    .insert(postOfficeModel)
    .values({
      legacyPostOfficeId: oldPostOffice.id,
      name: oldPostOffice.postoffice.trim(),
      stateId: state.id,
    })
    .returning();
  return newPostOffice;
}

export async function addPoliceStation(oldPoliceStationId: number) {
  const [[oldPoliceStation]] = (await mysqlConnection.query(`
        SELECT * 
        FROM statepolicestation
        WHERE id = ${oldPoliceStationId};
    `)) as [OldPoliceStation[], any];

  if (!oldPoliceStation) {
    console.log("oldPoliceStation not found", oldPoliceStationId);
    return null;
  }

  const state = await addStateByName(oldPoliceStation.state);
  if (!state) {
    console.log("state not found", oldPoliceStation.state);
    return null;
  }

  const [existingPoliceStation] = await db
    .select()
    .from(policeStationModel)
    .where(
      and(
        ilike(policeStationModel.name, oldPoliceStation.policestation.trim()),
        eq(policeStationModel.stateId, state.id),
        eq(policeStationModel.legacyPoliceStationId, oldPoliceStation.id),
      ),
    );
  if (existingPoliceStation) {
    return existingPoliceStation;
  }

  const [newPoliceStation] = await db
    .insert(policeStationModel)
    .values({
      legacyPoliceStationId: oldPoliceStation.id,
      name: oldPoliceStation.policestation.trim(),
      stateId: state.id,
    })
    .returning();

  return newPoliceStation;
}

export async function loadAllCity() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM citysub;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [cities] = (await mysqlConnection.query(`
            SELECT * FROM citysub LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldCitySubtab[], any];

    for (const city of cities) {
      await addCity(city.id);
      console.log("city", city);
    }
  }
}

export async function addCity(oldCityId: number) {
  console.log("oldCityId in addCity() ----->", oldCityId);
  if (isNaN(oldCityId)) {
    return null;
  }
  const [[oldCitySubtab]] = (await mysqlConnection.query(`
        SELECT * 
        FROM citysub
        WHERE id = ${oldCityId};
    `)) as [OldCitySubtab[], any];

  if (!oldCitySubtab) {
    return null;
  }

  const state = await addStateByCityMaintabOrLegacyStateId(
    oldCitySubtab.parent_id,
  );

  if (!state) {
    return null;
  }

  const normalizedCityName = oldCitySubtab.cityname.trim();
  const [existingCity] = await db
    .select({ id: cityModel.id })
    .from(cityModel)
    .where(
      and(
        eq(cityModel.stateId, state.id),
        ilike(cityModel.name, normalizedCityName),
        eq(cityModel.legacyCityId, oldCityId),
      ),
    );
  if (existingCity) {
    return existingCity;
  }

  const [newCity] = await db
    .insert(cityModel)
    .values({
      stateId: state.id,
      legacyCityId: oldCityId,
      name: normalizedCityName,
    })
    .returning();
  return newCity;
}

export async function loadAllDistrict() {
  const [[{ totalRows }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as totalRows FROM district;
    `)) as [{ totalRows: number }[], any];

  const totalPages = Math.ceil(totalRows / BATCH_SIZE);

  for (let i = 0; i < totalPages; i++) {
    const [districts] = (await mysqlConnection.query(`
            SELECT * FROM district LIMIT ${BATCH_SIZE} OFFSET ${i * 100};
        `)) as [OldDistrict[], any];
    for (const district of districts) {
      await addDistrict(district.id);
      console.log("district", district);
    }
  }
}

export async function addDistrict(oldDistrictId: number) {
  const [[oldDistrict]] = (await mysqlConnection.query(`
        SELECT * 
        FROM district
        WHERE id = ${oldDistrictId};
    `)) as [OldDistrict[], any];

  if (!oldDistrict) {
    console.warn("addDistrict(): No oldDistrict found for id", oldDistrictId);
    return null;
  }

  const city = await addCity(+oldDistrict.cityid);
  if (!city) {
    console.warn(
      "addDistrict(): addCity returned null for oldDistrict.cityId",
      oldDistrict.cityid,
      "(oldDistrictId:",
      oldDistrictId,
      ")",
    );
    return null;
  }

  const [existingDistrict] = await db
    .select()
    .from(districtModel)
    .where(
      and(
        ilike(districtModel.name, oldDistrict.name.trim()),
        eq(districtModel.cityId, city.id),
        eq(districtModel.legacyDistrictId, oldDistrictId),
      ),
    );
  if (existingDistrict) {
    console.log(
      "addDistrict(): existingDistrict found",
      existingDistrict.id,
      "for oldDistrictId",
      oldDistrictId,
    );
    return existingDistrict;
  }

  const [newDistrict] = await db
    .insert(districtModel)
    .values({
      cityId: city.id,
      legacyDistrictId: oldDistrictId,
      name: oldDistrict.name.trim(),
    })
    .returning();

  console.log(
    "addDistrict(): created new district",
    newDistrict.id,
    "for oldDistrictId",
    oldDistrictId,
    "cityId",
    city.id,
  );
  return newDistrict;
}

export async function categorizeIncome(income: string | null | undefined) {
  if (!income || income.trim() === "" || income === "0") {
    return undefined;
  }

  const getAnnualIncome = async (range: string) => {
    const [existingAnnualIncome] = await db
      .select()
      .from(annualIncomeModel)
      .where(eq(annualIncomeModel.range, range));
    if (existingAnnualIncome) {
      return existingAnnualIncome;
    }
    const [newAnnualIncome] = await db
      .insert(annualIncomeModel)
      .values({ range })
      .returning();

    return newAnnualIncome;
  };

  const lowerIncome = income.toLowerCase();

  if (
    lowerIncome.includes("upto 1.2") ||
    lowerIncome.includes("upto rs. 1.2") ||
    lowerIncome.includes("1,20,000") ||
    lowerIncome.includes("1.2 to 3")
  ) {
    return await getAnnualIncome("Below ₹3 Lakh");
  }
  if (
    lowerIncome.includes("3 to 5") ||
    lowerIncome.includes("1.2 lakh to 5") ||
    lowerIncome.includes("1.2 lac to 5")
  ) {
    return await getAnnualIncome("₹3 - ₹5 Lakh");
  }
  if (
    lowerIncome.includes("5 lakh and above") ||
    lowerIncome.includes("5 lacs and above") ||
    lowerIncome.includes("5 to 8") ||
    lowerIncome.includes("rs. 5,00,000 & above")
  ) {
    return await getAnnualIncome("₹5 - ₹8 Lakh");
  }
  if (lowerIncome.includes("8 lakhs & above") || lowerIncome.includes("3-10")) {
    return await getAnnualIncome("₹8 - ₹10 Lakh");
  }
  if (lowerIncome.includes("10 lacs and above")) {
    return await getAnnualIncome("₹10 Lakh and Above");
  }

  return undefined; // Default to lowest category
}

export function isOldStudent(x: OldStudent | OldStaff): x is OldStudent {
  return "transferred" in x;
}

export async function upsertHealth(
  details: OldStudent | OldStaff | null | undefined,
  userId?: number,
  admissionGeneralInfoId?: number,
): Promise<Health | null> {
  if (!details) {
    console.warn(
      "addHealth(): details is undefined/null; skipping health creation.",
    );
    return null;
  }

  if (admissionGeneralInfoId && userId) {
    throw new Error(
      "Either of admissionGeneralInfoId or userId is required, not both!",
    );
  }

  let bloodGroup: BloodGroup | undefined;

  // Resolve blood group if legacy id present
  const legacyBgId = details?.bloodGroup;
  if (legacyBgId) {
    const [bloodGroupResult] = (await mysqlConnection.query(
      `SELECT * FROM bloodgroup WHERE id = ${legacyBgId}`,
    )) as [{ id: number; name: string }[], any];
    if (bloodGroupResult.length > 0) {
      bloodGroup = await addBloodGroup(bloodGroupResult[0].name.trim());
    }
  }

  // Normalize values to match schema types
  const eyeLeftRaw = details?.eyePowerLeft;
  const eyeRightRaw = details?.eyePowerRight;
  const eyeLeft =
    eyeLeftRaw !== undefined && eyeLeftRaw !== null && eyeLeftRaw !== ""
      ? Number(eyeLeftRaw)
      : undefined;
  const eyeRight =
    eyeRightRaw !== undefined && eyeRightRaw !== null && eyeRightRaw !== ""
      ? Number(eyeRightRaw)
      : undefined;

  const heightVal = details?.height;
  const weightVal = details?.weight;

  const height =
    heightVal !== undefined && heightVal !== null
      ? String(heightVal)
      : undefined;
  const weight =
    weightVal !== undefined && weightVal !== null
      ? String(weightVal)
      : undefined;

  const spectaclesNotes = undefined as string | undefined;
  const hasSpectacles = false;

  let existingHealth: Health | undefined = undefined;
  if (userId) {
    existingHealth = (
      await db.select().from(healthModel).where(eq(healthModel.userId, userId))
    )[0];
  } else if (admissionGeneralInfoId) {
    existingHealth = (
      await db
        .select()
        .from(healthModel)
        .where(eq(healthModel.admissionGeneralInfoId, admissionGeneralInfoId!))
    )[0];
  } else {
    existingHealth = undefined;
  }

  if (existingHealth) {
    const [updatedHealth] = await db
      .update(healthModel)
      .set({
        bloodGroupId: bloodGroup ? bloodGroup.id : undefined,
        eyePowerLeft: isNaN(eyeLeft as number) ? undefined : eyeLeft,
        eyePowerRight: isNaN(eyeRight as number) ? undefined : eyeRight,
        height,
        weight,
        hasSpectacles,
        spectaclesNotes,
        identificationMark: isOldStudent(details)
          ? details.identificationmark || undefined
          : details.identificationMark || undefined,
      } as Health)
      .where(eq(healthModel.id, existingHealth.id!))
      .returning();
    existingHealth = updatedHealth;
  } else {
    const [newHealth] = await db
      .insert(healthModel)
      .values({
        admissionGeneralInfoId,
        userId,
        bloodGroupId: bloodGroup ? bloodGroup.id : undefined,
        eyePowerLeft: isNaN(eyeLeft as number) ? undefined : eyeLeft,
        eyePowerRight: isNaN(eyeRight as number) ? undefined : eyeRight,
        height,
        weight,
        hasSpectacles,
        spectaclesNotes,
        identificationMark: isOldStudent(details)
          ? details.identificationmark || undefined
          : details.identificationMark || undefined,
      } as Health)
      .returning();
    existingHealth = newHealth;
  }

  return existingHealth;
}

export async function upsertEmergencyContact(
  emergencyContact: EmergencyContact,
  userId?: number,
  admissionGeneralInfoId?: number,
) {
  if (userId && admissionGeneralInfoId) {
    throw new Error(
      "Either of userId or admissionGeneralInfoId is required, not both!",
    );
  }

  let existingEmergencyContact: EmergencyContact | undefined = undefined;
  if (userId) {
    existingEmergencyContact = (
      await db
        .select()
        .from(emergencyContactModel)
        .where(eq(emergencyContactModel.userId, userId))
    )[0];
  } else {
    existingEmergencyContact = (
      await db
        .select()
        .from(emergencyContactModel)
        .where(
          eq(
            emergencyContactModel.admissionGeneralInfoId,
            admissionGeneralInfoId!,
          ),
        )
    )[0];
  }

  if (existingEmergencyContact) {
    const [updatedEmergencyContact] = await db
      .update(emergencyContactModel)
      .set({
        personName: emergencyContact.personName?.trim(),
        havingRelationAs: emergencyContact.havingRelationAs?.trim(),
        email: emergencyContact.email?.trim()?.toLowerCase(),
        phone: emergencyContact.phone?.trim(),
        officePhone: emergencyContact.officePhone?.trim(),
        residentialPhone: emergencyContact.residentialPhone?.trim(),
      })
      .where(eq(emergencyContactModel.id, existingEmergencyContact.id!))
      .returning();
    existingEmergencyContact = updatedEmergencyContact;
  } else {
    const [newEmergencyContact] = await db
      .insert(emergencyContactModel)
      .values({
        admissionGeneralInfoId,
        userId,
        personName: emergencyContact.personName?.trim(),
        havingRelationAs: emergencyContact.havingRelationAs?.trim(),
        email: emergencyContact.email?.trim()?.toLowerCase(),
        phone: emergencyContact.phone?.trim(),
        officePhone: emergencyContact.officePhone?.trim(),
        residentialPhone: emergencyContact.residentialPhone?.trim(),
      })
      .returning();
    existingEmergencyContact = newEmergencyContact;
  }

  return existingEmergencyContact;
}

export async function upsertPersonalDetails(
  oldDetails: OldAdmStudentPersonalDetail | OldStaff,
  userId?: number,
  admissionGeneralInfoId?: number,
) {
  if (!isStaff(oldDetails) && !isAdmStudent(oldDetails)) {
    throw new Error("Invalid old details type");
  }
  if (isStaff(oldDetails) && !userId) {
    throw new Error("userId is required for OldStaff");
  }
  if (isAdmStudent(oldDetails) && !admissionGeneralInfoId) {
    throw new Error(
      "admissionGeneralInfoId is required for OldAdmStudentPersonalDetail",
    );
  }

  // Core personal details
  const fullName = isStaff(oldDetails)
    ? oldDetails.name || ""
    : (
        (oldDetails.firstName || "") +
        " " +
        (oldDetails.middleName || "") +
        " " +
        (oldDetails.lastName || "")
      ).trim();
  const firstName = fullName.split(" ")[0] || "";

  const mobileNumber = isStaff(oldDetails)
    ? oldDetails.phoneMobileNo || oldDetails.contactNo || ""
    : oldDetails.studentPersonalContactNo ||
      oldDetails.studentcontactNo ||
      oldDetails.contactNo ||
      "";

  // Normalize a value to a pure YYYY-MM-DD string to avoid timezone shifts
  const toISODateOnly = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      // If already in YYYY-MM-DD, keep as-is
      const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
      if (isoDateOnly.test(trimmed)) return trimmed;
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return undefined;
      // Build a UTC date to avoid local-TZ off-by-one
      const utc = new Date(
        Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
      )
        .toISOString()
        .slice(0, 10);
      return utc;
    }
    if (value instanceof Date) {
      const utc = new Date(
        Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
      )
        .toISOString()
        .slice(0, 10);
      return utc;
    }
    return undefined;
  };

  const dateOfBirthVal: Date | string | null | undefined = isStaff(oldDetails)
    ? oldDetails.dateOfBirth
    : oldDetails.dateOfBirth;
  const dateOfBirthISO = toISODateOnly(dateOfBirthVal as any);
  const sexId = isStaff(oldDetails) ? oldDetails.sexId : oldDetails.sexId;
  const gender = sexId === 0 ? undefined : sexId === 1 ? "MALE" : "FEMALE";
  const aadhaar = isStaff(oldDetails)
    ? oldDetails.aadharNo
      ? formatAadhaarCardNumber(oldDetails.aadharNo)
      : undefined
    : oldDetails.adhaarcardno
      ? formatAadhaarCardNumber(oldDetails.adhaarcardno)
      : undefined;
  const placeOfBirth = isStaff(oldDetails)
    ? undefined
    : oldDetails.placeofBirth || undefined;
  const whatsappNumber = isStaff(oldDetails)
    ? undefined
    : oldDetails.whatsappno || undefined;
  const emergencyResidentialNumber = isStaff(oldDetails)
    ? oldDetails.emergencytelmobile ||
      oldDetails.emergencytellandno ||
      undefined
    : oldDetails.emergencycontactno || undefined;
  const isGujarati = isStaff(oldDetails)
    ? false
    : (oldDetails.community || "") === "GUJARATI";

  // Additional personal details fields
  const voterId = isStaff(oldDetails) ? oldDetails.voterIdNo : undefined;
  const passportNumber = isStaff(oldDetails)
    ? oldDetails.passportNo
    : undefined;
  const maritalStatus = isStaff(oldDetails)
    ? oldDetails.maritalStatus === 1
      ? "MARRIED"
      : oldDetails.maritalStatus === 2
        ? "UNMARRIED"
        : oldDetails.maritalStatus === 3
          ? "DIVORCED"
          : oldDetails.maritalStatus === 4
            ? "WIDOWED"
            : undefined
    : oldDetails.maritialStatus === "Married"
      ? "MARRIED"
      : oldDetails.maritialStatus === "Unmarried"
        ? "UNMARRIED"
        : oldDetails.maritialStatus === "Divorced"
          ? "DIVORCED"
          : oldDetails.maritialStatus === "Widowed"
            ? "WIDOWED"
            : undefined;

  // Resolve personal detail foreign keys
  let nationalityId: number | undefined;
  if (
    isStaff(oldDetails) ? oldDetails.nationalityId : oldDetails.nationalityId
  ) {
    const natId = isStaff(oldDetails)
      ? oldDetails.nationalityId
      : oldDetails.nationalityId;
    const [rows] = (await mysqlConnection.query(
      `SELECT * FROM nationality WHERE id = ${natId}`,
    )) as [{ id: number; nationalityName: string; code: number }[], any];
    if (rows.length > 0) {
      const nat = await addNationality(rows[0].nationalityName, rows[0].code);
      nationalityId = nat.id;
    }
  }
  // let otherNationalityId: number | undefined;
  // if (!isStaff(oldDetails) && oldDetails.othernationality) {
  //     const [rows] = await mysqlConnection.query(`SELECT * FROM nationality WHERE id = ${oldDetails.othernationality}`) as [{ id: number, nationalityName: string, code: number }[], any];
  //     if (rows.length > 0) {
  //         const nat = await addNationality(rows[0].nationalityName, rows[0].code);
  //         otherNationalityId = nat.id;
  //     }
  // }
  let religionId: number | undefined;
  if (isStaff(oldDetails) ? oldDetails.religionId : oldDetails.religionId) {
    const relId = isStaff(oldDetails)
      ? oldDetails.religionId
      : oldDetails.religionId;
    const [rows] = (await mysqlConnection.query(
      `SELECT * FROM religion WHERE id = ${relId}`,
    )) as [{ id: number; religionName: string }[], any];
    if (rows.length > 0) {
      const rel = await addReligion(rows[0].religionName, relId!);
      religionId = rel.id;
    }
  }
  let motherTongueId: number | undefined;
  if (isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId) {
    const mtId = Number(
      isStaff(oldDetails) ? oldDetails.medium1 : oldDetails.motherTongueId,
    )!;
    const [rows] = (await mysqlConnection.query(
      `SELECT * FROM mothertongue WHERE id = ${mtId}`,
    )) as [{ id: number; mothertongueName: string }[], any];
    if (rows.length > 0) {
      const mt = await addLanguageMedium(rows[0].mothertongueName, mtId);
      motherTongueId = mt.id;
    }
  }
  let categoryId: number | undefined;
  if (
    isStaff(oldDetails) ? oldDetails.studentCategoryId : oldDetails.categoryId
  ) {
    const catId = isStaff(oldDetails)
      ? oldDetails.studentCategoryId!
      : oldDetails.categoryId!;
    const [rows] = (await mysqlConnection.query(
      `SELECT * FROM category WHERE id = ${catId}`,
    )) as [
      {
        id: number;
        category: string;
        code: string;
        docneeded: boolean | undefined;
      }[],
      any,
    ];
    if (rows.length > 0) {
      const cat = await addCategory(
        rows[0].category,
        rows[0].code,
        rows[0].docneeded,
        catId,
      );
      categoryId = cat.id;
    }
  }

  let existingPersonalDetails: PersonalDetails | undefined;
  if (isAdmStudent(oldDetails)) {
    existingPersonalDetails = (
      await db
        .select()
        .from(personalDetailsModel)
        .where(
          eq(
            personalDetailsModel.admissionGeneralInfoId,
            admissionGeneralInfoId!,
          ),
        )
    )[0];
  } else {
    existingPersonalDetails = (
      await db
        .select()
        .from(personalDetailsModel)
        .where(eq(personalDetailsModel.userId, userId!))
    )[0];
  }

  if (existingPersonalDetails) {
    const [updatedPersonalDetails] = await db
      .update(personalDetailsModel)
      .set({
        firstName,
        middleName: isStaff(oldDetails)
          ? undefined
          : ((oldDetails.middleName || undefined) as string | undefined),
        lastName: isStaff(oldDetails)
          ? undefined
          : ((oldDetails.lastName || undefined) as string | undefined),
        mobileNumber: mobileNumber?.toString(),
        whatsappNumber: whatsappNumber as string | undefined,
        emergencyResidentialNumber,
        email: oldDetails.email || undefined,
        // Store as YYYY-MM-DD string to prevent off-by-one due to timezone
        dateOfBirth: dateOfBirthISO as unknown as string | null | undefined,
        placeOfBirth: placeOfBirth as string | undefined,
        gender: gender as any,
        voterId: voterId as string | undefined,
        passportNumber: passportNumber as string | undefined,
        aadhaarCardNumber: aadhaar
          ? formatAadhaarCardNumber(aadhaar)
          : undefined,
        nationalityId,
        otherNationality:
          "othernationality" in oldDetails && oldDetails.othernationality
            ? oldDetails.othernationality
            : undefined,
        religionId,
        categoryId,
        motherTongueId,
        maritalStatus: maritalStatus as any,
        isGujarati: isGujarati || false,
        // mailingAddressId: mailingAddress
        //     ? (mailingAddress.id as number)
        //     : undefined,
        // residentialAddressId: residentialAddress
        //     ? (residentialAddress.id as number)
        //     : undefined,
      })
      .where(eq(personalDetailsModel.id, existingPersonalDetails.id!))
      .returning();

    await upsertPersonalDetailsAddress(oldDetails, updatedPersonalDetails.id);
    return updatedPersonalDetails;
  } else {
    const [newPersonalDetails] = await db
      .insert(personalDetailsModel)
      .values({
        admissionGeneralInfoId: isAdmStudent(oldDetails)
          ? admissionGeneralInfoId
          : undefined,
        userId: isStaff(oldDetails) ? userId : undefined,
        email: oldDetails.email || undefined,
        firstName,
        middleName: isStaff(oldDetails)
          ? undefined
          : ((oldDetails.middleName || undefined) as string | undefined),
        lastName: isStaff(oldDetails)
          ? undefined
          : ((oldDetails.lastName || undefined) as string | undefined),
        mobileNumber: mobileNumber?.toString(),
        whatsappNumber: whatsappNumber as string | undefined,
        emergencyResidentialNumber,
        // Store as YYYY-MM-DD string to prevent off-by-one due to timezone
        dateOfBirth: dateOfBirthISO as unknown as string | null | undefined,
        placeOfBirth: placeOfBirth as string | undefined,
        gender: gender as any,
        voterId: voterId as string | undefined,
        passportNumber: passportNumber as string | undefined,
        aadhaarCardNumber: aadhaar
          ? formatAadhaarCardNumber(aadhaar)
          : undefined,
        nationalityId,
        otherNationality:
          "othernationality" in oldDetails && oldDetails.othernationality
            ? oldDetails.othernationality
            : undefined,
        religionId,
        categoryId,
        motherTongueId,
        maritalStatus: maritalStatus as any,
        isGujarati: isGujarati || false,
        // mailingAddressId: mailingAddress
        //     ? (mailingAddress.id as number)
        //     : undefined,
        // residentialAddressId: residentialAddress
        //     ? (residentialAddress.id as number)
        //     : undefined,
      })
      .returning();
    await upsertPersonalDetailsAddress(oldDetails, newPersonalDetails.id);
    return newPersonalDetails;
  }
}

async function upsertPersonalDetailsAddress(
  oldDetails: OldAdmStudentPersonalDetail | OldStaff,
  personalDetailsId: number,
) {
  // Prepare address inputs per type
  const mailingAddressLine = isStaff(oldDetails)
    ? oldDetails.mailingAddress
    : oldDetails.mailingAddress;
  const mailingPin = isStaff(oldDetails)
    ? oldDetails.mailingPinNo
    : oldDetails.mailingPinNo;
  const mailingCountryLegacy = isStaff(oldDetails)
    ? (oldDetails.mcountryid ?? null)
    : (oldDetails.newcountryId ?? oldDetails.countryId ?? null);
  const mailingStateLegacy = isStaff(oldDetails)
    ? (oldDetails.mstateid ?? null)
    : null;
  const mailingCityLegacy = isStaff(oldDetails)
    ? (oldDetails.mcityid ?? null)
    : (oldDetails.newcityId ?? null);
  const mailingDistrictLegacy = isStaff(oldDetails)
    ? null
    : (oldDetails.newDistrictId ?? null);
  const mailingOtherState = isStaff(oldDetails)
    ? (oldDetails.mothstate ?? null)
    : (oldDetails.othernewState ?? oldDetails.otherState ?? null);
  const mailingOtherCity = isStaff(oldDetails)
    ? (oldDetails.mothcity ?? null)
    : (oldDetails.othernewCity ?? oldDetails.otherCity ?? null);
  const mailingPostOfficeId = isStaff(oldDetails)
    ? null
    : (oldDetails.newpostofficeid ?? null);
  const mailingOtherPostOffice = isStaff(oldDetails)
    ? null
    : (oldDetails.othernewpostoffice ?? null);
  const mailingPoliceStationId = isStaff(oldDetails)
    ? null
    : (oldDetails.newpolicestationid ?? null);
  const mailingOtherPoliceStation = isStaff(oldDetails)
    ? null
    : (oldDetails.othernewpolicestation ?? null);

  const residentialAddressLine = isStaff(oldDetails)
    ? oldDetails.residentialAddress
    : oldDetails.parmanentAddress;
  const resiPin = isStaff(oldDetails)
    ? oldDetails.resiPinNo
    : oldDetails.resiPinNo;
  const resiPhone = isStaff(oldDetails)
    ? oldDetails.resiPhoneMobileNo
    : oldDetails.studentPersonalContactNo ||
      oldDetails.studentcontactNo ||
      oldDetails.contactNo ||
      null;
  const resiCountryLegacy = isStaff(oldDetails)
    ? (oldDetails.rcountryid ?? null)
    : (oldDetails.countryId ?? null);
  const resiStateLegacy = isStaff(oldDetails)
    ? (oldDetails.rstateid ?? null)
    : (oldDetails.resiStateId ?? null);
  const resiCityLegacy = isStaff(oldDetails)
    ? (oldDetails.rcityid ?? null)
    : (oldDetails.cityId ?? null);
  const resiDistrictLegacy = isStaff(oldDetails)
    ? null
    : (oldDetails.resiDistrictId ?? null);
  const resiOtherState = isStaff(oldDetails)
    ? (oldDetails.rothstate ?? null)
    : (oldDetails.otherState ?? null);
  const resiOtherCity = isStaff(oldDetails)
    ? (oldDetails.rothcity ?? null)
    : (oldDetails.otherCity ?? null);
  const resiOtherDistrict = isStaff(oldDetails)
    ? null
    : (oldDetails.otherresiDistrict ?? null);
  const resiPostOfficeId = isStaff(oldDetails)
    ? null
    : (oldDetails.resipostofficeid ?? null);
  const resiOtherPostOffice = isStaff(oldDetails)
    ? null
    : (oldDetails.otherresipostoffice ?? null);
  const resiPoliceStationId = isStaff(oldDetails)
    ? null
    : (oldDetails.resipolicestationid ?? null);
  const resiOtherPoliceStation = isStaff(oldDetails)
    ? null
    : (oldDetails.otherresipolicestation ?? null);

  let mailingAddress: Address | undefined;
  if (
    mailingAddressLine ||
    mailingPin ||
    mailingCountryLegacy ||
    mailingStateLegacy ||
    mailingCityLegacy ||
    mailingDistrictLegacy
  ) {
    const [[oldMailingCountry]] = (await mysqlConnection.query(
      `SELECT * FROM countrymaintab WHERE id = ${mailingCountryLegacy}`,
    )) as [OldCountry[], any];

    const countryResolved = oldMailingCountry
      ? await addCountry(oldMailingCountry)
      : null;
    const stateResolved = mailingStateLegacy
      ? await addStateByCityMaintabOrLegacyStateId(
          undefined,
          mailingStateLegacy,
        )
      : null;
    const cityResolved = mailingCityLegacy
      ? await addCity(mailingCityLegacy)
      : null;
    const districtResolved = mailingDistrictLegacy
      ? await addDistrict(mailingDistrictLegacy)
      : null;

    const [existingAddress] = await db
      .select()
      .from(addressModel)
      .where(
        and(
          eq(addressModel.type, "MAILING"),
          eq(addressModel.personalDetailsId, personalDetailsId),
        ),
      );
    if (existingAddress) {
      const [updatedAddress] = await db
        .update(addressModel)
        .set({
          countryId: countryResolved?.id || undefined,
          stateId: stateResolved?.id || undefined,
          cityId: cityResolved?.id || undefined,
          districtId: districtResolved?.id || undefined,
          otherState: mailingOtherState || undefined,
          otherCity: mailingOtherCity || undefined,
          otherDistrict: isAdmStudent(oldDetails)
            ? ((oldDetails.othernewDistrict || undefined) as string | undefined)
            : undefined,
          postofficeId: mailingPostOfficeId || undefined,
          otherPostoffice: mailingOtherPostOffice || undefined,
          policeStationId: mailingPoliceStationId || undefined,
          otherPoliceStation: mailingOtherPoliceStation || undefined,
          addressLine: mailingAddressLine?.trim(),
          pincode: mailingPin?.trim(),
          localityType: null,
        })
        .where(eq(addressModel.id, existingAddress.id))
        .returning();
      mailingAddress = updatedAddress;
    } else {
      console.log(
        "Inserting address with country_id_fk:",
        mailingCountryLegacy,
      );
      const [address] = await db
        .insert(addressModel)
        .values({
          personalDetailsId,
          countryId: countryResolved?.id || undefined,
          stateId: stateResolved?.id || undefined,
          cityId: cityResolved?.id || undefined,
          districtId: districtResolved?.id || undefined,
          otherState: mailingOtherState || undefined,
          otherCity: mailingOtherCity || undefined,
          otherDistrict: isAdmStudent(oldDetails)
            ? ((oldDetails.othernewDistrict || undefined) as string | undefined)
            : undefined,
          postofficeId: mailingPostOfficeId || undefined,
          otherPostoffice: mailingOtherPostOffice || undefined,
          policeStationId: mailingPoliceStationId || undefined,
          otherPoliceStation: mailingOtherPoliceStation || undefined,
          addressLine: mailingAddressLine?.trim(),
          pincode: mailingPin?.trim(),
          localityType: null,
        })
        .returning();
      mailingAddress = address;
    }
  }

  let residentialAddress: Address | undefined;
  if (
    residentialAddressLine ||
    resiPin ||
    resiPhone ||
    resiCountryLegacy ||
    resiStateLegacy ||
    resiCityLegacy ||
    resiDistrictLegacy
  ) {
    const [[oldResiCountry]] = (await mysqlConnection.query(
      `SELECT * FROM countrymaintab WHERE id = ${resiCountryLegacy}`,
    )) as [OldCountry[], any];

    const countryResolved = resiCountryLegacy
      ? await addCountry(oldResiCountry)
      : null;
    const stateResolved = resiStateLegacy
      ? await addStateByCityMaintabOrLegacyStateId(undefined, resiStateLegacy)
      : null;
    const cityResolved = resiCityLegacy ? await addCity(resiCityLegacy) : null;
    const districtResolved = resiDistrictLegacy
      ? await addDistrict(resiDistrictLegacy)
      : null;

    const [existingAddress] = await db
      .select()
      .from(addressModel)
      .where(
        and(
          eq(addressModel.type, "RESIDENTIAL"),
          eq(addressModel.personalDetailsId, personalDetailsId),
        ),
      );
    if (existingAddress) {
      const [updatedAddress] = await db
        .update(addressModel)
        .set({
          countryId: countryResolved?.id || undefined,
          stateId: stateResolved?.id || undefined,
          cityId: cityResolved?.id || undefined,
          districtId: districtResolved?.id || undefined,
          otherDistrict: isAdmStudent(oldDetails)
            ? ((oldDetails.otherresiDistrict || undefined) as
                | string
                | undefined)
            : undefined,
          otherState: resiOtherState || undefined,
          otherCity: resiOtherCity || undefined,
          postofficeId: resiPostOfficeId || undefined,
          otherPostoffice: resiOtherPostOffice || undefined,
          policeStationId: resiPoliceStationId || undefined,
          otherPoliceStation: resiOtherPoliceStation || undefined,
          addressLine: residentialAddressLine?.trim(),
          phone: resiPhone?.trim() || undefined,
          pincode: resiPin?.trim(),
          localityType: null,
        })
        .where(eq(addressModel.id, existingAddress.id))
        .returning();
      residentialAddress = updatedAddress;
    } else {
      const [address] = await db
        .insert(addressModel)
        .values({
          type: "RESIDENTIAL",
          personalDetailsId,
          countryId: countryResolved?.id || undefined,
          stateId: stateResolved?.id || undefined,
          cityId: cityResolved?.id || undefined,
          districtId: districtResolved?.id || undefined,
          otherDistrict: isAdmStudent(oldDetails)
            ? ((oldDetails.otherresiDistrict || undefined) as
                | string
                | undefined)
            : undefined,
          otherState: resiOtherState || undefined,
          otherCity: resiOtherCity || undefined,
          postofficeId: resiPostOfficeId || undefined,
          otherPostoffice: resiOtherPostOffice || undefined,
          policeStationId: resiPoliceStationId || undefined,
          otherPoliceStation: resiOtherPoliceStation || undefined,
          addressLine: residentialAddressLine?.trim(),
          phone: resiPhone?.trim() || undefined,
          pincode: resiPin?.trim(),
          localityType: null,
        })
        .returning();
      residentialAddress = address;
    }
  }

  return { mailingAddress, residentialAddress };
}

// Board/Result/Transport helpers are handled in controllers or other services in the new schema

export async function processOldCourseDetails(
  courseDetails: OldCourseDetails,
  applicationForm: ApplicationForm,
) {
  console.log(
    "in processOldCourseDetails(), oldcourseDetails",
    courseDetails.id,
    "this will be used in line 2946",
  );
  const [[oldCourse]] = (await mysqlConnection.query(`
        SELECT * FROM course WHERE id = ${courseDetails.courseid}`)) as [
    OldCourse[],
    any,
  ];

  const [existingAdmOldCourseDetails] = await db
    .select()
    .from(admissionCourseDetailsModel)
    .where(
      and(
        eq(
          admissionCourseDetailsModel.applicationFormId,
          applicationForm.id as number,
        ),
        eq(admissionCourseDetailsModel.legacyCourseDetailsId, courseDetails.id),
      ),
    );

  if (existingAdmOldCourseDetails) return existingAdmOldCourseDetails;

  // const course = await addCourse(courseDetails.courseid);

  const classData = await addClass(courseDetails.classid);

  const eligibilityCriteria = await addEligibilityCriteria(
    courseDetails.eligibilityCriteriaId,
  );

  const studenrCategory = await addStudentCategory(
    courseDetails.studentCategoryId,
  );

  const shift = await upsertShift(courseDetails.shiftid);

  const meritList = await addMeritList(courseDetails.meritlistid);

  const bank = await addBank(courseDetails.feespaymentbankid);

  const bankBranch = await addBankBranch(courseDetails.feespaymentbrnchid);

  const bankBranchOther = courseDetails.feespaymentbrnchothr;
  const bankOther = courseDetails.feespaidtype;

  // let stream: Stream | undefined;
  // console.log("course?.name", course?.name);

  // // Remove dots and normalize the course name for comparison
  // const normalizedCourseName = course?.name
  //     .toLowerCase()
  //     .replace(/\./g, "")
  //     .trim();

  // if (normalizedCourseName?.includes("bsc")) {
  //     stream = await addStream({
  //         name: "Science & Technology",
  //         code: "Sci.",
  //         shortName: "Sci.",
  //         isActive: true,
  //     });
  // } else if (normalizedCourseName?.includes("ba")) {
  //     stream = await addStream({
  //         name: "Arts & Humanities",
  //         code: "Arts",
  //         shortName: "Arts",
  //         isActive: true,
  //     });
  // } else if (
  //     ((normalizedCourseName?.includes("(h)") ||
  //         normalizedCourseName?.includes("(g)")) &&
  //         normalizedCourseName?.includes("bcom")) ||
  //     normalizedCourseName?.includes("bba")
  // ) {
  //     stream = await addStream({
  //         name: "Commerce & Management",
  //         code: "Com.",
  //         shortName: "Com.",
  //     });
  // }

  // // Default stream for courses that don't match the above patterns
  // if (!stream) {
  //     throw new Error("Stream not found...!");
  // }

  // let courseType: CourseType | undefined;
  // if (oldCourse.courseName.toLowerCase().trim().includes("(h)")) {
  //     courseType = (
  //         await db
  //             .select()
  //             .from(courseTypeModel)
  //             .where(and(ilike(courseTypeModel.name, "Honours")))
  //     )[0];
  //     if (!courseType) {
  //         throw new Error("Course Type not found...!");
  //     }
  // } else if (oldCourse.courseName.toLowerCase().trim().includes("(g)")) {
  //     courseType = (
  //         await db
  //             .select()
  //             .from(courseTypeModel)
  //             .where(and(ilike(courseTypeModel.name, "General")))
  //     )[0];
  //     if (!courseType) {
  //         throw new Error("Course Type not found...!");
  //     }
  // }

  console.log("oldCourse.courseName", oldCourse);

  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(ilike(programCourseModel.name, oldCourse.courseName!.trim()));

  // console.log("programCourse", programCourse);

  if (!programCourse) {
    console.log("programCourse not found for oldCourse", oldCourse.courseName);
    return null;
  }

  const [admission] = await db
    .select()
    .from(admissionModel)
    .where(eq(admissionModel.id, applicationForm.admissionId as number));
  // const [session] = await db.select().from(sessionModel).where(eq(sessionModel.id, admission?.sessionId as number));
  // const [academicYear] = await db.select().from(academicYearModel).where(eq(academicYearModel.id, session?.academicYearId as number));

  let [existingAdmissionProgramCourse] = await db
    .select()
    .from(admissionProgramCourseModel)
    .where(
      and(
        eq(
          admissionProgramCourseModel.programCourseId,
          programCourse.id! as number,
        ),
        eq(admissionProgramCourseModel.admissionId, admission?.id as number),
        eq(admissionProgramCourseModel.classId, classData?.id as number),
      ),
    );

  if (!existingAdmissionProgramCourse) {
    existingAdmissionProgramCourse = (
      await db
        .insert(admissionProgramCourseModel)
        .values({
          admissionId: admission?.id as number,
          programCourseId: programCourse.id as number,
          classId: classData?.id as number,
        })
        .returning()
    )[0];
  }

  let cancelByUser: User | undefined;
  if (courseDetails.canceluserid) {
    const [[oldStaff]] = (await mysqlConnection.query(
      `SELECT * FROM staffpersonaldetails WHERE id = ${courseDetails.canceluserid}`,
    )) as [OldStaff[], any];
    cancelByUser = await upsertUser(oldStaff, "STAFF");
  }

  let cancelSource: CancelSource | undefined;
  if (courseDetails.cancelsourceid) {
    const [[oldCancelSource]] = (await mysqlConnection.query(
      `SELECT * FROM cancelsource WHERE id = ${courseDetails.cancelsourceid}`,
    )) as [{ id: number; name: string }[], any];
    const [existingCancelSource] = await db
      .select()
      .from(cancelSourceModel)
      .where(
        and(
          ilike(cancelSourceModel.name, oldCancelSource.name.trim()),
          eq(
            cancelSourceModel.legacyCancelSourceId,
            courseDetails.cancelsourceid,
          ),
        ),
      );
    if (existingCancelSource) {
      cancelSource = existingCancelSource;
    } else {
      cancelSource = (
        await db
          .insert(cancelSourceModel)
          .values({
            name: oldCancelSource.name,
            legacyCancelSourceId: courseDetails.cancelsourceid,
          })
          .returning()
      )[0];
    }
  }

  let freeshipApprovedBy: User | undefined;
  if (courseDetails.freeshipappby) {
    const [[oldStaff]] = (await mysqlConnection.query(
      `SELECT * FROM staffpersonaldetails WHERE id = ${courseDetails.freeshipappby}`,
    )) as [OldStaff[], any];
    freeshipApprovedBy = await upsertUser(oldStaff, "STAFF");
  }

  let verifiedBy: User | undefined;
  if (courseDetails.verifiedby) {
    const [[oldStaff]] = (await mysqlConnection.query(
      `SELECT * FROM staffpersonaldetails WHERE id = ${courseDetails.verifiedby}`,
    )) as [OldStaff[], any];
    verifiedBy = await upsertUser(oldStaff, "STAFF");
  }

  let meritListBy: User | undefined;
  if (courseDetails.meritlistby) {
    const [[oldStaff]] = (await mysqlConnection.query(
      `SELECT * FROM staffpersonaldetails WHERE id = ${courseDetails.meritlistby}`,
    )) as [OldStaff[], any];
    meritListBy = await upsertUser(oldStaff, "STAFF");
  }

  // Ensure required foreign keys are present
  if (!shift?.id || !classData?.id) {
    console.log(
      "Missing required IDs for admission_course_details (stream/shift/class/studentCategory)",
    );
    console.log(
      `in line 2946, shift?.id: ${shift?.id}, classData?.id: ${classData?.id}, studenrCategory?.id: ${studenrCategory?.id}  for old-ourseDetails.id: ${courseDetails.id}`,
    );
    return null;
  }

  const insertValues: AdmissionCourseDetailsT = {
    applicationFormId: applicationForm.id as number,
    legacyCourseDetailsId: courseDetails.id,

    isTransferred: !!courseDetails.transferred,
    admissionProgramCourseId: existingAdmissionProgramCourse.id!,
    streamId: programCourse.streamId!,
    classId: classData.id!,
    shiftId: shift.id,
    eligibilityCriteriaId: eligibilityCriteria?.id,
    studentCategoryId: studenrCategory?.id,

    rfidNumber: courseDetails.rfidno ? String(courseDetails.rfidno) : "",
    classRollNumber: courseDetails.rollNumber
      ? String(courseDetails.rollNumber)
      : "",
    appNumber: courseDetails.appno ? String(courseDetails.appno) : "",
    challanNumber: courseDetails.chllno ? String(courseDetails.chllno) : "",

    amount: courseDetails.amt || 0,
    paymentTimestamp: courseDetails.paymentDate
      ? new Date(courseDetails.paymentDate)
      : undefined,
    paymentType: courseDetails.paymentType || undefined,
    applicationTimestamp: courseDetails.applicationdt
      ? new Date(courseDetails.applicationdt)
      : new Date(),
    isSmsSent: !!courseDetails.smssent,
    smsSentAt: courseDetails.smssenton
      ? new Date(courseDetails.smssenton)
      : undefined,

    isVerified: !!courseDetails.verified,
    verifiedAt: courseDetails.verifydt
      ? new Date(courseDetails.verifydt)
      : undefined,
    verifiedById: verifiedBy?.id,
    verifiedOn: courseDetails.verifiedon
      ? new Date(courseDetails.verifiedon)
      : undefined,

    isFreeshipApplied: !!courseDetails.freeshipapplied,
    freeshipDate: courseDetails.freeshipdate
      ? new Date(courseDetails.freeshipdate)
      : undefined,
    freeshipApprovedById: freeshipApprovedBy?.id,
    // If you have a timestamp for approval, map it here
    freeshipApprovedOn: courseDetails.freeshipappdate
      ? new Date(courseDetails.freeshipappdate)
      : undefined,
    freeshipPercentage: Number(courseDetails.freeshipperc) || 0,

    isFreeshipApproved: !!courseDetails.freeshipapproved,

    isFeesChallanGenerated: !!courseDetails.feeschallangenerated,
    feesChallanNumber: courseDetails.feeschallanno
      ? String(courseDetails.feeschallanno)
      : undefined,
    feesChallanDate: courseDetails.feeschallandate
      ? new Date(courseDetails.feeschallandate)
      : undefined,
    isFeesPaid: !!courseDetails.feespaymententrydate,
    feesPaidType: courseDetails.feespaidtype || undefined,
    feesPaidAt: courseDetails.feespaymentdate
      ? new Date(courseDetails.feespaymentdate)
      : undefined,
    feesPaymentBankBranchId: bankBranch?.id,
    feesPaymentEntryDate: courseDetails.feespaymententrydate
      ? new Date(courseDetails.feespaymententrydate)
      : undefined,
    feesPaymentBankId: bank?.id,
    feesDraftNumber: courseDetails.feesdraftno || undefined,
    feesDratdtDate: courseDetails.feesdraftdt
      ? new Date(courseDetails.feesdraftdt)
      : undefined,
    feesDraftDrawnOn: courseDetails.feesdraftdrawnon
      ? new Date(courseDetails.feesdraftdrawnon)
      : undefined,
    feesDraftAmount: courseDetails.feesdraftamt || 0,

    isBlocked: !!courseDetails.block,
    blockRemarks: courseDetails.blockremark || undefined,
    shiftChangeRemarks: courseDetails.shiftchangeremark || undefined,
    specializationId: courseDetails.specialization
      ? Number(courseDetails.specialization)
      : undefined,

    isEdCutOffFailed: !!courseDetails.edtcutofffail,
    isMeritListed: !!courseDetails.meritlisted,
    bestOfFour: courseDetails.bestofFour || undefined,
    totalScore: courseDetails.totalscore || undefined,
    meritListId: meritList?.id,
    meritListedOn: courseDetails.meritlistdt
      ? new Date(courseDetails.meritlistdt)
      : undefined,
    meritListCount: courseDetails.meritlistcount || undefined,
    meritListBy: meritListBy ? meritListBy?.id : undefined,
    isAdmitCardSelected: !!courseDetails.admitcardselected,
    admitCardSelectedOn: courseDetails.admitcardselectedon
      ? new Date(courseDetails.admitcardselectedon)
      : undefined,
    admissionTestSmsSentOn: courseDetails.admtestsmssenton
      ? new Date(courseDetails.admtestsmssenton)
      : undefined,

    // Misc legacy flags that are varchar(5) in schema
    admFrmDwnld: courseDetails.admfrmdwnld ? "1" : "0",
    admFrmDwnlIdEntryDate: courseDetails.admfrmdwnldentrydate
      ? new Date(courseDetails.admfrmdwnldentrydate)
      : undefined,

    // Cancellation
    cancelSourceId: cancelSource?.id,
    cancelById: cancelByUser?.id,
    cancelDate: courseDetails.canceldate
      ? new Date(courseDetails.canceldate)
      : undefined,
    cancelEntryDate: courseDetails.cancelentrydt
      ? new Date(courseDetails.cancelentrydt)
      : undefined,

    // Additional optional fields from schema
    receivedPayment: !!courseDetails.payreceived,
    isInstallmentApplied: !!courseDetails.instlapplied,
    installmentAppliedOn: courseDetails.instlapplieddt
      ? new Date(courseDetails.instlapplieddt)
      : undefined,
    feesChallanInstallmentAmount: courseDetails.feeschallaninstamt
      ? Number(courseDetails.feeschallaninstamt)
      : undefined,
    feesPaidReconciled: !!courseDetails.feespaidreconciled,
    onlineRefNumber: courseDetails.onlinerefno || undefined,
    paymentMessage: courseDetails.pmtmsg || undefined,
    lastDateDocumentPending: courseDetails.docpendingdtls
      ? new Date(courseDetails.docpendingdtls)
      : undefined,
    instltranId: courseDetails.instltranid
      ? Number(courseDetails.instltranid)
      : undefined,
    documentVerificationCalledAt: courseDetails.docvrfcalldate
      ? new Date(courseDetails.docvrfcalldate)
      : undefined,
    installmentRefNumber: courseDetails.instlrefno || undefined,
    verifymastersubid: courseDetails.verifymastersubid
      ? Number(courseDetails.verifymastersubid)
      : undefined,
    verifyType: courseDetails.verifytype || undefined,
    verifyRemarks: courseDetails.verifyremarks || undefined,
    verify_master_sub_orig1_id: courseDetails.verifymastersuborig1id
      ? Number(courseDetails.verifymastersuborig1id)
      : undefined,
    verify_master_sub_orig2_id: courseDetails.verifymastersuborig2id
      ? Number(courseDetails.verifymastersuborig2id)
      : undefined,
    verify_type_orig1: courseDetails.verifytypeorig1 || undefined,
    verify_type_orig2: courseDetails.verifytypeorig2 || undefined,
    verify_remarks1: courseDetails.verifyremarks1 || undefined,

    gujaratiPeriod: courseDetails.gujaratiperiod
      ? Number(courseDetails.gujaratiperiod)
      : undefined,
    gujaratiAdmissionType: courseDetails.gujaratiadmtype || undefined,
    gujaratiAdmissionDate: courseDetails.gujaratiadmdate
      ? new Date(courseDetails.gujaratiadmdate)
      : undefined,
    sportQuotaAdmissionType: courseDetails.sportsquotaadmtype || undefined,
    sportsQuotaAdmissionDate: courseDetails.sportsquotaadmdate
      ? new Date(courseDetails.sportsquotaadmdate)
      : undefined,
    isSportsQuotaApplied: !!courseDetails.sportsquotaapplied,
    subjectSelection: courseDetails.subjectselection
      ? Number(courseDetails.subjectselection)
      : undefined,
    documentStatus: courseDetails.documentstatus || undefined,
    documentUploadDate: courseDetails.documentuploaddate
      ? new Date(courseDetails.documentuploaddate)
      : undefined,
    isCancelled: !!courseDetails.cancelled,
    // cancelSourceId: courseDetails.cancelsourceid ? Number(courseDetails.cancelsourceid) : undefined,
    cancelRemarks: courseDetails.cancelremarks || undefined,

    freeshipPercentageApplied: courseDetails.freeshippercapplied
      ? Number(courseDetails.freeshippercapplied)
      : undefined,
    freesshipAmountId: courseDetails.freeshipamtid
      ? Number(courseDetails.freeshipamtid)
      : undefined,
  };

  const [newAdmissionCourseDetails] = await db
    .insert(admissionCourseDetailsModel)
    .values(insertValues)
    .returning();

  // console.log("newAdmissionCourseDetails", newAdmissionCourseDetails);
  return newAdmissionCourseDetails;
}

export async function getSubjectRelatedFields(
  courseDetails: OldCourseDetails,
  transferredAdmCourseDetails: AdmissionCourseDetails,
  academicYear: AcademicYear,
  studentId: number,
) {
  const [admissionProgramCourse] = await db
    .select()
    .from(admissionProgramCourseModel)
    .where(
      eq(
        admissionProgramCourseModel.id,
        transferredAdmCourseDetails.admissionProgramCourseId as number,
      ),
    );

  // console.log(
  //     "in getSubjectRelatedFields(), admissionProgramCourse",
  //     admissionProgramCourse,
  // );
  if (!admissionProgramCourse) {
    throw new Error("Admission Program Course not found...!");
  }

  // const [programCourse] = await db
  //     .select()
  //     .from(programCourseModel)
  //     .where(
  //         eq(
  //             programCourseModel.id,
  //             admissionProgramCourse.programCourseId as number,
  //         ),
  //     );

  const [foundAffiliation] = await db
    .select()
    .from(affiliationModel)
    .where(ilike(affiliationModel.shortName, "CU"));

  if (!foundAffiliation) {
    throw new Error("Affiliation not found...!");
  }

  const [[oldClass]] = (await mysqlConnection.query(
    `SELECT * FROM classes WHERE id = ${courseDetails.classid}`,
  )) as [OldClass[], any];
  if (!oldClass) {
    throw new Error("Class not found...!");
  }

  let [foundClass] = await db
    .select()
    .from(classModel)
    .where(ilike(classModel.name, oldClass.classname!.trim()));

  if (!foundClass) {
    // Create semester 1 class if it doesn't exist
    // [foundClass] = await db
    //     .insert(classModel)
    //     .values({
    //         name: oldClass.classname!.trim(),
    //         type: "SEMESTER",
    //     })
    //     .returning();
    throw new Error("Class not found...!");
  }

  let [foundRegulationType] = await db
    .select()
    .from(regulationTypeModel)
    .where(ilike(regulationTypeModel.shortName, "CCF"));

  if (!foundRegulationType) {
    throw new Error("Regulation Type not found...!");
  }

  const [oldCvSubjectSelections] = (await mysqlConnection.query(`
        SELECT * FROM cvsubjectselection WHERE parent_id = ${courseDetails.id}
    `)) as [OldCvSubjectSelection[], any];
  console.log(`
        SELECT * FROM cvsubjectselection WHERE parent_id = ${courseDetails.id}
    `);

  console.log(
    "in getSubjectRelatedFields(), oldCvSubjectSelections",
    oldCvSubjectSelections,
  );

  for (let i = 0; i < oldCvSubjectSelections.length; i++) {
    const oldCvSubjectSelection = oldCvSubjectSelections[i];
    const [[oldSubject]] = (await mysqlConnection.query(
      `SELECT * FROM subject WHERE id = ${oldCvSubjectSelection.subjectid}`,
    )) as [OldSubject[], any];

    if (!oldSubject) {
      console.warn(
        `No subject found for subjectid: ${oldCvSubjectSelection.subjectid}`,
      );
      continue;
    }

    // const foundBoardSubject = await addBoardSubject(oldAdmRelevantSubject.id, oldBoardId);

    const foundPaper = await findPaper(
      oldCvSubjectSelection,
      foundAffiliation,
      foundClass,
      foundRegulationType,
      admissionProgramCourse.programCourseId!,
      academicYear,
      oldSubject,
    );

    if (!foundPaper) {
      console.warn(
        `No paper found for subjectid: ${oldCvSubjectSelection.subjectid}`,
      );
      continue;
    }

    // console.log("oldCvSubjectSelection", oldCvSubjectSelection.id);
    await addAdmSubjectPaperSelection(
      oldCvSubjectSelection,
      studentId,
      transferredAdmCourseDetails.id!,
      foundPaper.id,
    );
  }
}

export async function findPaper(
  oldCvSubjectSelection: OldCvSubjectSelection,
  foundAffiliation: Affiliation,
  foundClass: Class,
  foundRegulationType: RegulationType,
  programCourseId: number,
  academicYear: AcademicYear,
  oldSubject: OldSubject,
) {
  // console.log("in findPaper(), oldSubject", oldSubject);
  const [foundSubject] = await db
    .select()
    .from(subjectModel)
    .where(ilike(subjectModel.name, oldSubject.subjectName.trim()));

  if (!foundSubject) {
    console.warn(
      `Subject not found for subjectid: ${oldCvSubjectSelection.subjectid}`,
    );
    return null;
  }

  const [foundSubjectType] = await db
    .select()
    .from(subjectTypeModel)
    .where(
      eq(subjectTypeModel.id, 24),
    ); /* 24 is the id of the subject type "MN" */

  if (!foundSubjectType) {
    console.warn(
      `Subject Type not found for subjectid: ${oldCvSubjectSelection.subjectid}`,
    );
    return null;
  }

  const [foundPaper] = await db
    .select()
    .from(paperModel)
    .where(
      and(
        eq(paperModel.affiliationId, foundAffiliation.id!),
        eq(paperModel.regulationTypeId, foundRegulationType.id!),
        eq(paperModel.academicYearId, academicYear.id!),
        eq(paperModel.subjectTypeId, foundSubjectType?.id!),
        eq(paperModel.programCourseId, programCourseId!),
        eq(paperModel.subjectId, foundSubject?.id!),
        eq(paperModel.classId, foundClass.id!),
      ),
    );

  console.log("foundPaper", foundPaper);

  if (!foundPaper) {
    console.warn(
      `Paper not found for old subjectid: ${oldCvSubjectSelection.subjectid}`,
      `foundClassid: ${foundClass.id}`,
      `foundRegulationTypeid: ${foundRegulationType.id}`,
      `foundAcademicYearid: ${academicYear.id}`,
      `foundSubjectTypeid: ${foundSubjectType.id}`,
      `programCourseId: ${programCourseId}`,
      `foundSubjectid: ${foundSubject.id}`,
    );
    return null;
  }

  return foundPaper;
}

// async function addProgramCourse(
//     stream: Stream | undefined,
//     course: Course,
//     courseType: CourseType,
// ) {
//     if (!stream || !course || !courseType) {
//         throw new Error("Stream, Course or Course Type not found...!");
//     }

//     const [foundCourseLevel] = await db
//         .select()
//         .from(courseLevelModel)
//         .where(eq(courseLevelModel.name, "Undergraduate"));
//     if (!foundCourseLevel) {
//         throw new Error("Course Level not found...!");
//     }

//     const [foundAffiliation] = await db
//         .select()
//         .from(affiliationModel)
//         .where(ilike(affiliationModel.shortName, "CU"));

//     if (!foundAffiliation) {
//         throw new Error("Affiliation not found...!");
//     }

//     const [foundRegulationType] = await db
//         .select()
//         .from(regulationTypeModel)
//         .where(ilike(regulationTypeModel.shortName, "ccf"));

//     if (!foundRegulationType) {
//         throw new Error("Regulation Type not found...!");
//     }

//     const [foundProgramCourse] = await db
//         .select()
//         .from(programCourseModel)
//         .where(
//             and(
//                 eq(programCourseModel.streamId, stream.id!),
//                 eq(programCourseModel.courseId, course.id!),
//                 eq(programCourseModel.courseTypeId, courseType.id!),
//                 eq(programCourseModel.courseLevelId, foundCourseLevel.id!),
//                 eq(programCourseModel.affiliationId, foundAffiliation.id!),
//                 eq(programCourseModel.regulationTypeId, foundRegulationType.id!),
//             ),
//         );

//     if (foundProgramCourse) return foundProgramCourse;

//     const newProgramCourse = await db
//         .insert(programCourseModel)
//         .values({
//             streamId: stream.id!,
//             courseId: course.id!,
//             courseTypeId: courseType.id!,
//             courseLevelId: foundCourseLevel.id!,
//             affiliationId: foundAffiliation.id!,
//             regulationTypeId: foundRegulationType.id!,
//             duration: 4,
//             totalSemesters: 8,
//         })
//         .returning();

//     return newProgramCourse[0];
// }

export async function addStudentCategory(oldStudentCategoryId: number | null) {
  if (!oldStudentCategoryId) return null;

  const [[studentCategoryRow]] = (await mysqlConnection.query(
    `SELECT * FROM studentcatagory WHERE id = ${oldStudentCategoryId}`,
  )) as [OldStudentCategory[], any];

  if (!studentCategoryRow) return null;

  const [foundStudentCategory] = await db
    .select()
    .from(studentCategoryModel)
    .where(
      ilike(studentCategoryModel.name, studentCategoryRow.studentCName.trim()),
    );

  if (foundStudentCategory) return foundStudentCategory;

  const course = await addCourse(studentCategoryRow.courseId);
  const classSem = await addClass(studentCategoryRow.classId);

  if (!course || !classSem) {
    return null;
  }

  return (
    await db
      .insert(studentCategoryModel)
      .values({
        legacyStudentCategoryId: oldStudentCategoryId,
        name: studentCategoryRow.studentCName.trim(),
        courseId: course?.id,
        classId: classSem?.id,
        documentRequired: !!studentCategoryRow.document,
      })
      .returning()
  )[0];
}

export async function addClass(oldClassId: number | null) {
  if (!oldClassId) return null;

  const [[classRow]] = (await mysqlConnection.query(
    `SELECT * FROM classes WHERE id = ${oldClassId}`,
  )) as [OldClass[], any];

  if (!classRow) return null;

  const [foundClass] = await db
    .select()
    .from(classModel)
    .where(ilike(classModel.name, classRow.classname!.trim()));

  if (foundClass) return foundClass;

  //   return (
  //     await db
  //       .insert(classModel)
  //       .values({
  //         name: classRow.classname!.trim(),
  //         type: classRow.type === "year" ? "YEAR" : "SEMESTER",
  //       })
  //       .returning()
  //   )[0];
}

export async function addStream(stream: Stream) {
  const [foundStream] = await db
    .select()
    .from(streamModel)
    .where(ilike(streamModel.name, stream.name.trim()));

  if (foundStream) return foundStream;

  return (await db.insert(streamModel).values(stream).returning())[0];
}

export async function addCourse(oldCourseId: number | null) {
  if (!oldCourseId) return null;
  const [[courseRow]] = (await mysqlConnection.query(
    `SELECT * FROM course WHERE id = ${oldCourseId}`,
  )) as [OldCourse[], any];

  if (!courseRow) return null;

  const [foundCourse] = await db
    .select()
    .from(courseModel)
    .where(ilike(courseModel.name, courseRow.courseName.trim()));

  if (foundCourse) return foundCourse;

  // Get the next available sequence number by finding the max sequence
  //   const existingCourses = await db
  //     .select({ sequence: courseModel.sequence })
  //     .from(courseModel)
  //     .orderBy(courseModel.sequence);

  //   // Find the highest sequence number and add 1
  //   const maxSequence =
  //     existingCourses.length > 0
  //       ? Math.max(...existingCourses.map((c) => c.sequence || 0))
  //       : 0;
  //   const nextSequence = maxSequence + 1;

  //   return (
  //     await db
  //       .insert(courseModel)
  //       .values({
  //         name: courseRow.courseName.trim(),
  //         shortName: courseRow.courseSName?.trim(),
  //         legacyCourseId: oldCourseId,
  //         sequence: nextSequence,
  //       })
  //       .returning()
  //   )[0];
}

export async function addEligibilityCriteria(oldEligibilityId: number | null) {
  if (!oldEligibilityId) return null;
  const [[eligibilityRow]] = (await mysqlConnection.query(
    `SELECT * FROM eligibilitycriteria WHERE id = ${oldEligibilityId}`,
  )) as [OldEligibilityCriteria[], any];

  if (!eligibilityRow) return null;

  const [foundEligibilityCriteria] = await db
    .select()
    .from(eligibilityCriteriaModel)
    .where(
      and(
        eq(eligibilityCriteriaModel.courseId, eligibilityRow.courseId),
        eq(eligibilityCriteriaModel.classId, eligibilityRow.classId),
        eq(eligibilityCriteriaModel.categoryId, eligibilityRow.categoryId),
      ),
    );

  if (foundEligibilityCriteria) return foundEligibilityCriteria;

  return (
    await db
      .insert(eligibilityCriteriaModel)
      .values({
        legacyEligibilityCriteriaId: oldEligibilityId,
        courseId: eligibilityRow.courseId,
        classId: eligibilityRow.classId,
        categoryId: eligibilityRow.categoryId,
        description: eligibilityRow.description?.trim(),
        generalInstruction: eligibilityRow.generalInstruction?.trim(),
      })
      .returning()
  )[0];
}

export async function upsertShift(oldShiftId: number | null) {
  if (!oldShiftId) return null;

  const [[shiftRow]] = (await mysqlConnection.query(
    `SELECT * FROM shift WHERE id = ${oldShiftId}`,
  )) as [OldShift[], any];

  if (!shiftRow) return null;

  const [foundShift] = await db
    .select()
    .from(shiftModel)
    .where(ilike(shiftModel.name, shiftRow.shiftName.trim()));

  if (foundShift) {
    const [updatedShift] = await db
      .update(shiftModel)
      .set({
        name: shiftRow.shiftName.trim(),
        codePrefix: shiftRow.codeprefix?.trim(),
      })
      .where(eq(shiftModel.id, foundShift.id as number))
      .returning();

    return updatedShift;
  }

  return (
    await db
      .insert(shiftModel)
      .values({
        legacyShiftId: oldShiftId,
        name: shiftRow.shiftName.trim(),
        codePrefix: shiftRow.codeprefix?.trim(),
      })
      .returning()
  )[0];
}

export async function addMeritList(oldMeritListId: number | null) {
  if (!oldMeritListId) return null;

  const [[meritListRow]] = (await mysqlConnection.query(
    `SELECT * FROM meritlist WHERE id = ${oldMeritListId}`,
  )) as [OldMeritList[], any];

  if (!meritListRow) return null;

  const [foundMeritList] = await db
    .select()
    .from(meritListModel)
    .where(ilike(meritListModel.name, meritListRow.name.trim()));

  if (foundMeritList) return foundMeritList;

  return (
    await db
      .insert(meritListModel)
      .values({
        legacyMeritListId: oldMeritListId,
        name: meritListRow.name.trim(),
        description: meritListRow.description.trim(),
        checkAuto: meritListRow.checkauto === 1, // Convert 0 or 1 to boolean
      })
      .returning()
  )[0];
}

export async function addBank(oldBankId: number | null) {
  if (!oldBankId) return null;

  const [[bankRow]] = (await mysqlConnection.query(
    `SELECT * FROM adminbank WHERE id = ${oldBankId}`,
  )) as [OldBank[], any];

  if (!bankRow) return null;

  const [foundBank] = await db
    .select()
    .from(bankModel)
    .where(ilike(bankModel.name, bankRow.bankName.trim()));

  if (foundBank) return foundBank;

  return (
    await db
      .insert(bankModel)
      .values({
        legacyBankId: oldBankId,

        name: bankRow.bankName.trim(),
      })
      .returning()
  )[0];
}

export async function addBankBranch(oldBankBranchId: number | null) {
  if (!oldBankBranchId) return null;

  const [[bankBranchRow]] = (await mysqlConnection.query(
    `SELECT * FROM bankbranch WHERE id = ${oldBankBranchId}`,
  )) as [OldBankBranch[], any];

  const bank = await addBank(bankBranchRow?.bankid ?? null);

  if (!bank || !bankBranchRow) return null;

  const [foundBankBranch] = await db
    .select()
    .from(bankBranchModel)
    .where(
      and(
        eq(bankBranchModel.bankId, bank.id!),
        ilike(bankBranchModel.name, bankBranchRow.name.trim()),
      ),
    );

  if (foundBankBranch) return foundBankBranch;

  return (
    await db
      .insert(bankBranchModel)
      .values({
        legacyBankBranchId: oldBankBranchId,
        name: bankBranchRow.name.trim(),
        bankId: bank.id!,
      })
      .returning()
  )[0];
}

// This function is storing the minor subjects selected during admission-application form phas after merit list is generated.
export async function addAdmSubjectPaperSelection(
  cvSubjectSelectionRow: OldCvSubjectSelection,
  studentId: number,
  admissionCourseDetailsId: number,
  paperId: number,
) {
  console.log("cvSubjectSelectionRow", cvSubjectSelectionRow);
  if (!cvSubjectSelectionRow) return null;

  const [foundAdmSbjPprSelection] = await db
    .select()
    .from(admSubjectPaperSelectionModel)
    .where(
      and(
        eq(
          admSubjectPaperSelectionModel.legacyCVSubjectSelectionId,
          cvSubjectSelectionRow.id,
        ),
        eq(admSubjectPaperSelectionModel.studentId, studentId),
        eq(
          admSubjectPaperSelectionModel.admissionCourseDetailsId,
          admissionCourseDetailsId,
        ),
        eq(admSubjectPaperSelectionModel.paperId, paperId),
      ),
    );

  if (foundAdmSbjPprSelection) return foundAdmSbjPprSelection;

  return (
    await db
      .insert(admSubjectPaperSelectionModel)
      .values({
        legacyCVSubjectSelectionId: cvSubjectSelectionRow.id,
        studentId,
        admissionCourseDetailsId,
        paperId,
      })
      .returning()
  )[0];
}

// export async function upsertFamily(oldDetails: OldAdmStudentPersonalDetail | OldStaff, userId?: number, admissionAdditionalInfoId?: number) {
//     const isStaff = (d: OldAdmStudentPersonalDetail | OldStaff): d is OldStaff =>
//         "isTeacher" in d;
//     const isAdmStudent = (
//         d: OldAdmStudentPersonalDetail | OldStaff,
//     ): d is OldAdmStudentPersonalDetail => "applevel" in d;

//     if (!isStaff(oldDetails) && !isAdmStudent(oldDetails)) {
//         throw new Error("Invalid old details type");
//     }

//     if (!isStaff(oldDetails) && !isAdmStudent(oldDetails)) {
//         throw new Error("Invalid old details type");
//     }

//     if (isAdmStudent(oldDetails) && !admissionAdditionalInfoId) {
//         throw new Error("admissionAdditionalInfoId is required for OldAdmStudentPersonalDetail");
//     }
//     if (isStaff(oldDetails) && !userId) {
//         throw new Error("userId is required for OldStaff");
//     }

//     // Check if family already exists for this student - familyModel doesn't have studentId, so we'll skip this check
//     let existingFamily: Family | undefined;
//     if (isAdmStudent(oldDetails)) {
//         existingFamily = (await db
//             .select()
//             .from(familyModel)
//             .where(eq(familyModel.admissionAdditionalInfoId, admissionAdditionalInfoId!))
//         )[0];
//     }
//     else {
//         existingFamily = (await db
//             .select()
//             .from(familyModel)
//             .where(eq(familyModel.userId, userId!))
//         )[0];
//     }

//     let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
//     const singleParent = isStaff(oldDetails) ? null : oldDetails.separated; // Using 'separated' field instead of 'issnglprnt'
//     if (singleParent) {
//         if (singleParent.toLowerCase() === "bth") {
//             parentType = "BOTH";
//         } else if (singleParent.toLowerCase() === "sngl_fthr") {
//             parentType = "FATHER_ONLY";
//         } else if (singleParent.toLowerCase() === "sngl_mthr") {
//             parentType = "MOTHER_ONLY";
//         }
//     }

//     const annualIncome = await categorizeIncome(
//         isStaff(oldDetails) ? null : oldDetails.familyIncome,
//     );

//     if (existingFamily) {
//         const [updatedFamily] = await db
//             .update(familyModel)
//             .set({
//                 annualIncomeId: annualIncome ? annualIncome.id : undefined,
//                 parentType,
//                 // fatherDetailsId: father.id,
//                 // motherDetailsId: mother.id,
//                 // guardianDetailsId: guardian.id,
//             })
//             .where(eq(familyModel.id, existingFamily.id!))
//             .returning();

//         existingFamily = updatedFamily;
//     }
//     else {
//         const [newFamily] = await db
//             .insert(familyModel)
//             .values({
//                 admissionAdditionalInfoId: isAdmStudent(oldDetails) ? admissionAdditionalInfoId : undefined,
//                 userId: isStaff(oldDetails) ? userId : undefined,
//                 annualIncomeId: annualIncome ? annualIncome.id : undefined,
//                 parentType,
//                 // fatherDetailsId: father.id,
//                 // motherDetailsId: mother.id,
//                 // guardianDetailsId: guardian.id,
//             })
//             .returning();

//         existingFamily = newFamily;
//     }

//     // Father details
//     let fatherOccupation: Occupation | undefined;
//     const fatherOccupationId = isStaff(oldDetails)
//         ? null
//         : oldDetails.freeshipfatheroccupation;
//     if (fatherOccupationId) {
//         const [fatherOccupationResult] = (await mysqlConnection.query(
//             `SELECT * FROM parentoccupation WHERE id = ${fatherOccupationId}`,
//         )) as [{ id: number; occupationName: string }[], any];
//         if (fatherOccupationResult.length > 0) {
//             fatherOccupation = await addOccupation(
//                 fatherOccupationResult[0].occupationName,
//                 fatherOccupationId,
//             );
//         }
//     }

//     // Father qualification - not available in OldAdmStudentPersonalDetail
//     let fatherQualificationId: number | undefined = undefined;

//     // Father office address - not available in OldAdmStudentPersonalDetail
//     let fatherOfficeAddress: Address | undefined;
//     let existingFather = (await db
//         .select()
//         .from(personModel)
//         .where(
//             and(
//                 eq(personModel.familyId, existingFamily.id!),
//                 eq(personModel.type, "FATHER")
//             )
//         )
//     )[0];

//     if (existingFather) {
//         const [father] = await db
//             .update(personModel)
//             .set({
//                 title: undefined, // No title data in legacy
//                 name: (isStaff(oldDetails) ? null : oldDetails.fatherName)?.trim(),
//                 email: (isStaff(oldDetails) ? null : oldDetails.fatherEmail)
//                     ?.trim()
//                     .toLowerCase(),
//                 phone: (isStaff(oldDetails) ? null : oldDetails.fmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.fadhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: fatherQualificationId,
//                 occupationId: fatherOccupation ? fatherOccupation.id : undefined,
//                 officeAddressId: fatherOfficeAddress?.id,
//             })
//             .where(eq(personModel.id, existingFather.id!))
//             .returning();
//         existingFather = father;
//     }
//     else {
//         const [father] = await db
//             .insert(personModel)
//             .values({
//                 familyId: existingFamily.id!,
//                 type: "FATHER",
//                 title: undefined, // No title data in legacy
//                 name: (isStaff(oldDetails) ? null : oldDetails.fatherName)?.trim(),
//                 email: (isStaff(oldDetails) ? null : oldDetails.fatherEmail)
//                     ?.trim()
//                     .toLowerCase(),
//                 phone: (isStaff(oldDetails) ? null : oldDetails.fmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.fadhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: fatherQualificationId,
//                 occupationId: fatherOccupation ? fatherOccupation.id : undefined,
//                 officeAddressId: fatherOfficeAddress?.id,
//             })
//             .returning();
//         existingFather = father;
//     }

//     // Mother details
//     let motherOccupation: Occupation | undefined;
//     const motherOccupationId = isStaff(oldDetails)
//         ? null
//         : oldDetails.motherOccupationId;
//     if (motherOccupationId) {
//         const [motherOccupationResult] = (await mysqlConnection.query(
//             `SELECT * FROM parentoccupation WHERE id = ${motherOccupationId}`,
//         )) as [{ id: number; occupationName: string }[], any];
//         if (motherOccupationResult.length > 0) {
//             motherOccupation = await addOccupation(
//                 motherOccupationResult[0].occupationName,
//                 Number(motherOccupationId),
//             );
//         }
//     }

//     // Mother qualification - not available in OldAdmStudentPersonalDetail
//     let motherQualificationId: number | undefined = undefined;

//     // Mother office address - not available in OldAdmStudentPersonalDetail
//     let motherOfficeAddress: Address | undefined;

//     let existingMother = (await db
//         .select()
//         .from(personModel)
//         .where(
//             and(eq(personModel.familyId, existingFamily.id!), eq(personModel.type, "MOTHER"))
//         )
//     )[0];

//     if (existingMother) {
//         const [mother] = await db
//             .update(personModel)
//             .set({
//                 name: (isStaff(oldDetails) ? null : oldDetails.motherName)?.trim(),
//                 email: (isStaff(oldDetails) ? null : oldDetails.motherEmail)
//                     ?.trim()
//                     .toLowerCase(),
//                 phone: (isStaff(oldDetails) ? null : oldDetails.mmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.madhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: motherQualificationId,
//                 occupationId: motherOccupation ? motherOccupation.id : undefined,
//                 officeAddressId: motherOfficeAddress?.id,
//             })
//             .where(eq(personModel.id, existingMother.id!))
//             .returning();

//         existingMother = mother;
//     }
//     else {
//         const [mother] = await db
//             .insert(personModel)
//             .values({
//                 familyId: existingFamily.id!,
//                 type: "MOTHER",
//                 title: undefined, // No title data in legacy
//                 name: (isStaff(oldDetails) ? null : oldDetails.motherName)?.trim(),
//                 email: (isStaff(oldDetails) ? null : oldDetails.motherEmail)
//                     ?.trim()
//                     .toLowerCase(),
//                 phone: (isStaff(oldDetails) ? null : oldDetails.mmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.madhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: motherQualificationId,
//                 occupationId: motherOccupation ? motherOccupation.id : undefined,
//                 officeAddressId: motherOfficeAddress?.id,
//             })
//             .returning();

//         existingMother = mother;
//     }

//     // Guardian details
//     let guardianOccupation: Occupation | undefined;
//     const guardianOccupationId = isStaff(oldDetails)
//         ? null
//         : oldDetails.localguardianoccupation;
//     if (guardianOccupationId) {
//         const [guardianOccupationResult] = (await mysqlConnection.query(
//             `SELECT * FROM parentoccupation WHERE id = ${guardianOccupationId}`,
//         )) as [{ id: number; occupationName: string }[], any];
//         if (guardianOccupationResult.length > 0) {
//             guardianOccupation = await addOccupation(
//                 guardianOccupationResult[0].occupationName,
//                 guardianOccupationId,
//             );
//         }
//     }

//     // Guardian qualification - not available in OldAdmStudentPersonalDetail
//     let guardianQualificationId: number | undefined = undefined;

//     // Guardian office address - use localguardianAddress if available
//     let guardianOfficeAddress: Address | undefined;
//     const guardianOffAddress = isStaff(oldDetails)
//         ? null
//         : oldDetails.localguardianAddress;
//     if (guardianOffAddress) {
//         const [address] = await db
//             .insert(addressModel)
//             .values({
//                 addressLine: guardianOffAddress?.trim(),
//                 localityType: null,
//             })
//             .returning();
//         guardianOfficeAddress = address;
//     }

//     let existingGuardian = (await db
//         .select()
//         .from(personModel)
//         .where(
//             and(eq(personModel.familyId, existingFamily.id!), eq(personModel.type, "GUARDIAN"))
//         )
//     )[0];

//     if (existingGuardian) {
//         const [guardian] = await db
//             .update(personModel)
//             .set({
//                 familyId: existingFamily.id!,
//                 type: "GUARDIAN",
//                 title: undefined, // No title data in legacy
//                 name:
//                     (isStaff(oldDetails) ? null : oldDetails.otherGuardianName)?.trim() ||
//                     "",
//                 email: undefined, // No guardian email in legacy data
//                 phone: (isStaff(oldDetails) ? null : oldDetails.gmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.gadhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: guardianQualificationId,
//                 occupationId: guardianOccupation ? guardianOccupation.id : undefined,
//                 officeAddressId: guardianOfficeAddress
//                     ? guardianOfficeAddress.id
//                     : undefined,
//             })
//             .where(eq(personModel.id, existingGuardian.id!))
//             .returning();

//         existingGuardian = guardian;
//     }
//     else {
//         const [guardian] = await db
//             .insert(personModel)
//             .values({
//                 familyId: existingFamily.id!,
//                 type: "GUARDIAN",
//                 title: undefined, // No title data in legacy
//                 name:
//                     (isStaff(oldDetails) ? null : oldDetails.otherGuardianName)?.trim() ||
//                     "",
//                 email: undefined, // No guardian email in legacy data
//                 phone: (isStaff(oldDetails) ? null : oldDetails.gmobno)?.trim(),
//                 aadhaarCardNumber: formatAadhaarCardNumber(
//                     isStaff(oldDetails) ? undefined : oldDetails.gadhaarcardno || undefined,
//                 ),
//                 image: undefined, // No image data in legacy
//                 gender: undefined, // No gender data for parents in legacy
//                 maritalStatus: undefined, // No marital status data for parents in legacy
//                 qualificationId: guardianQualificationId,
//                 occupationId: guardianOccupation ? guardianOccupation.id : undefined,
//                 officeAddressId: guardianOfficeAddress
//                     ? guardianOfficeAddress.id
//                     : undefined,
//             })
//             .returning();

//         existingGuardian = guardian;
//     }

//     return existingFamily;
// }

async function addHealth(
  details: OldStudent | OldStaff | null | undefined,
): Promise<Health | null> {
  if (!details) {
    console.warn(
      "addHealth(): details is undefined/null; skipping health creation.",
    );
    return null;
  }
  let bloodGroup: BloodGroup | undefined;

  // Resolve blood group if legacy id present
  const legacyBgId = details?.bloodGroup;
  if (legacyBgId) {
    const [bloodGroupResult] = (await mysqlConnection.query(
      `SELECT * FROM bloodgroup WHERE id = ${legacyBgId}`,
    )) as [{ id: number; name: string }[], any];
    if (bloodGroupResult.length > 0) {
      bloodGroup = await addBloodGroup(bloodGroupResult[0].name.trim());
    }
  }

  // Normalize values to match schema types
  const eyeLeftRaw = details?.eyePowerLeft;
  const eyeRightRaw = details?.eyePowerRight;
  const eyeLeft =
    eyeLeftRaw !== undefined && eyeLeftRaw !== null && eyeLeftRaw !== ""
      ? Number(eyeLeftRaw)
      : undefined;
  const eyeRight =
    eyeRightRaw !== undefined && eyeRightRaw !== null && eyeRightRaw !== ""
      ? Number(eyeRightRaw)
      : undefined;

  const heightVal = details?.height;
  const weightVal = details?.weight;

  const height =
    heightVal !== undefined && heightVal !== null
      ? String(heightVal)
      : undefined;
  const weight =
    weightVal !== undefined && weightVal !== null
      ? String(weightVal)
      : undefined;

  const spectaclesNotes = undefined as string | undefined;
  const hasSpectacles = false;

  const [newHealth] = await db
    .insert(healthModel)
    .values({
      bloodGroupId: bloodGroup ? bloodGroup.id : undefined,
      eyePowerLeft: isNaN(eyeLeft as number) ? undefined : eyeLeft,
      eyePowerRight: isNaN(eyeRight as number) ? undefined : eyeRight,
      height,
      weight,
      hasSpectacles,
      spectaclesNotes,
      identificationMark: isOldStudent(details)
        ? details.identificationmark || undefined
        : details.identificationMark || undefined,
    } as Health)
    .returning();

  return newHealth;
}

export async function upsertFamily2(
  oldDetails: OldAdmStudentPersonalDetail | OldStaff,
  userId?: number,
  admissionAdditionalInfoId?: number,
) {
  const isStaff = (d: OldAdmStudentPersonalDetail | OldStaff): d is OldStaff =>
    "isTeacher" in d;
  const isAdmStudent = (
    d: OldAdmStudentPersonalDetail | OldStaff,
  ): d is OldAdmStudentPersonalDetail => "applevel" in d;

  if (!isStaff(oldDetails) && !isAdmStudent(oldDetails)) {
    throw new Error("Invalid old details type");
  }

  if (userId && admissionAdditionalInfoId) {
    throw new Error(
      "userId and admissionAdditionalInfoId cannot be provided together",
    );
  }

  // Map legacy single-parent flag to enum
  let parentType: "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY" | null = null;
  const singleParent = isStaff(oldDetails) ? null : oldDetails.separated; // Using 'separated' field instead of 'issnglprnt'
  if (singleParent) {
    if (singleParent.toLowerCase() === "bth") {
      parentType = "BOTH";
    } else if (singleParent.toLowerCase() === "sngl_fthr") {
      parentType = "FATHER_ONLY";
    } else if (singleParent.toLowerCase() === "sngl_mthr") {
      parentType = "MOTHER_ONLY";
    }
  }

  const annualIncome = await categorizeIncome(
    isStaff(oldDetails) ? null : oldDetails.familyIncome,
  );

  // Prepare insert payload
  const insertValues: Partial<typeof familyModel.$inferInsert> = {
    userId,
    admissionAdditionalInfoId,
    annualIncomeId: annualIncome ? annualIncome.id : undefined,
    parentType,
  };

  let existingFamily: Family | undefined;
  if (userId) {
    existingFamily = (
      await db.select().from(familyModel).where(eq(familyModel.userId, userId))
    )[0];
  } else {
    existingFamily = (
      await db
        .select()
        .from(familyModel)
        .where(
          eq(familyModel.admissionAdditionalInfoId, admissionAdditionalInfoId!),
        )
    )[0];
  }

  if (existingFamily) {
    const [family] = await db
      .update(familyModel)
      .set(insertValues)
      .where(eq(familyModel.id, existingFamily.id!))
      .returning();
    existingFamily = family;
  } else {
    const [family] = await db
      .insert(familyModel)
      .values(insertValues)
      .returning();
    existingFamily = family;
  }

  // Helper to resolve occupation by legacy id
  const resolveOccupation = async (
    legacyOccupationId: number | undefined | null,
  ) => {
    if (!legacyOccupationId) return undefined;
    const [occ] = (await mysqlConnection.query(
      `SELECT * FROM parentoccupation WHERE id = ${legacyOccupationId}`,
    )) as [{ id: number; occupationName: string }[], any];
    if (occ.length === 0) return undefined;
    return await addOccupation(occ[0].occupationName, legacyOccupationId);
  };

  // Generic upsert for a person by type under this family
  const upsertPerson = async (args: {
    type: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER_GUARDIAN" | "SPOUSE";
    name?: string | null;
    email?: string | null;
    aadhaar?: string | null;
    phone?: string | null;
    image?: string | null;
    legacyOccupationId?: number | null;
    officeAddress?: string | null;
    // Address details
    countryId?: number | null;
    stateId?: number | null;
    cityId?: number | null;
    districtId?: number | null;
    postofficeId?: number | null;
    policeStationId?: number | null;
    otherCountry?: string | null;
    otherState?: string | null;
    otherCity?: string | null;
    otherDistrict?: string | null;
    otherPostoffice?: string | null;
    otherPoliceStation?: string | null;
    block?: string | null;
    pincode?: string | null;
    localityType?: "URBAN" | "RURAL" | null;
  }) => {
    const occupation = await resolveOccupation(
      args.legacyOccupationId ?? undefined,
    );

    const values: Partial<typeof personModel.$inferInsert> = {
      type: args.type,
      familyId: existingFamily.id,
      name: args.name?.toUpperCase()?.trim(),
      email: args.email?.trim()?.toLowerCase(),
      aadhaarCardNumber: args.aadhaar
        ? formatAadhaarCardNumber(args.aadhaar)
        : undefined,
      phone: args.phone?.trim() || undefined,
      image: args.image?.trim() || undefined,
      occupationId: occupation ? occupation.id : undefined,
    };

    // Check if any meaningful value exists; if nothing to save, skip
    const hasAny = Object.values(values).some(
      (v) => v !== undefined && v !== null,
    );
    if (!hasAny) return;

    const [existing] = await db
      .select()
      .from(personModel)
      .where(
        and(
          eq(personModel.familyId, existingFamily.id!),
          eq(personModel.type, args.type),
        ),
      );

    let personId: number;
    if (existing) {
      const [updated] = await db
        .update(personModel)
        .set(values)
        .where(eq(personModel.id, existing.id))
        .returning();
      personId = updated.id;
    } else {
      const [newPerson] = await db
        .insert(personModel)
        .values(values)
        .returning();
      personId = newPerson.id;
    }

    // Handle office address upsert
    if (
      args.officeAddress ||
      args.countryId ||
      args.stateId ||
      args.cityId ||
      args.districtId ||
      args.postofficeId ||
      args.policeStationId ||
      args.otherCountry ||
      args.otherState ||
      args.otherCity ||
      args.otherDistrict ||
      args.otherPostoffice ||
      args.otherPoliceStation ||
      args.block ||
      args.pincode ||
      args.localityType
    ) {
      // Check if address already exists for this person
      const [existingAddress] = await db
        .select()
        .from(addressModel)
        .where(eq(addressModel.personId, personId));

      const addressValues: Partial<typeof addressModel.$inferInsert> = {
        personId,
        type: "OFFICE",
        addressLine: args.officeAddress?.trim()?.toUpperCase(),
        countryId: args.countryId,
        stateId: args.stateId,
        cityId: args.cityId,
        districtId: args.districtId,
        postofficeId: args.postofficeId,
        policeStationId: args.policeStationId,
        otherCountry: args.otherCountry?.trim()?.toUpperCase(),
        otherState: args.otherState?.trim()?.toUpperCase(),
        otherCity: args.otherCity?.trim()?.toUpperCase(),
        otherDistrict: args.otherDistrict?.trim()?.toUpperCase(),
        otherPostoffice: args.otherPostoffice?.trim()?.toUpperCase(),
        otherPoliceStation: args.otherPoliceStation?.trim()?.toUpperCase(),
        block: args.block?.trim()?.toUpperCase(),
        pincode: args.pincode?.trim()?.toUpperCase(),
        localityType: args.localityType,
      };

      if (existingAddress) {
        await db
          .update(addressModel)
          .set(addressValues)
          .where(eq(addressModel.id, existingAddress.id));
      } else {
        await db.insert(addressModel).values(addressValues);
      }
    }
  };

  // Father details
  await upsertPerson({
    type: "FATHER",
    name: isStaff(oldDetails) ? null : oldDetails.fatherName,
    email: isStaff(oldDetails) ? null : oldDetails.fatherEmail,
    aadhaar: isStaff(oldDetails)
      ? null
      : oldDetails.fadhaarcardno
        ? formatAadhaarCardNumber(oldDetails.fadhaarcardno)
        : "",
    phone: isStaff(oldDetails) ? null : oldDetails.fmobno,
    image: undefined, // No image data in legacy
    legacyOccupationId: isStaff(oldDetails)
      ? null
      : oldDetails.freeshipfatheroccupation,
    // Father address details from legacy data - resolve IDs using helper functions
    countryId: isStaff(oldDetails)
      ? null
      : oldDetails.countryId
        ? (
            await addCountry({
              id: oldDetails.countryId,
              countryName: "",
            } as OldCountry)
          ).id
        : null,
    stateId: isStaff(oldDetails)
      ? null
      : oldDetails.resiStateId
        ? (
            await addStateByCityMaintabOrLegacyStateId(
              undefined,
              oldDetails.resiStateId,
            )
          )?.id
        : null,
    cityId: isStaff(oldDetails)
      ? null
      : oldDetails.cityId
        ? (await addCity(oldDetails.cityId))?.id
        : null,
    districtId: isStaff(oldDetails)
      ? null
      : oldDetails.resiDistrictId
        ? (await addDistrict(oldDetails.resiDistrictId))?.id
        : null,
    postofficeId: isStaff(oldDetails)
      ? null
      : oldDetails.resipostofficeid
        ? (await addPostOffice(oldDetails.resipostofficeid))?.id
        : null,
    policeStationId: isStaff(oldDetails)
      ? null
      : oldDetails.resipolicestationid
        ? (await addPoliceStation(oldDetails.resipolicestationid))?.id
        : null,
    otherState: isStaff(oldDetails) ? null : oldDetails.otherState,
    otherCity: isStaff(oldDetails) ? null : oldDetails.otherCity,
    otherDistrict: isStaff(oldDetails) ? null : oldDetails.otherresiDistrict,
    otherPostoffice: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipostoffice,
    otherPoliceStation: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipolicestation,
    pincode: isStaff(oldDetails) ? null : oldDetails.resiPinNo,
    officeAddress: isStaff(oldDetails) ? null : oldDetails.famAddress,
  });

  // Mother details
  await upsertPerson({
    type: "MOTHER",
    name: isStaff(oldDetails) ? null : oldDetails.motherName,
    email: isStaff(oldDetails) ? null : oldDetails.motherEmail,
    aadhaar: isStaff(oldDetails)
      ? null
      : oldDetails.madhaarcardno
        ? formatAadhaarCardNumber(oldDetails.madhaarcardno)
        : undefined,
    phone: isStaff(oldDetails) ? null : oldDetails.mmobno,
    image: undefined, // No image data in legacy
    legacyOccupationId: isStaff(oldDetails)
      ? null
      : oldDetails.motherOccupationId
        ? Number(oldDetails.motherOccupationId)
        : null,
    // Mother address details from legacy data - resolve IDs using helper functions
    countryId: isStaff(oldDetails)
      ? null
      : oldDetails.countryId
        ? (
            await addCountry({
              id: oldDetails.countryId,
              countryName: "",
            } as OldCountry)
          ).id
        : null,
    stateId: isStaff(oldDetails)
      ? null
      : oldDetails.resiStateId
        ? (
            await addStateByCityMaintabOrLegacyStateId(
              undefined,
              oldDetails.resiStateId,
            )
          )?.id
        : null,
    cityId: isStaff(oldDetails)
      ? null
      : oldDetails.cityId
        ? (await addCity(oldDetails.cityId))?.id
        : null,
    districtId: isStaff(oldDetails)
      ? null
      : oldDetails.resiDistrictId
        ? (await addDistrict(oldDetails.resiDistrictId))?.id
        : null,
    postofficeId: isStaff(oldDetails)
      ? null
      : oldDetails.resipostofficeid
        ? (await addPostOffice(oldDetails.resipostofficeid))?.id
        : null,
    policeStationId: isStaff(oldDetails)
      ? null
      : oldDetails.resipolicestationid
        ? (await addPoliceStation(oldDetails.resipolicestationid))?.id
        : null,
    otherState: isStaff(oldDetails) ? null : oldDetails.otherState,
    otherCity: isStaff(oldDetails) ? null : oldDetails.otherCity,
    otherDistrict: isStaff(oldDetails) ? null : oldDetails.otherresiDistrict,
    otherPostoffice: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipostoffice,
    otherPoliceStation: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipolicestation,
    pincode: isStaff(oldDetails) ? null : oldDetails.resiPinNo,
    officeAddress: isStaff(oldDetails) ? null : oldDetails.famAddress,
  });

  // Guardian details
  await upsertPerson({
    type: "GUARDIAN",
    name: isStaff(oldDetails) ? null : oldDetails.otherGuardianName,
    email: undefined, // No guardian email in legacy data
    aadhaar: isStaff(oldDetails)
      ? null
      : oldDetails.gadhaarcardno
        ? formatAadhaarCardNumber(oldDetails.gadhaarcardno)
        : undefined,
    phone: isStaff(oldDetails) ? null : oldDetails.gmobno,
    image: undefined, // No image data in legacy
    legacyOccupationId: isStaff(oldDetails)
      ? null
      : oldDetails.localguardianoccupation,
    officeAddress: isStaff(oldDetails) ? null : oldDetails.localguardianAddress,
    // Guardian address details from legacy data - resolve IDs using helper functions
    countryId: isStaff(oldDetails)
      ? null
      : oldDetails.countryId
        ? (
            await addCountry({
              id: oldDetails.countryId,
              countryName: "",
            } as OldCountry)
          ).id
        : null,
    stateId: isStaff(oldDetails)
      ? null
      : oldDetails.localguardianStateId
        ? (
            await addStateByCityMaintabOrLegacyStateId(
              undefined,
              oldDetails.localguardianStateId,
            )
          )?.id
        : null,
    cityId: isStaff(oldDetails)
      ? null
      : oldDetails.cityId
        ? (await addCity(oldDetails.cityId))?.id
        : null,
    districtId: isStaff(oldDetails)
      ? null
      : oldDetails.resiDistrictId
        ? (await addDistrict(oldDetails.resiDistrictId))?.id
        : null,
    postofficeId: isStaff(oldDetails)
      ? null
      : oldDetails.resipostofficeid
        ? (await addPostOffice(oldDetails.resipostofficeid))?.id
        : null,
    policeStationId: isStaff(oldDetails)
      ? null
      : oldDetails.resipolicestationid
        ? (await addPoliceStation(oldDetails.resipolicestationid))?.id
        : null,
    otherState: isStaff(oldDetails) ? null : oldDetails.otherState,
    otherCity: isStaff(oldDetails) ? null : oldDetails.otherCity,
    otherDistrict: isStaff(oldDetails) ? null : oldDetails.otherresiDistrict,
    otherPostoffice: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipostoffice,
    otherPoliceStation: isStaff(oldDetails)
      ? null
      : oldDetails.otherresipolicestation,
    pincode: isStaff(oldDetails) ? null : oldDetails.resiPinNo,
  });

  return existingFamily;
}
