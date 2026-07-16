// Field-by-field verification of imported legacy students.
// For each UID, fetch the OldStudent (legacy MySQL) and the new-DB rows
// (users, students, personal_details, address, family/person, emergency_contacts,
//  health, accommodation, application_forms, admission_general_info,
//  admission_course_details, promotion, admission_academic_info, student_academic_subject)
// and emit one CSV row per mismatched field.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, mysqlConnection } from "../src/db/index.js";
import {
  userModel,
  studentModel,
  personalDetailsModel,
  applicationFormModel,
  admissionGeneralInfoModel,
  admissionCourseDetailsModel,
  promotionModel,
  emergencyContactModel,
  accommodationModel,
  healthModel,
  admissionAcademicInfoModel,
} from "@repo/db/schemas/models";

type Severity = "ERROR" | "WARN" | "INFO";

type Row = {
  uid: string;
  expectedPath: string;
  actualPath: string;
  severity: Severity;
  newTable: string;
  newColumn: string;
  newValue: string;
  legacyTable: string;
  legacyColumn: string;
  legacyValue: string;
  note: string;
};

const out: Row[] = [];

function normStr(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function normLower(v: any): string {
  return normStr(v).toLowerCase();
}
function bitToBool(v: any): boolean | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (Buffer.isBuffer(v)) return v[0] === 1;
  if (typeof v === "string") {
    if (v === "1" || v.toLowerCase() === "true") return true;
    if (v === "0" || v.toLowerCase() === "false") return false;
  }
  return null;
}

function addMismatch(args: {
  uid: string;
  expectedPath: string;
  actualPath: string;
  severity: Severity;
  newTable: string;
  newColumn: string;
  newValue: any;
  legacyTable: string;
  legacyColumn: string;
  legacyValue: any;
  note?: string;
}) {
  out.push({
    uid: args.uid,
    expectedPath: args.expectedPath,
    actualPath: args.actualPath,
    severity: args.severity,
    newTable: args.newTable,
    newColumn: args.newColumn,
    newValue: normStr(args.newValue),
    legacyTable: args.legacyTable,
    legacyColumn: args.legacyColumn,
    legacyValue: normStr(args.legacyValue),
    note: args.note ?? "",
  });
}

function cmpStr(args: {
  uid: string;
  expectedPath: string;
  actualPath: string;
  severity: Severity;
  newTable: string;
  newColumn: string;
  newValue: any;
  legacyTable: string;
  legacyColumn: string;
  legacyValue: any;
  caseInsensitive?: boolean;
  ignoreNullVsEmpty?: boolean;
}) {
  const a = args.caseInsensitive
    ? normLower(args.newValue)
    : normStr(args.newValue);
  const b = args.caseInsensitive
    ? normLower(args.legacyValue)
    : normStr(args.legacyValue);
  if (a === b) return;
  if (args.ignoreNullVsEmpty && a === "" && b === "") return;
  addMismatch(args);
}

function cmpBool(args: {
  uid: string;
  expectedPath: string;
  actualPath: string;
  severity: Severity;
  newTable: string;
  newColumn: string;
  newValue: any;
  legacyTable: string;
  legacyColumn: string;
  legacyValue: any;
}) {
  const a = !!args.newValue;
  const b = bitToBool(args.legacyValue);
  if (b == null) return; // legacy unknown -> skip
  if (a === b) return;
  addMismatch(args);
}

// Legacy datetime columns store IST midnight as "YYYY-MM-DD 18:30:00 UTC".
// Compare both sides as Asia/Kolkata calendar dates.
const ISTfmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function asISTDate(v: any): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "";
  return ISTfmt.format(d); // already YYYY-MM-DD
}
function cmpDate(args: {
  uid: string;
  expectedPath: string;
  actualPath: string;
  severity: Severity;
  newTable: string;
  newColumn: string;
  newValue: any;
  legacyTable: string;
  legacyColumn: string;
  legacyValue: any;
}) {
  const a = asISTDate(args.newValue);
  const b = asISTDate(args.legacyValue);
  if (a === b) return;
  addMismatch({ ...args, newValue: a, legacyValue: b });
}

async function verifyOne(
  uid: string,
  expected: {
    expectedPath: "happy" | "bootstrap";
    legacyStudentId: number;
    courseName: string;
    className: string;
    sessionId: number;
  },
) {
  // Fetch legacy student
  const [oldRows] = (await mysqlConnection.query(
    `SELECT * FROM studentpersonaldetails WHERE codeNumber = '${uid}' LIMIT 1`,
  )) as any;
  const old = oldRows?.[0];
  if (!old) {
    addMismatch({
      uid,
      expectedPath: expected.expectedPath,
      actualPath: "",
      severity: "ERROR",
      newTable: "(any)",
      newColumn: "(any)",
      newValue: "",
      legacyTable: "studentpersonaldetails",
      legacyColumn: "codeNumber",
      legacyValue: uid,
      note: "legacy row missing",
    });
    return;
  }

  // Fetch new student
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.uid, uid.toUpperCase()));
  if (!student) {
    addMismatch({
      uid,
      expectedPath: expected.expectedPath,
      actualPath: "",
      severity: "ERROR",
      newTable: "students",
      newColumn: "uid",
      newValue: "",
      legacyTable: "studentpersonaldetails",
      legacyColumn: "codeNumber",
      legacyValue: uid,
      note: "new students row missing",
    });
    return;
  }

  const [user] = await db
    .select()
    .from(userModel)
    .where(eq(userModel.id, student.userId!));
  const [pd] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, student.userId!));
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
  const [courseDetails] = student.admissionCourseDetailsId
    ? await db
        .select()
        .from(admissionCourseDetailsModel)
        .where(
          eq(admissionCourseDetailsModel.id, student.admissionCourseDetailsId),
        )
    : [undefined as any];

  // Decide actual path: bootstrap iff courseDetails.legacyCourseDetailsId IS NULL && isTransferred
  const actualPath =
    courseDetails &&
    courseDetails.legacyCourseDetailsId == null &&
    courseDetails.isTransferred
      ? "bootstrap"
      : "happy";

  const ep = expected.expectedPath;
  if (ep !== actualPath) {
    addMismatch({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "admission_course_details",
      newColumn: "legacyCourseDetailsId/isTransferred",
      newValue: `legacy=${courseDetails?.legacyCourseDetailsId} transferred=${courseDetails?.isTransferred}`,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "admissionid",
      legacyValue: old.admissionid,
      note: "path differs from expectation",
    });
  }

  // ---------- users ----------
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "users",
    newColumn: "name",
    newValue: user?.name,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "name",
    legacyValue: old.name,
    caseInsensitive: true,
  });
  // users.email is INTENTIONALLY synthetic for STUDENT type (UID@thebges.edu.in) per upsertUser:553.
  // Real email lives on personal_details.email — checked below.
  const syntheticEmail =
    `${String(old.codeNumber || "").replace(/[\s\-\/]/g, "")}@thebges.edu.in`.toLowerCase();
  if (normLower(user?.email) !== syntheticEmail) {
    addMismatch({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "ERROR",
      newTable: "users",
      newColumn: "email",
      newValue: user?.email,
      legacyTable: "(derived)",
      legacyColumn: "codeNumber@thebges.edu.in",
      legacyValue: syntheticEmail,
    });
  }
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "users",
    newColumn: "whatsappNumber",
    newValue: user?.whatsappNumber,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "whatsappno",
    legacyValue: old.whatsappno,
  });

  // ---------- students ----------
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "ERROR",
    newTable: "students",
    newColumn: "uid",
    newValue: student.uid,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "codeNumber",
    legacyValue: String(old.codeNumber || "").toUpperCase(),
  });
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "oldUid",
    newValue: student.oldUid,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "oldcodeNumber",
    legacyValue: String(old.oldcodeNumber || "").toUpperCase(),
  });
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "registrationNumber",
    newValue: student.registrationNumber,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "univregno",
    legacyValue: old.univregno,
  });
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "rollNumber",
    newValue: student.rollNumber,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "univlstexmrollno",
    legacyValue: old.univlstexmrollno,
  });
  cmpStr({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "cuFormNumber",
    newValue: student.cuFormNumber,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "cuformno",
    legacyValue: old.cuformno,
  });
  cmpBool({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "active",
    newValue: student.active,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "active",
    legacyValue: old.active,
  });
  cmpBool({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "alumni",
    newValue: student.alumni,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "alumni",
    legacyValue: old.alumni,
  });
  cmpDate({
    uid,
    expectedPath: ep,
    actualPath,
    severity: "WARN",
    newTable: "students",
    newColumn: "leavingDate",
    newValue: student.leavingDate,
    legacyTable: "studentpersonaldetails",
    legacyColumn: "leavingdate",
    legacyValue: old.leavingdate,
  });

  // ---------- personal_details ----------
  if (pd) {
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "INFO",
      newTable: "personal_details",
      newColumn: "firstName",
      newValue: pd.firstName,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "name(first)",
      legacyValue: (old.name || "").split(" ")[0] || "",
      caseInsensitive: true,
    });
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "INFO",
      newTable: "personal_details",
      newColumn: "lastName",
      newValue: pd.lastName,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "name(last)",
      legacyValue: (() => {
        const parts = (old.name || "").split(" ").filter(Boolean);
        return parts.length >= 2 ? parts[parts.length - 1] : "";
      })(),
      caseInsensitive: true,
    });
    // The real legacy email is preserved in personal_details.email.
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "ERROR",
      newTable: "personal_details",
      newColumn: "email",
      newValue: pd.email,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "email",
      legacyValue: old.email,
      caseInsensitive: true,
    });
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "personal_details",
      newColumn: "alternativeEmail",
      newValue: pd.alternativeEmail,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "alternativeemail",
      legacyValue: old.alternativeemail,
      caseInsensitive: true,
    });
    // Aadhaar is digits-only in legacy; new DB may format with separators. Compare as digit-stripped.
    const newAadhaar = String(pd.aadhaarCardNumber ?? "").replace(/\D/g, "");
    const oldAadhaar = String(old.aadharcardno ?? "").replace(/\D/g, "");
    if (newAadhaar !== oldAadhaar) {
      addMismatch({
        uid,
        expectedPath: ep,
        actualPath,
        severity: "WARN",
        newTable: "personal_details",
        newColumn: "aadhaarCardNumber(digits)",
        newValue: newAadhaar,
        legacyTable: "studentpersonaldetails",
        legacyColumn: "aadharcardno(digits)",
        legacyValue: oldAadhaar,
      });
    }
    cmpDate({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "personal_details",
      newColumn: "dateOfBirth",
      newValue: pd.dateOfBirth,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "dateOfBirth",
      legacyValue: old.dateOfBirth,
    });
  } else {
    addMismatch({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "personal_details",
      newColumn: "(row)",
      newValue: "missing",
      legacyTable: "studentpersonaldetails",
      legacyColumn: "(any)",
      legacyValue: "present",
      note: "no personal_details row for user",
    });
  }

  // ---------- emergency_contacts ----------
  const [emer] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.userId, student.userId!));
  if (emer) {
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "INFO",
      newTable: "emergency_contacts",
      newColumn: "personName",
      newValue: emer.personName,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "emercontactpersonnm",
      legacyValue: old.emercontactpersonnm,
      caseInsensitive: true,
    });
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "emergency_contacts",
      newColumn: "phone",
      newValue: emer.phone,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "emercontactpersonmob",
      legacyValue: old.emercontactpersonmob,
    });
  }

  // ---------- accommodation ----------
  const [acc] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.userId, student.userId!));
  if (acc && old.placeofstay) {
    // Loader maps display labels ("Paying Guest") to enum keys ("PAYING_GUEST"); normalize for compare.
    const newPos = normLower(acc.placeOfStay).replace(/_/g, " ");
    const oldPos = normLower(old.placeofstay);
    if (newPos !== oldPos) {
      addMismatch({
        uid,
        expectedPath: ep,
        actualPath,
        severity: "INFO",
        newTable: "accommodation",
        newColumn: "placeOfStay(normalised)",
        newValue: newPos,
        legacyTable: "studentpersonaldetails",
        legacyColumn: "placeofstay(normalised)",
        legacyValue: oldPos,
      });
    }
  }

  // ---------- health ----------
  const [hlt] = await db
    .select()
    .from(healthModel)
    .where(eq(healthModel.userId, student.userId!));
  if (hlt) {
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "INFO",
      newTable: "health",
      newColumn: "height",
      newValue: hlt.height,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "height",
      legacyValue: old.height,
    });
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "INFO",
      newTable: "health",
      newColumn: "weight",
      newValue: hlt.weight,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "weight",
      legacyValue: old.weight,
    });
  }

  // ---------- application_forms / general_info / course_details (path-aware) ----------
  if (!app) {
    addMismatch({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "ERROR",
      newTable: "application_forms",
      newColumn: "(row)",
      newValue: "missing",
      legacyTable: "studentpersonaldetails",
      legacyColumn: "(any)",
      legacyValue: "present",
      note: "no applicationForm linked to student",
    });
  } else {
    cmpStr({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "application_forms",
      newColumn: "applicationNumber",
      newValue: app.applicationNumber,
      legacyTable: "studentpersonaldetails",
      legacyColumn: "codeNumber",
      legacyValue:
        actualPath === "bootstrap" ? old.codeNumber : "(coursedetails-derived)",
      note:
        actualPath === "happy"
          ? "happy-path applicationNumber not strictly UID; skip"
          : "",
    });
    // R1 check: bootstrap level should match course_levels.short_name of the linked programCourse.
    if (actualPath === "bootstrap" && student.programCourseId) {
      const [pcRow] = (await mysqlConnection.query(`SELECT 1`)) as any;
      void pcRow; // placeholder to silence unused
      // Resolve via new DB programCourse -> course_levels.shortName
      const { programCourseModel, courseLevelModel } =
        await import("@repo/db/schemas/models");
      const [{ shortName: clShort } = { shortName: undefined as any }] =
        await db
          .select({ shortName: courseLevelModel.shortName })
          .from(programCourseModel)
          .leftJoin(
            courseLevelModel,
            eq(programCourseModel.courseLevelId, courseLevelModel.id),
          )
          .where(eq(programCourseModel.id, student.programCourseId));
      const expectedLevel =
        normStr(clShort).toUpperCase() === "PG"
          ? "POST_GRADUATE"
          : normStr(clShort).toUpperCase() === "UG"
            ? "UNDER_GRADUATE"
            : "(unknown)";
      cmpStr({
        uid,
        expectedPath: ep,
        actualPath,
        severity: "ERROR",
        newTable: "application_forms",
        newColumn: "level",
        newValue: app.level,
        legacyTable: "course_levels(via programCourse)",
        legacyColumn: "short_name",
        legacyValue: expectedLevel,
      });
    }
  }

  if (app && genInfo) {
    if (actualPath === "bootstrap") {
      if (genInfo.legacyPersonalDetailsId != null) {
        addMismatch({
          uid,
          expectedPath: ep,
          actualPath,
          severity: "ERROR",
          newTable: "admission_general_info",
          newColumn: "legacyPersonalDetailsId",
          newValue: genInfo.legacyPersonalDetailsId,
          legacyTable: "(none)",
          legacyColumn: "(none)",
          legacyValue: "NULL expected for bootstrap",
          note: "bootstrap tombstone violated",
        });
      }
    }
  }

  if (courseDetails) {
    if (actualPath === "bootstrap") {
      if (
        courseDetails.legacyCourseDetailsId != null ||
        !courseDetails.isTransferred
      ) {
        addMismatch({
          uid,
          expectedPath: ep,
          actualPath,
          severity: "ERROR",
          newTable: "admission_course_details",
          newColumn: "tombstone",
          newValue: `legacy=${courseDetails.legacyCourseDetailsId} transferred=${courseDetails.isTransferred}`,
          legacyTable: "(none)",
          legacyColumn: "(none)",
          legacyValue: "legacy=null transferred=true expected",
          note: "bootstrap tombstone violated",
        });
      }
    }
  }

  // ---------- promotion vs historicalrecord ----------
  const [hrCountRows] = (await mysqlConnection.query(
    `SELECT COUNT(*) AS n FROM historicalrecord WHERE parent_id = ${old.id}`,
  )) as any;
  const hrCount = Number(hrCountRows?.[0]?.n ?? 0);
  const promoRows = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, student.id!));
  if (hrCount !== promoRows.length) {
    addMismatch({
      uid,
      expectedPath: ep,
      actualPath,
      severity: "WARN",
      newTable: "promotion",
      newColumn: "(count)",
      newValue: String(promoRows.length),
      legacyTable: "historicalrecord",
      legacyColumn: "(count for parent_id)",
      legacyValue: String(hrCount),
      note: "promotion row count differs from historicalrecord count",
    });
  }

  // ---------- admission_academic_info / student_academic_subject ----------
  const [sadRows] = (await mysqlConnection.query(
    `SELECT * FROM studentacademicdetail WHERE parent_id = ${old.id} LIMIT 1`,
  )) as any;
  if (sadRows?.[0]) {
    const sad = sadRows[0];
    if (app) {
      const [acad] = await db
        .select()
        .from(admissionAcademicInfoModel)
        .where(eq(admissionAcademicInfoModel.applicationFormId, app.id!));
      if (!acad) {
        addMismatch({
          uid,
          expectedPath: ep,
          actualPath,
          severity: "WARN",
          newTable: "admission_academic_info",
          newColumn: "(row)",
          newValue: "missing",
          legacyTable: "studentacademicdetail",
          legacyColumn: "(any)",
          legacyValue: "present",
          note: "expected academic info row",
        });
      } else {
        cmpStr({
          uid,
          expectedPath: ep,
          actualPath,
          severity: "INFO",
          newTable: "admission_academic_info",
          newColumn: "rollNumber",
          newValue: acad.rollNumber,
          legacyTable: "studentacademicdetail",
          legacyColumn: "rollno",
          legacyValue: sad.rollno,
        });
        cmpStr({
          uid,
          expectedPath: ep,
          actualPath,
          severity: "INFO",
          newTable: "admission_academic_info",
          newColumn: "registrationNumber",
          newValue: acad.registrationNumber,
          legacyTable: "studentacademicdetail",
          legacyColumn: "regno",
          legacyValue: sad.regno,
        });
      }
    }
  }
}

async function main() {
  const fileArg = process.argv.slice(2).find((a) => a.startsWith("--file="));
  const expectPath = fileArg
    ? join(process.cwd(), "excel-data", fileArg.slice("--file=".length))
    : join(
        process.cwd(),
        "excel-data",
        "import-test-2023-2024-expectations.json",
      );
  const expectations = JSON.parse(readFileSync(expectPath, "utf8")) as Record<
    string,
    any
  >;
  console.log(`Expectations: ${expectPath}`);

  const onlyArg = process.argv.slice(2).find((a) => a.startsWith("--uids="));
  let uids = Object.keys(expectations);
  if (onlyArg) {
    const wanted = new Set(
      onlyArg
        .slice("--uids=".length)
        .split(",")
        .map((s) => s.trim()),
    );
    uids = uids.filter((u) => wanted.has(u));
  }
  console.log(`Verifying ${uids.length} UIDs ...`);

  for (const uid of uids) {
    try {
      await verifyOne(uid, expectations[uid]);
    } catch (e: any) {
      addMismatch({
        uid,
        expectedPath: expectations[uid]?.expectedPath ?? "?",
        actualPath: "",
        severity: "ERROR",
        newTable: "(any)",
        newColumn: "(any)",
        newValue: "",
        legacyTable: "(any)",
        legacyColumn: "(any)",
        legacyValue: "",
        note: `verify threw: ${e?.message || e}`,
      });
    }
  }

  const csvHeader =
    "uid,expectedPath,actualPath,severity,newTable,newColumn,newValue,legacyTable,legacyColumn,legacyValue,note\n";
  const esc = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const csv =
    csvHeader +
    out
      .map((r) =>
        [
          r.uid,
          r.expectedPath,
          r.actualPath,
          r.severity,
          r.newTable,
          r.newColumn,
          r.newValue,
          r.legacyTable,
          r.legacyColumn,
          r.legacyValue,
          r.note,
        ]
          .map(esc)
          .join(","),
      )
      .join("\n");
  const outPath = join(process.cwd(), "excel-data", "verify-mismatches.csv");
  writeFileSync(outPath, csv);

  const errors = out.filter((r) => r.severity === "ERROR").length;
  const warns = out.filter((r) => r.severity === "WARN").length;
  const infos = out.filter((r) => r.severity === "INFO").length;
  console.log(`Wrote: ${outPath}`);
  console.log(`Summary -> ERROR=${errors} WARN=${warns} INFO=${infos}`);

  await mysqlConnection.end();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
