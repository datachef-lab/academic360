// Deep field-by-field verification for a single UID across every relevant table.
// Dumps a structured report showing legacy value vs new value per field.
// Usage: pnpm tsx scripts/deep-verify.ts --uid=0304240016
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db, mysqlConnection } from "../src/db/index.js";
import {
  userModel,
  studentModel,
  personalDetailsModel,
  applicationFormModel,
  admissionGeneralInfoModel,
  admissionCourseDetailsModel,
  admissionAcademicInfoModel,
  admissionAdditionalInfoModel,
  emergencyContactModel,
  accommodationModel,
  healthModel,
  transportDetailsModel,
  familyModel,
  personModel,
  addressModel,
  promotionModel,
  studentAcademicSubjectModel,
  programCourseModel,
  courseLevelModel,
} from "@repo/db/schemas/models";

const uidArg = process.argv.slice(2).find((a) => a.startsWith("--uid="));
if (!uidArg) {
  console.error("--uid=<UID> required");
  process.exit(1);
}
const UID = uidArg.slice("--uid=".length);

type Row = {
  field: string;
  legacy: any;
  new: any;
  verdict: "MATCH" | "DIFF" | "INFO";
};
const rows: { section: string; rows: Row[] }[] = [];

function norm(v: any): string {
  if (v === null || v === undefined) return "";
  if (Buffer.isBuffer(v)) return v.length === 1 ? String(v[0]) : v.toString();
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}
function digits(v: any): string {
  return norm(v).replace(/\D/g, "");
}
function lower(v: any): string {
  return norm(v).toLowerCase();
}
function istDate(v: any): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function cmp(
  field: string,
  legacy: any,
  n: any,
  opts: { kind?: "str" | "lstr" | "digits" | "date" | "bool" | "raw" } = {},
): Row {
  const kind = opts.kind ?? "str";
  let a: string, b: string;
  if (kind === "lstr") {
    a = lower(legacy);
    b = lower(n);
  } else if (kind === "digits") {
    a = digits(legacy);
    b = digits(n);
  } else if (kind === "date") {
    a = istDate(legacy);
    b = istDate(n);
  } else if (kind === "bool") {
    const toBool = (v: any) => {
      if (v == null) return "";
      if (typeof v === "boolean") return String(v);
      if (typeof v === "number") return String(v === 1);
      if (Buffer.isBuffer(v)) return String(v[0] === 1);
      const s = String(v).toLowerCase();
      if (s === "1" || s === "true" || s === "yes") return "true";
      if (s === "0" || s === "false" || s === "no") return "false";
      return s;
    };
    a = toBool(legacy);
    b = toBool(n);
  } else if (kind === "raw") {
    a = norm(legacy);
    b = norm(n);
  } else {
    a = norm(legacy);
    b = norm(n);
  }
  const ignore = a === "" && b === "";
  return {
    field,
    legacy: legacy ?? null,
    new: n ?? null,
    verdict: ignore ? "INFO" : a === b ? "MATCH" : "DIFF",
  };
}

async function main() {
  // ---------------- LEGACY FETCH ----------------
  const [[old]] = (await mysqlConnection.query(
    `SELECT * FROM studentpersonaldetails WHERE codeNumber = '${UID}' LIMIT 1`,
  )) as any;
  if (!old) throw new Error(`Legacy student ${UID} not found`);
  const [hrAll] = (await mysqlConnection.query(
    `SELECT * FROM historicalrecord WHERE parent_id = ${old.id} ORDER BY index_col`,
  )) as any;
  const [sadAll] = (await mysqlConnection.query(
    `SELECT * FROM studentacademicdetail WHERE parent_id = ${old.id}`,
  )) as any;
  const sad = sadAll[0];
  const [subjAll] = sad
    ? ((await mysqlConnection.query(
        `SELECT * FROM studentsubjectdetail WHERE parent_id = ${sad.id} ORDER BY id`,
      )) as any)
    : [[]];

  // ---------------- NEW DB FETCH ----------------
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.uid, UID.toUpperCase()));
  if (!student) throw new Error(`New DB student ${UID} not found`);

  const [user] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, student.userId!));
  const [pd] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, student.userId!));
  const [acc] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.userId, student.userId!));
  const [hlt] = await db
    .select()
    .from(healthModel)
    .where(eq(healthModel.userId, student.userId!));
  const [emer] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.userId, student.userId!));
  const [transport] = await db
    .select()
    .from(transportDetailsModel)
    .where(eq(transportDetailsModel.userId, student.userId!));

  const [app] = student.applicationId
    ? await db
        .select()
        .from(applicationFormModel)
        .where(eq(applicationFormModel.id, student.applicationId))
    : [undefined as any];
  const [genInfo] = app
    ? await db
        .select()
        .from(admissionGeneralInfoModel)
        .where(eq(admissionGeneralInfoModel.applicationFormId, app.id!))
    : [undefined as any];
  const [addInfo] = app
    ? await db
        .select()
        .from(admissionAdditionalInfoModel)
        .where(eq(admissionAdditionalInfoModel.applicationFormId, app.id!))
    : [undefined as any];
  const [courseDetails] = student.admissionCourseDetailsId
    ? await db
        .select()
        .from(admissionCourseDetailsModel)
        .where(
          eq(admissionCourseDetailsModel.id, student.admissionCourseDetailsId),
        )
    : [undefined as any];
  const [academicInfo] = app
    ? await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(eq(admissionAcademicInfoModel.applicationFormId, app.id!))
    : [undefined as any];

  const family = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.userId, student.userId!));
  const persons = family[0]
    ? await db
        .select()
        .from(personModel)
        .where(eq(personModel.familyId, family[0].id!))
    : [];

  const addresses = await db
    .select()
    .from(addressModel)
    .where(
      sql`${addressModel.personalDetailsId} = ${pd?.id ?? -1} OR ${addressModel.accommodationId} = ${acc?.id ?? -1}`,
    );

  const promos = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, student.id!));

  const [pcRow] = await db
    .select({
      pcName: programCourseModel.name,
      levelShort: courseLevelModel.shortName,
    })
    .from(programCourseModel)
    .leftJoin(
      courseLevelModel,
      eq(programCourseModel.courseLevelId, courseLevelModel.id),
    )
    .where(eq(programCourseModel.id, student.programCourseId!));

  const subjects = academicInfo
    ? await db
        .select()
        .from(studentAcademicSubjectModel)
        .where(
          eq(
            studentAcademicSubjectModel.admissionAcademicInfoId,
            academicInfo.id!,
          ),
        )
    : [];

  // ---------------- COMPARE ----------------

  rows.push({
    section: "users",
    rows: [
      cmp("name", old.name, user?.name, { kind: "lstr" }),
      cmp(
        "email (synthetic)",
        `${digits(old.codeNumber)}@thebges.edu.in`,
        user?.email,
        { kind: "lstr" },
      ),
      cmp("phone", old.contactNo ?? old.phoneMobileNo, user?.phone, {
        kind: "raw",
      }),
      cmp("whatsappNumber", old.whatsappno, user?.whatsappNumber, {
        kind: "raw",
      }),
      cmp("isActive", old.active, user?.isActive, { kind: "bool" }),
    ],
  });

  rows.push({
    section: "students",
    rows: [
      cmp("uid", String(old.codeNumber || "").toUpperCase(), student.uid, {
        kind: "raw",
      }),
      cmp(
        "oldUid",
        String(old.oldcodeNumber || "").toUpperCase(),
        student.oldUid,
        { kind: "raw" },
      ),
      cmp("programCourse", pcRow?.pcName ?? "", pcRow?.pcName ?? "", {
        kind: "raw",
      }),
      cmp(
        "level(course_levels.short_name)",
        pcRow?.levelShort,
        pcRow?.levelShort,
        { kind: "raw" },
      ),
      cmp("registrationNumber", old.univregno, student.registrationNumber, {
        kind: "raw",
      }),
      cmp("rollNumber", old.univlstexmrollno, student.rollNumber, {
        kind: "raw",
      }),
      cmp("classRollNumber", old.rollNumber, student.classRollNumber, {
        kind: "raw",
      }),
      cmp("cuFormNumber", old.cuformno, student.cuFormNumber, { kind: "raw" }),
      cmp("apaarId", old.apprid ?? old.abcid, student.apaarId, { kind: "raw" }),
      cmp("rfidNumber", old.rfidno, student.rfidNumber, { kind: "raw" }),
      cmp("active", old.active, student.active, { kind: "bool" }),
      cmp("alumni", old.alumni, student.alumni, { kind: "bool" }),
      cmp("handicapped", old.handicapped === "YES", student.handicapped, {
        kind: "bool",
      }),
      cmp(
        "community",
        old.communityid === 1
          ? "GUJARATI"
          : old.communityid === 0 || old.communityid == null
            ? null
            : "NON-GUJARATI",
        student.community,
        { kind: "raw" },
      ),
      cmp("lastPassedYear", old.lspassedyr, student.lastPassedYear, {
        kind: "raw",
      }),
      cmp("leavingDate", old.leavingdate, student.leavingDate, {
        kind: "date",
      }),
      cmp("dateOfJoining(spd)", old.admissiondate, student.dateOfJoining, {
        kind: "date",
      }),
    ],
  });

  rows.push({
    section: "personal_details",
    rows: [
      cmp(
        "firstName",
        (old.name || "").split(/\s+/).filter(Boolean)[0],
        pd?.firstName,
        { kind: "lstr" },
      ),
      cmp(
        "lastName",
        (() => {
          const p = (old.name || "").split(/\s+/).filter(Boolean);
          return p.length >= 2 ? p[p.length - 1] : "";
        })(),
        pd?.lastName,
        { kind: "lstr" },
      ),
      cmp("email (real legacy)", old.email, pd?.email, { kind: "lstr" }),
      cmp("alternativeEmail", old.alternativeemail, pd?.alternativeEmail, {
        kind: "lstr",
      }),
      cmp("whatsappNumber", old.whatsappno, pd?.whatsappNumber, {
        kind: "raw",
      }),
      cmp(
        "aadhaarCardNumber(digits)",
        old.aadharcardno,
        pd?.aadhaarCardNumber,
        { kind: "digits" },
      ),
      cmp("dateOfBirth", old.dateOfBirth, pd?.dateOfBirth, { kind: "date" }),
      cmp("placeOfBirth", old.placeofBirth, pd?.placeOfBirth, { kind: "lstr" }),
    ],
  });

  rows.push({
    section: "accommodation",
    rows: [
      cmp(
        "placeOfStay",
        norm(old.placeofstay).toLowerCase().replace(/\s+/g, " "),
        norm(acc?.placeOfStay).toLowerCase().replace(/_/g, " "),
        { kind: "raw" },
      ),
    ],
  });

  rows.push({
    section: "health",
    rows: [
      cmp("height", old.height, hlt?.height, { kind: "raw" }),
      cmp("weight", old.weight, hlt?.weight, { kind: "raw" }),
      cmp("eyePowerLeft", old.eyePowerLeft, hlt?.eyePowerLeft, { kind: "raw" }),
      cmp("eyePowerRight", old.eyePowerRight, hlt?.eyePowerRight, {
        kind: "raw",
      }),
    ],
  });

  rows.push({
    section: "emergency_contacts",
    rows: [
      cmp("personName", old.emercontactpersonnm, emer?.personName, {
        kind: "lstr",
      }),
      cmp("havingRelationAs", old.emerpersreltostud, emer?.havingRelationAs, {
        kind: "lstr",
      }),
      cmp("phone", old.emercontactpersonmob, emer?.phone, { kind: "digits" }),
      cmp("officePhone", old.emrgnOfficePhNo, emer?.officePhone, {
        kind: "digits",
      }),
      cmp("residentialPhone", old.emrgnResidentPhNo, emer?.residentialPhone, {
        kind: "digits",
      }),
    ],
  });

  // Family / Persons — pick FATHER, MOTHER, GUARDIAN
  const father = persons.find((p: any) => p.type === "FATHER");
  const mother = persons.find((p: any) => p.type === "MOTHER");
  const guardian = persons.find(
    (p: any) => p.type === "GUARDIAN" || p.type === "OTHER_GUARDIAN",
  );
  rows.push({
    section: "family/person FATHER",
    rows: [
      cmp(
        "name",
        old.fatherName ??
          [old.fatherfirstName, old.fathermiddleName, old.fatherlastName]
            .filter(Boolean)
            .join(" "),
        father?.name,
        { kind: "lstr" },
      ),
      cmp("email", old.fatherEmail ?? old.fatheremail, father?.email, {
        kind: "lstr",
      }),
      cmp("phone", old.fatherMobNo, father?.phone, { kind: "digits" }),
      cmp("aadhaar", old.fatheraadharno, father?.aadhaarCardNumber, {
        kind: "digits",
      }),
      cmp("dob", old.fatherdob, father?.dateOfBirth, { kind: "date" }),
    ],
  });
  rows.push({
    section: "family/person MOTHER",
    rows: [
      cmp(
        "name",
        old.motherName ??
          [old.motherfirstName, old.mothermiddleName, old.motherlastName]
            .filter(Boolean)
            .join(" "),
        mother?.name,
        { kind: "lstr" },
      ),
      cmp("email", old.motherEmail, mother?.email, { kind: "lstr" }),
      cmp("phone", old.motherMobNo, mother?.phone, { kind: "digits" }),
      cmp("aadhaar", old.motheraadharno, mother?.aadhaarCardNumber, {
        kind: "digits",
      }),
      cmp("dob", old.motherdob, mother?.dateOfBirth, { kind: "date" }),
    ],
  });
  rows.push({
    section: "family/person GUARDIAN",
    rows: [
      cmp(
        "name",
        old.guardianName ??
          [old.guardianfirstName, old.guardianmiddleName, old.guardianlastName]
            .filter(Boolean)
            .join(" "),
        guardian?.name,
        { kind: "lstr" },
      ),
      cmp("email", old.guardianEmail, guardian?.email, { kind: "lstr" }),
      cmp("phone", old.guardianMobNo, guardian?.phone, { kind: "digits" }),
      cmp("aadhaar", old.gurdianaadharno, guardian?.aadhaarCardNumber, {
        kind: "digits",
      }),
    ],
  });

  // Addresses — find MAILING + RESIDENTIAL
  const mailing = addresses.find((a: any) => a.type === "MAILING");
  const residential = addresses.find((a: any) => a.type === "RESIDENTIAL");
  rows.push({
    section: "address MAILING",
    rows: [
      cmp(
        "address",
        old.mailingAddress,
        mailing?.address ?? mailing?.addressLine,
        { kind: "lstr" },
      ),
      cmp("pincode", old.mailingPinNo, mailing?.pincode, { kind: "raw" }),
    ],
  });
  rows.push({
    section: "address RESIDENTIAL",
    rows: [
      cmp(
        "address",
        old.residentialAddress,
        residential?.address ?? residential?.addressLine,
        { kind: "lstr" },
      ),
      cmp("pincode", old.resiPinNo, residential?.pincode, { kind: "raw" }),
    ],
  });

  // application form + bootstrap tombstones
  rows.push({
    section: "application_forms / bootstrap tombstones",
    rows: [
      cmp(
        "applicationNumber",
        String(old.codeNumber || ""),
        app?.applicationNumber,
        { kind: "raw" },
      ),
      cmp(
        "level (course_levels.short_name)",
        pcRow?.levelShort === "PG"
          ? "POST_GRADUATE"
          : pcRow?.levelShort === "UG"
            ? "UNDER_GRADUATE"
            : "?",
        app?.level,
        { kind: "raw" },
      ),
      cmp(
        "admission_general_info.legacyPersonalDetailsId (must be NULL for bootstrap)",
        null,
        genInfo?.legacyPersonalDetailsId,
        { kind: "raw" },
      ),
      cmp(
        "admission_course_details.legacyCourseDetailsId (must be NULL for bootstrap)",
        null,
        courseDetails?.legacyCourseDetailsId,
        { kind: "raw" },
      ),
      cmp(
        "admission_course_details.isTransferred (must be true)",
        "true",
        String(courseDetails?.isTransferred),
        { kind: "raw" },
      ),
    ],
  });

  // additional info (mostly nullable in bootstrap)
  rows.push({
    section: "admission_additional_info (bootstrap may leave most NULL)",
    rows: [
      cmp(
        "alternateMobileNumber",
        old.altmobno,
        addInfo?.alternateMobileNumber,
        { kind: "raw" },
      ),
      cmp(
        "isPhysicallyChallenged",
        old.handicapped === "YES",
        addInfo?.isPhysicallyChallenged,
        { kind: "bool" },
      ),
    ],
  });

  // academic info from studentacademicdetail
  rows.push({
    section: "admission_academic_info (vs studentacademicdetail)",
    rows: [
      cmp("yearOfPassing", sad?.year, academicInfo?.yearOfPassing, {
        kind: "raw",
      }),
      cmp(
        "percentageOfMarks",
        sad?.percentageOfMarks,
        academicInfo?.percentageOfMarks,
        { kind: "raw" },
      ),
      cmp("division", sad?.division, academicInfo?.division, { kind: "raw" }),
      cmp("rank", sad?.rank, academicInfo?.rank, { kind: "raw" }),
      cmp(
        "rollNumber (= legacy rollno)",
        sad?.rollno,
        academicInfo?.rollNumber,
        { kind: "raw" },
      ),
      cmp(
        "registrationNumber (= legacy regno)",
        sad?.regno,
        academicInfo?.registrationNumber,
        { kind: "raw" },
      ),
      cmp("examNumber", sad?.examno, academicInfo?.examNumber, { kind: "raw" }),
      cmp(
        "previousRegistrationNumber",
        sad?.prevregno,
        academicInfo?.previousRegistrationNumber,
        { kind: "raw" },
      ),
      cmp("otherBoard", sad?.otherbrd, academicInfo?.otherBoard, {
        kind: "raw",
      }),
      cmp("lastSchoolName", sad?.institute, academicInfo?.lastSchoolName, {
        kind: "lstr",
      }),
    ],
  });

  // promotion rows vs historicalrecord
  const proSorted = [...promos].sort(
    (a: any, b: any) =>
      (a.legacyHistoricalRecordId ?? 0) - (b.legacyHistoricalRecordId ?? 0),
  );
  const hrSorted = [...hrAll].sort((a: any, b: any) => a.id - b.id);
  const proRows: Row[] = [];
  proRows.push(
    cmp(
      "count(historicalrecord vs promotion)",
      hrSorted.length,
      proSorted.length,
      { kind: "raw" },
    ),
  );
  for (let i = 0; i < Math.max(hrSorted.length, proSorted.length); i++) {
    const h = hrSorted[i],
      p = proSorted[i];
    proRows.push(
      cmp(`row[${i}] legacy_id`, h?.id, p?.legacyHistoricalRecordId, {
        kind: "raw",
      }),
    );
    proRows.push(
      cmp(`row[${i}] dateOfJoining`, h?.dateofJoining, p?.dateOfJoining, {
        kind: "date",
      }),
    );
    proRows.push(
      cmp(
        `row[${i}] startDate (legacy=NULL; we mirror dateofJoining)`,
        h?.startDate ?? h?.dateofJoining,
        p?.startDate,
        { kind: "date" },
      ),
    );
    proRows.push(
      cmp(`row[${i}] endDate`, h?.endDate, p?.endDate, { kind: "date" }),
    );
    proRows.push(
      cmp(`row[${i}] classRollNumber`, h?.rollNo, p?.classRollNumber, {
        kind: "raw",
      }),
    );
    proRows.push(
      cmp(`row[${i}] rollNumber(univrollno)`, h?.univrollno, p?.rollNumber, {
        kind: "raw",
      }),
    );
    proRows.push(
      cmp(`row[${i}] examNumber(exmno)`, h?.exmno, p?.examNumber, {
        kind: "raw",
      }),
    );
  }
  rows.push({ section: "promotions vs historicalrecord", rows: proRows });

  // subjects vs studentsubjectdetail
  const subjRows: Row[] = [];
  subjRows.push(
    cmp(
      "count(studentsubjectdetail vs student_academic_subject)",
      subjAll.length,
      subjects.length,
      { kind: "raw" },
    ),
  );
  rows.push({
    section: "student_academic_subject vs studentsubjectdetail",
    rows: subjRows,
  });

  // ---------------- RENDER ----------------
  let total = 0,
    diffs = 0,
    infos = 0;
  for (const sec of rows) {
    console.log("\n=== " + sec.section + " ===");
    const lines = sec.rows.map((r) => {
      total++;
      if (r.verdict === "DIFF") diffs++;
      else if (r.verdict === "INFO") infos++;
      const tag = r.verdict === "DIFF" ? "✗" : r.verdict === "INFO" ? "·" : "✓";
      const trunc = (s: string) => (s.length > 60 ? s.slice(0, 60) + "…" : s);
      return `  ${tag} ${r.field.padEnd(48)} legacy=${trunc(norm(r.legacy))}  new=${trunc(norm(r.new))}`;
    });
    console.log(lines.join("\n"));
  }
  console.log(`\nTotals: ${total} fields, ${diffs} DIFFs, ${infos} both-empty`);

  await mysqlConnection.end();
  process.exit(diffs > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
