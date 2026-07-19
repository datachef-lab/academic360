import { db, mysqlConnection } from "@/db";
import { withAdvisoryXactLock } from "@/utils/db-concurrency.js";
import {
  LegacyFeeHead,
  LegacyFeeStructureRow,
  LegacyReceiptType,
  LegacyStudentFeeMappingRow,
} from "@/types/fees";
import ExcelJS from "exceljs";
import {
  academicYearModel,
  AcademicYearT,
  classModel,
  ClassT,
  feeCategoryModel,
  feeGroupModel,
  feeGroupPromotionMappingModel,
  FeeGroupPromotionMappingT,
  feeHeadModel,
  FeeHeadT,
  feeSlabModel,
  feeStructureComponentModel,
  FeeStructureComponentT,
  feeStructureModel,
  FeeStructureT,
  feeStudentMappingModel,
  FeeStudentMappingT,
  feeStudentReceiptNumberModel,
  paymentModel,
  programCourseModel,
  ProgramCourseT,
  receiptTypeModel,
  ReceiptTypeT,
  sectionModel,
  SectionT,
  sessionModel,
  SessionT,
  shiftModel,
  ShiftT,
  studentModel,
  userModel,
  UserT,
} from "@repo/db/schemas";
import { and, count, eq, ilike, isNotNull, ne } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import { updateFeeGroupPromotionMapping } from "./fee-group-promotion-mapping.service";
import {
  ensureDefaultFeeStudentMappingsForFeeStructure,
  calculateTotalPayableForFeeStudentMapping,
} from "./fee-structure.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

type MasterDataType = {
  feeHeads: FeeHeadT[];
  receiptTypes: ReceiptTypeT[];
  academicYears: AcademicYearT[];
  sessions: SessionT[];
  classes: ClassT[];
  sections: SectionT[];
  shifts: ShiftT[];
};
interface ErrorRow extends LegacyStudentFeeMappingRow {
  errorMessage: string;
}
let errorArr: ErrorRow[] = [];

// The legacy student-fees query. Shared by the full batch load and the per-uid
// load; pass byUid=true to filter to a single student (bind the uid as the only
// query parameter).
function buildLegacyFeesQuery(uid?: string | null): string {
  // NOTE: a `?` placeholder cannot be used here — several column aliases contain
  // literal '?' (e.g. 'Is Active?', 'Has Fees Paid?'), which mysql2 would mistake
  // for bind placeholders. uids are alphanumeric codeNumbers, so inline a
  // sanitized value instead.
  const uidClause = uid
    ? ` AND spd.codeNumber = '${String(uid).replace(/[^a-zA-Z0-9]/g, "")}'`
    : "";
  return `
        SELECT
            -- Installment Id
            inst.id AS installment_id,

            -- Student Details
            spd.name AS Student,
            spd.codeNumber AS Uid,
            CASE WHEN COALESCE(spd.active + 0, false) = true THEN 'Yes' ELSE 'No' END AS 'Is Active?',

            -- Batch Details
            CONCAT(SUBSTRING(sess.sessionName, 1, 4),'-', RIGHT(sess.sessionName, 2)) AS 'Academic Year',
            crs.courseName AS 'Course',
            cl.classname AS 'Semester',
            sh.shiftName AS 'Shift',
            COALESCE(sec.sectionName, '') AS 'Section',

            -- Installment Summary
            inst.amount AS 'Installment Total Amount To Pay',
            inst.amtwords AS 'Amount In Words',
            COALESCE(fh.name, '') AS 'Fee Head (or Component)',
            COALESCE(inst_sub.fees, '') AS 'Installment Fee Head (or Component) Amount To Pay',
            CASE WHEN inst.feespaid = true THEN 'Yes' ELSE 'No' END AS 'Has Fees Paid?',
            frm_sfpm.name AS 'College Payment Mode',
            CASE WHEN frm.paidAtCounter = true THEN 'Yes' ELSE 'No' END AS 'Is Paid At Counter?',
            COALESCE(inst.feespaydt, '') AS 'Fees Paid Timestamp',
            COALESCE(frm.challanno, '') AS 'Challan Number',
            COALESCE(frm.date, '') AS 'Fee Receipt Entry Created At',
            COALESCE(p.id, '') AS 'Online Payment Order Id',
            COALESCE(p.dt, '') AS 'Online Payment Initiated Timestamp',
            COALESCE(p.status, '') AS 'Online Payment Status',
            COALESCE(p.banknm, '') AS 'Bank Name',
            COALESCE(p.onlinerefno, '') AS 'Online Payment Reference Number',
            COALESCE(p.onlinemsg, '') AS 'Online Payment Message',
            COALESCE(p.onlinestatusmsg, '') AS 'Online Payment Status Message',
            CASE WHEN frm.advPayement = true THEN 'Yes' ELSE 'No' END AS 'Is Advance Payment?',
            CASE WHEN frm.cancelled = true THEN 'Yes' ELSE 'No' END AS 'Is Cancelled?',



            -- Fee Structure Meta
            COALESCE(rt.spltype, '') AS Context,
            COALESCE(rt.name, '') AS 'Receipt Type',
            COALESCE(fq.name, '') AS 'Fees Quarter',
            COALESCE(fsm.installmentNo, '') AS 'Installment Number',
            COALESCE(ft.name, '') AS 'Fees Type',
            COALESCE(fsb_total.total_configured, 0) AS 'Total Amount Configured (in Fee Structure)',
            -- Fee Structure-Components Details
            COALESCE(fsb.installmenttypename, '') AS 'Installment Type Name',
            COALESCE(fsb.specialtypename, '') AS 'Variant',
            COALESCE(fsb.instamount, '') AS 'Amount Configured (For Fee Head / Component)',
            COALESCE(fsb.concession, '') AS 'Is Concession Applicable For the Fee Head (or Component)?',
            COALESCE(csm.name, '') AS 'Fee Slab',
            COALESCE(csm_sub.amount, '') AS 'Concessional Amount (For Fee Head) Approved',
            COALESCE(fsm.closingdate, '') AS 'Installment Closing Date',
            COALESCE(fsm.lastdate, '') AS 'Installment Last Date',
            COALESCE(CONCAT(SUBSTRING(adv_sess.sessionName, 1, 4),'-', RIGHT(adv_sess.sessionName, 2)), '') AS 'Advance For Session',
            COALESCE(adv_course.courseName, '') AS 'Advance For Course',
            COALESCE(adv_cl.classname, '') AS 'Advance For Class',
            COALESCE(fsm.instfromdt, '') AS 'Installment Start Date',
            COALESCE(fsm.insttodt, '') AS 'Installment End Date',
            COALESCE(fsm.lastonlinedate, '')  AS 'Online Payment Start Date',
            COALESCE(fsm.lastonlinedateto, '')  AS 'Online Payment End Date',

            -- Legacy Ids
            spd.id AS legacyStudentId,
            ay.id AS legacyAcademicYearId,
            sess.id AS legacySessionId,
            crs.id AS legacyCourseId,
            cl.id AS legacySemesterId,
            sh.id AS legacyShiftId,
            sec.id AS legacySectionId,
            fh.id AS legacyFeeHeadId,
            frm_sfpm.id AS legacyCollegeFeesModeId,
            fsm.id AS legacyFeeStructureId,
            fsb.id AS legacyFeeStructureSubId,
            rt.id AS legacyReceiptTypeId,
            adv_sess.id AS legacyAdvanceSessionId,
            adv_course.id AS legacyAdvanceCourseId,
            adv_cl.id AS legacyAdvanceClassId


        FROM studentinstlmain inst
        -- Join with the student details
        LEFT JOIN studentpersonaldetails spd ON spd.id = inst.stdid

        -- The fee-structure an installment belongs to, taken DIRECTLY from the
        -- installment. Batch details (session/course/class/shift) are then read
        -- off the fee structure itself.
        --
        -- Previously the batch came from historicalrecord and the fee structure
        -- was joined against it. historicalrecord has one row per semester and
        -- nothing correlated it to the installment, so every installment was
        -- multiplied by EVERY semester (a cross join): one real row plus N-1
        -- phantom rows whose fee structure was NULL. Those phantoms became
        -- bogus 'fee structure not found' errors and corrupted the paid flag /
        -- challan (both read off the first row of a group). Anchoring on
        -- inst.structid yields exactly one row per installment, and it works for
        -- shift-change students (the structure carries its own shift).
        LEFT JOIN feesstructuremaintab fsm ON fsm.id = inst.structid
        LEFT JOIN currentsessionmaster sess ON sess.id = fsm.sessionid
        LEFT JOIN course crs ON crs.id = fsm.courseId
        LEFT JOIN classes cl ON cl.id = fsm.classId
        LEFT JOIN shift sh ON sh.id = fsm.shiftId
        LEFT JOIN accademicyear ay ON ay.sessionId = sess.id

        -- Section comes from the student's historicalrecord row for exactly the
        -- batch this fee structure belongs to. Correlating on all four batch
        -- columns keeps this 1:1 with the installment (no cross join).
        LEFT JOIN historicalrecord h ON (
            h.parent_id = spd.id
            AND h.sessionid = fsm.sessionid
            AND h.courseId = fsm.courseId
            AND h.classId = fsm.classId
            AND h.shiftId = fsm.shiftId
        )
        LEFT JOIN section sec ON sec.id = h.sectionId

        LEFT JOIN studentfeesreceipttype rt ON rt.id = fsm.receipttype
        LEFT JOIN feesquarter fq ON fq.id = fsm.feesquarterid
        LEFT JOIN classes adv_cl ON adv_cl.id = fsm.advanceclassid
        LEFT JOIN currentsessionmaster adv_sess ON adv_sess.id = fsm.advancesessionid
        LEFT JOIN course adv_course ON adv_course.id = fsm.advancecourseid
        LEFT JOIN feesstructuresubtab fsb ON fsb.parent_id = fsm.id
        LEFT JOIN feesheadtable fh ON fh.id = fsb.headid
        LEFT JOIN studentFeesType ft ON ft.id = fsb.feestypeid
        LEFT JOIN (
        SELECT
            parent_id,
            SUM(instamount) AS total_configured
        FROM feesstructuresubtab
        GROUP BY parent_id
        ) fsb_total
        ON fsb_total.parent_id = fsm.id

        -- Join with the Fee Concession Tab (Mapping for getting slab and concessional amount)
        LEFT JOIN studentfeesconcessiontab sct ON (
            sct.student_id = spd.id
            AND sct.courseid = crs.id
            AND sct.classid = cl.id
            AND sct.sessionid = sess.id
            AND sct.sectionid = sec.id
            AND sct.shiftid = sh.id
            AND sct.receipttypeid = rt.id
        )
        -- Join with the studentfeesconcessionnewsub
        LEFT JOIN studentfeesconcessionnewsub sct_sub ON (
            sct_sub.parent_id = sct.id
            AND sct_sub.headid = fh.id
        )

        -- Join with the Fee-concession slabs
        LEFT JOIN studentfeesconcessionslab csm ON csm.id = sct.slabid
        LEFT JOIN studentfeesconcessionslabsub csm_sub ON (
            csm_sub.parent_id = csm.id
            AND csm_sub.headid = fh.id
        )

        -- Join with the instalment-sub
        LEFT JOIN studentinstlfees inst_sub ON (
            inst_sub.parent_id = inst.id
            AND inst_sub.headid = fh.id
        )

        -- Join with the fee-receipts
        LEFT JOIN feesreceiptmaintable frm ON frm.id = inst.feesreceiptid
        LEFT JOIN studentFeesPayMode frm_sfpm On frm_sfpm.id = frm.collegePayMode
        LEFT JOIN feesinstonlinepayment p ON p.instid = inst.id AND p.status != 'Initiated'

        WHERE 1 = 1${uidClause}
        ORDER BY sess.sessionName, crs.courseName, cl.classname, spd.codeNumber, fsb.position
        LIMIT 3000000;
    `;
}

/**
 * Resolve the new-DB fee-slab name for a legacy slab letter, per batch.
 * For the 2023-24 and 2024-25 sessions the slab letters were renamed when the
 * new fee groups were configured: legacy M -> Slab O, legacy S -> Slab M.
 * Every other letter/session maps 1:1 (X -> "Slab X"); a missing legacy slab
 * falls back to "Slab F". If the target slab doesn't exist in this DB yet
 * (e.g. Slab O pre-prod-sync), the existing "Fee Group / Slab - Not Found!"
 * per-uid error surfaces it — the import is not aborted.
 */
function resolveLegacySlabName(
  rawSlab: string | null | undefined,
  academicYear: string | null | undefined,
): string {
  const slab = String(rawSlab ?? "").trim();
  if (!slab) return "Slab F";
  const startYear = Number(String(academicYear ?? "").slice(0, 4));
  // Legacy concession slabs were renamed in the new DB. Verified against IRP for
  // the imported cohort: legacy "S" -> new "Slab M" matches the paid amount to
  // the rupee in every year (48/48 in 2025-26, same as 2023-24 / 2024-25), and
  // legacy "M" -> new "Slab O". New "Slab S" is a distinct zero-amount slab, so
  // leaving legacy "S" as "Slab S" yields total_payable = 0 (wrong). This remap
  // holds for all imported sessions, not just 2023-24 / 2024-25.
  if (startYear === 2023 || startYear === 2024 || startYear === 2025) {
    if (slab.toUpperCase() === "M") return "Slab O";
    if (slab.toUpperCase() === "S") return "Slab M";
  }
  return `Slab ${slab}`;
}

// Per-uid masters, computed once per process (the master syncs are idempotent
// upserts). Reused across every per-uid fees load in an import run.
// Single-flight: the PROMISE is cached (assigned synchronously), so concurrent
// import workers hitting a cold cache share one build instead of all running
// the receipt-type/fee-head syncs at once. A failed build clears the cache so
// it doesn't poison the process.
let cachedPerUidFeesMastersPromise: Promise<MasterDataType> | null = null;
function getPerUidFeesMasters(): Promise<MasterDataType> {
  if (cachedPerUidFeesMastersPromise) return cachedPerUidFeesMastersPromise;
  cachedPerUidFeesMastersPromise = (async () => {
    const receiptTypes = await syncLegacyReceiptTypes();
    const feeHeads = await syncLegacyFeeHeads();
    const academicYears = await db.select().from(academicYearModel);
    const sessions = await db.select().from(sessionModel);
    const classes = await db.select().from(classModel);
    const sections = await db.select().from(sectionModel);
    const shifts = await db.select().from(shiftModel);
    return {
      feeHeads,
      receiptTypes,
      academicYears,
      sessions,
      classes,
      sections,
      shifts,
    };
  })();
  cachedPerUidFeesMastersPromise.catch(() => {
    cachedPerUidFeesMastersPromise = null;
  });
  return cachedPerUidFeesMastersPromise;
}

/**
 * Transient legacy-DB failures (the remote replica times out or drops
 * connections under load — it demonstrably did during the Jul 15–16 import
 * night, which silently cost 79 PG students their fees). Retry a few times
 * with backoff before giving up; anything else throws immediately.
 */
const RETRYABLE_MYSQL_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
  "ER_LOCK_DEADLOCK",
]);

async function queryLegacyWithRetry<T>(
  sqlText: string,
  label: string,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return (await mysqlConnection.query(sqlText)) as T;
    } catch (err) {
      lastErr = err;
      const code = String((err as { code?: string })?.code ?? "");
      if (!RETRYABLE_MYSQL_CODES.has(code) || attempt === attempts) throw err;
      const delayMs = attempt * 2000;
      console.warn(
        `[legacy-fees] ${label}: attempt ${attempt}/${attempts} failed (${code}); retrying in ${delayMs}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

/**
 * Load a single student's legacy fees by uid — intended to be called from the
 * per-uid student import loop, right after the student's data is loaded.
 *
 * Idempotent: skips any student+fee-structure that already has fees loaded (a
 * payment or a receipt number exists), so re-runs never duplicate a payment or
 * overwrite values edited in the new DB.
 *
 * Returns a per-student summary { loaded, skipped, errors } so the caller can
 * surface fee-load failures (e.g. fee structure / mapping not found) to the
 * user. "No legacy fees for this student" is reported via `noLegacyRows` so
 * callers can record the skip — it is NOT an error, but it must be visible:
 * treating it as plain success is what hid the Jul 16 import gap.
 */
export async function loadStudentFeesForUid(uid: string): Promise<{
  loaded: number;
  skipped: number;
  errors: string[];
  noLegacyRows?: boolean;
}> {
  const summary = {
    loaded: 0,
    skipped: 0,
    errors: [] as string[],
    noLegacyRows: false,
  };
  const masters = await getPerUidFeesMasters();

  const [rows] = await queryLegacyWithRetry<
    [LegacyStudentFeeMappingRow[], unknown]
  >(buildLegacyFeesQuery(uid), `fees query for uid ${uid}`);
  // No legacy fee installments for this student — nothing to load (not an
  // error, but recorded so the import log can show it).
  if (!rows || rows.length === 0) {
    summary.noLegacyRows = true;
    return summary;
  }

  const [foundStudent] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.uid, uid));
  if (!foundStudent) {
    summary.errors.push("student not found in new DB");
    return summary;
  }

  // Group the student's rows by the legacy fee structure they belong to — that
  // id IS the batch (academic year + receipt type + course + class + shift), so
  // it is the exact, collision-free grouping key. Rows whose installment has no
  // fee structure (legacy data gap) cannot be loaded at all; skip them here
  // rather than emitting a meaningless "fee structure not found (year / / …)".
  const groups = new Map<number, LegacyStudentFeeMappingRow[]>();
  let rowsWithoutStructure = 0;
  for (const r of rows) {
    const structureId = Number(r.legacyFeeStructureId);
    if (!Number.isFinite(structureId) || structureId <= 0) {
      rowsWithoutStructure++;
      continue;
    }
    const g = groups.get(structureId);
    if (g) g.push(r);
    else groups.set(structureId, [r]);
  }
  if (rowsWithoutStructure > 0) {
    summary.errors.push(
      `${rowsWithoutStructure} legacy installment row(s) have no fee structure in the old DB — skipped`,
    );
  }

  for (const [legacyFeeStructureId, studentRows] of groups) {
    const batchLabel = `${studentRows[0]["Academic Year"]} / ${studentRows[0]["Receipt Type"]} / ${studentRows[0].Course} / ${studentRows[0].Semester}`;
    // Isolate every batch: a failure on one semester (e.g. a receipt-number
    // clash) must never abort the student's remaining semesters, which used to
    // leave later semesters silently unpaid.
    try {
      const feeStructureResult = await syncLegacyFeeStructure(
        studentRows,
        legacyFeeStructureId,
        masters,
      );
      if (!feeStructureResult) {
        summary.errors.push(`fee structure not found (${batchLabel})`);
        continue;
      }

      // Newly-imported students may not have a default mapping yet — create it
      // (whole-structure ensure is idempotent) only when it is actually missing.
      const [existingMapping] = await db
        .select({ id: feeStudentMappingModel.id })
        .from(feeStudentMappingModel)
        .where(
          and(
            eq(feeStudentMappingModel.studentId, foundStudent.id),
            eq(feeStudentMappingModel.feeStructureId, feeStructureResult.id!),
          ),
        );
      if (!existingMapping) {
        await ensureDefaultFeeStudentMappingsForFeeStructure(
          feeStructureResult,
        );
      }

      // Within a batch every row belongs to the SAME fee structure (rows differ
      // only by fee-head component / installment). Treat the batch as paid when
      // any of its installments is paid, and take the challan + timestamps from
      // that paid row — never from an arbitrary row 0.
      const paidRow = studentRows.find((r) => r["Has Fees Paid?"] === "Yes");
      const sourceRow = paidRow ?? studentRows[0];
      // Preserve the old-DB challan/receipt number whenever it exists ANYWHERE
      // in this batch (prefer the paid row, then any row); only auto-generate
      // when the legacy DB has no number for the batch at all.
      const legacyChallanNumber =
        [sourceRow, ...studentRows]
          .map((r) => (r["Challan Number"] ?? "").toString().trim())
          .find((c) => c.length > 0) || null;
      const result = await syncFeeStudentMapping(
        studentRows,
        uid,
        feeStructureResult.id!,
        resolveLegacySlabName(
          sourceRow["Fee Slab"],
          sourceRow["Academic Year"],
        ),
        Boolean(paidRow),
        sourceRow["Fee Receipt Entry Created At"],
        legacyChallanNumber,
        sourceRow["Fees Paid Timestamp"]
          ? sourceRow["Fees Paid Timestamp"] instanceof Date
            ? sourceRow["Fees Paid Timestamp"].toISOString()
            : sourceRow["Fees Paid Timestamp"]
          : null,
      );
      if (result.status === "loaded") summary.loaded++;
      else if (result.status === "skipped") summary.skipped++;
      else
        summary.errors.push(
          `${result.reason ?? "fees not loaded"} (${batchLabel})`,
        );
    } catch (e) {
      summary.errors.push(
        `${(e as Error)?.message ?? "unknown error"} (${batchLabel})`,
      );
    }
  }

  return summary;
}

async function doSyncAllFeeStructureMapping() {
  const feeStructures = await db.select().from(feeStructureModel);
  for (const feeStructure of feeStructures) {
    await ensureDefaultFeeStudentMappingsForFeeStructure(feeStructure);
  }
}

export async function loadStudentFees() {
  await doSyncAllFeeStructureMapping();
  errorArr = [];

  const academicYears = await db.select().from(academicYearModel);
  const sessions = await db.select().from(sessionModel);
  const classes = await db.select().from(classModel);
  const sections = await db.select().from(sectionModel);
  const shifts = await db.select().from(shiftModel);

  // Sync/Link the receipt type master
  // console.log("Sync/Link the receipt type master");
  const receiptTypes = await syncLegacyReceiptTypes();

  // Sync/Link the fee-heads master
  // console.log("Sync/Link the fee-heads master");
  const feeHeads = await syncLegacyFeeHeads();

  // Load the student fees mapping
  // console.log("Load the student fees mapping");
  const [result] = (await mysqlConnection.query(buildLegacyFeesQuery())) as [
    LegacyStudentFeeMappingRow[],
    unknown,
  ];

  // Iterate over the result
  // console.log("Iterate over the result");
  const uniqueLegacyAcademicYears = new Set(
    result.map((r) => r["Academic Year"]),
  );
  const uniqueLegacyReceiptTypes = new Set(
    result.map((r) => r["Receipt Type"]),
  );
  const uniqueLegacyProgramCourseNames = new Set(result.map((r) => r.Course));
  const uniqueLegacyClassNames = new Set(result.map((r) => r.Semester));
  const uniqueLegacyShifts = new Set(result.map((r) => r.legacyShiftId));

  for (const legacyAcademicYearName of uniqueLegacyAcademicYears) {
    for (const legacyReceiptTypeName of uniqueLegacyReceiptTypes) {
      for (const legacyPCName of uniqueLegacyProgramCourseNames) {
        for (const legacyClassName of uniqueLegacyClassNames) {
          for (const legacyShiftId of uniqueLegacyShifts) {
            // console.log(
            //   `Processing: ${legacyAcademicYearName} | ${legacyReceiptTypeName} | ${legacyPCName} | ${legacyClassName} | Shift-${legacyShiftId}`,
            // );
            // Step 1: Filter the entries by batches
            // console.log("in loop, Step 1: Filter the entries by batches");
            const filteredDataByBatches = result.filter(
              (r) =>
                r["Academic Year"] === legacyAcademicYearName &&
                r["Receipt Type"] === legacyReceiptTypeName &&
                r.Course === legacyPCName &&
                r.Semester === legacyClassName &&
                r.legacyShiftId === legacyShiftId,
            );
            // console.log("filteredDataByBatches:", filteredDataByBatches.length);
            const donUids: string[] = [];
            // Iterate over each student
            // console.log("in loop, Step 2: Iterate over each student");
            for (const data of filteredDataByBatches) {
              const uid = data.Uid;
              if (donUids.includes(uid)) continue; // Skip if already processed

              // console.log("Processing the uid:", uid);
              // Grab all the student related entries for the uid from `filteredDataByBatches[]`
              // console.log(
              //   "in loop, Step 3: Grab all the student related entries for the uid from `filteredDataByBatches[]`",
              // );
              const studentRows = filteredDataByBatches.filter(
                (ele) => ele.Uid === uid,
              );

              // Find the student id from a360-db via uid
              // console.log(
              //   "in loop, Step 4: Find the student id from a360-db via uid",
              // );
              const [foundStudent] = await db
                .select()
                .from(studentModel)
                .where(eq(studentModel.uid, uid));

              if (!foundStudent) {
                // console.log(
                //   "Student Not Found in a360-db, capturing entries...",
                // );
                await captureErrorRows("Student Not Found!", studentRows);
                continue;
                // throw Error("Student - Not Found!"); // TODO
              }

              // console.log("Find the fee-structure id from a360-db...");
              // Find the fee-structure id from a360-db
              const feeStructureResult = await syncLegacyFeeStructure(
                studentRows,
                studentRows[0].legacyFeeStructureId,
                {
                  academicYears,
                  classes,
                  feeHeads,
                  receiptTypes,
                  sections,
                  sessions,
                  shifts,
                },
              );

              if (!feeStructureResult) continue;

              // Find the fee student mapping by - studentId, feeStructureId, amount and fees-slab name (if is missing or not provided then use Slab F as default)
              // console.log(
              //   "in loop, Find the fee student mapping by - studentId, feeStructureId, amount and fees-slab name (if is missing or not provided then use Slab F as default)",
              // );
              await syncFeeStudentMapping(
                studentRows,
                uid,
                feeStructureResult!.id!,
                resolveLegacySlabName(
                  studentRows[0]["Fee Slab"],
                  studentRows[0]["Academic Year"],
                ),
                studentRows[0]["Has Fees Paid?"] === "Yes" ? true : false,
                studentRows[0]["Fee Receipt Entry Created At"],
                // Preserve any old-DB challan/receipt number in the batch.
                studentRows
                  .map((r) => (r["Challan Number"] ?? "").toString().trim())
                  .find((c) => c.length > 0) || null,
                studentRows[0]["Fees Paid Timestamp"]
                  ? studentRows[0]["Fees Paid Timestamp"] instanceof Date
                    ? studentRows[0]["Fees Paid Timestamp"].toISOString()
                    : studentRows[0]["Fees Paid Timestamp"]
                  : null,
              );

              // Laslty, marked the uid as done
              donUids.push(uid);
            }
          }
        }
      }
    }
  }
}

async function syncFeeStudentMapping(
  studentRows: LegacyStudentFeeMappingRow[],
  studentUid: string,
  feeStructureId: number,
  feeSlab: string = "Slab F",
  amountPaid: boolean,
  challanGeneratedAt: string | Date | null,
  challanNumber: string | null,
  txnDate: string | null,
): Promise<{ status: "loaded" | "skipped" | "error"; reason?: string }> {
  const tmpResult = await db
    .select({
      feeStudentMapping: feeStudentMappingModel,
      user: userModel,
      feeGroupPromotionMapping: feeGroupPromotionMappingModel,
      feeCategoryCode: feeCategoryModel.code,
    })
    .from(feeStudentMappingModel)
    .leftJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .leftJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .leftJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .leftJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
    .leftJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
    )
    .where(
      and(
        eq(studentModel.uid, studentUid),
        eq(feeStructureModel.id, feeStructureId),
      ),
    );

  let feeStudentMapping: FeeStudentMappingT | undefined =
    tmpResult[0]?.feeStudentMapping;
  let user = tmpResult[0]?.user ?? undefined;
  let feeGroupPromotionMapping =
    tmpResult[0]?.feeGroupPromotionMapping ?? undefined;
  const feeCategoryCode = tmpResult[0]?.feeCategoryCode ?? null;

  // Idempotent guard: if this student + fee-structure already has fees loaded (a
  // payment exists, or the mapping already carries a receipt number), skip the
  // whole sync — never duplicate a payment or overwrite values edited in the new
  // DB. This also makes the full batch loader safe to re-run.
  let hasExistingPayment = false;
  if (feeStudentMapping) {
    const existingPayment = await db
      .select({ id: paymentModel.id })
      .from(paymentModel)
      .where(eq(paymentModel.feeStudentMappingId, feeStudentMapping.id!))
      .limit(1);
    hasExistingPayment = existingPayment.length > 0;
    // Fully loaded (an active receipt exists in fee_student_receipt_numbers) —
    // never touch again. (Receipt numbers now live in the new table; the
    // mapping's own receiptNumber column is legacy/frozen and not read.)
    const existingReceipt = await db
      .select({ id: feeStudentReceiptNumberModel.id })
      .from(feeStudentReceiptNumberModel)
      .where(
        and(
          eq(
            feeStudentReceiptNumberModel.feeStudentMappingId,
            feeStudentMapping.id!,
          ),
          eq(feeStudentReceiptNumberModel.isDeprecated, false),
        ),
      )
      .limit(1);
    if (existingReceipt.length > 0) {
      return { status: "skipped" };
    }
    // Payment exists but NO receipt number = a previous run died between the
    // payment insert and the mapping update. Fall through to finish the
    // mapping (the payment insert below is guarded by hasExistingPayment, so
    // it is never duplicated).
  }

  // console.log(
  //   feeStructureId,
  //   feeStudentMapping,
  //   user,
  //   feeGroupPromotionMapping,
  //   feeSlab,
  //   studentUid,
  // );
  if (!tmpResult[0]?.feeStudentMapping) {
    // console.log("feeStudentMapping not found");
    // throw Error("feeStudentMapping not found");
  }

  //   user = tmpResult[0]?.user ?? undefined;
  //   feeGroupPromotionMapping =
  //     tmpResult[0]?.feeGroupPromotionMapping ?? undefined;

  //   feeStudentMapping = tmpResult[0]!.feeStudentMapping;
  // console.log("Saving feeStudentMapping!", feeSlab);

  // Update the slabs, if changed
  if (feeSlab.trim() != "Slab F") {
    const tmpFg = await db
      .select({ feeGroup: feeGroupModel })
      .from(feeGroupModel)
      .leftJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
      .where(ilike(feeSlabModel.name, feeSlab.trim()));

    if (!tmpFg[0]?.feeGroup) {
      // console.log("Fee Group / Slab - Not Found!", feeSlab.trim());
      await captureErrorRows("Fee Group / Slab - Not Found!", studentRows);
      return {
        status: "error",
        reason: `Fee Group / Slab not found: ${feeSlab.trim()}`,
      };
      // throw Error("Fee Group - Not Found!"); // TODO
    }

    // console.log("Fee Slab Provided:", feeSlab);
    // console.log(tmpFg);
    const [{ feeGroup }] = tmpFg;

    await updateFeeGroupPromotionMapping(
      feeGroupPromotionMapping?.id! as number,
      {
        ...feeGroupPromotionMapping,
        feeGroupId: feeGroup?.id!,
        approvalType: "MANUAL",
        approvalUserId: 41,
      },
    );
  }

  // console.log(feeStudentMapping);

  if (!feeStudentMapping) {
    // console.log("feeStudentMapping - Not Found!", feeSlab.trim());
    await captureErrorRows("Fee-Student Mapping - Not Found!", studentRows);
    return { status: "error", reason: "Fee-Student Mapping not found" };
  }

  [feeStudentMapping] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));

  // Recompute total_payable for the slab actually assigned above. The mapping
  // was created by ensureDefault with the DEFAULT (Slab F) amount; the slab
  // change re-points its fee group but does not recompute the amount, so the
  // re-read still carries the full pre-concession figure. Without this, a
  // concession student's amount_paid and payments.amount (both written from
  // totalPayable below) capture the full amount while total_payable later
  // settles to the concession amount via the fan-out — leaving the three
  // internally inconsistent. Compute the slab-correct amount here and persist
  // it so all three agree.
  let effectiveTotalPayable = feeStudentMapping.totalPayable;
  if (feeStudentMapping.feeGroupPromotionMappingId) {
    const [freshFgpm] = await db
      .select()
      .from(feeGroupPromotionMappingModel)
      .where(
        eq(
          feeGroupPromotionMappingModel.id,
          feeStudentMapping.feeGroupPromotionMappingId,
        ),
      );
    if (freshFgpm) {
      effectiveTotalPayable = await calculateTotalPayableForFeeStudentMapping(
        feeStructureId,
        freshFgpm,
      );
    }
  }

  // Re-read the fee category code AFTER any slab/fee-group change above, so the
  // receipt-number suffix reflects the FINAL category (e.g. "FA"), matching the
  // canonical receipt issuance. (The initial join captured the pre-update default
  // category, whose code is empty.)
  let finalCategoryCode = feeCategoryCode;
  {
    const [catRow] = await db
      .select({ code: feeCategoryModel.code })
      .from(feeStudentMappingModel)
      .innerJoin(
        feeGroupPromotionMappingModel,
        eq(
          feeGroupPromotionMappingModel.id,
          feeStudentMappingModel.feeGroupPromotionMappingId,
        ),
      )
      .innerJoin(
        feeGroupModel,
        eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
      )
      .leftJoin(
        feeCategoryModel,
        eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
      )
      .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!))
      .limit(1);
    if (catRow && catRow.code != null) finalCategoryCode = catRow.code;
  }

  // Receipt/challan number: preserve the legacy challan when present, else build
  // `{uid}/{NN}-{feeCategoryCode}` like the canonical issuance (suffix only when
  // the category has a code).
  //
  // NN must be the student's next FREE index, not simply (count + 1): legacy
  // challans use the very same `{uid}/{NN}` shape, so counting collided with an
  // already-imported challan (e.g. a generated "1304230036/02" hitting the
  // legacy challan "1304230036/02"). That violated UNIQUE(receipt_number),
  // threw mid-update, and — with no per-batch guard — aborted every remaining
  // semester for that student, leaving them "Pending" despite being paid.
  // Scanning the numbers already taken by THIS student and skipping past them
  // makes the generated number collision-free. Safe under concurrency: the
  // per-UID import lock means one worker per student.
  let finalReceiptNumber = challanNumber;
  if (!finalReceiptNumber) {
    const takenRows = await db
      .select({ receiptNumber: feeStudentReceiptNumberModel.receiptNumber })
      .from(feeStudentReceiptNumberModel)
      .where(
        eq(
          feeStudentReceiptNumberModel.studentId,
          feeStudentMapping.studentId!,
        ),
      );
    const taken = new Set(
      takenRows.map((r) => r.receiptNumber).filter(Boolean) as string[],
    );
    const code = finalCategoryCode?.trim();
    const build = (n: number) => {
      const seq = String(n).padStart(2, "0");
      return code ? `${studentUid}/${seq}-${code}` : `${studentUid}/${seq}`;
    };
    let seq = 1;
    while (taken.has(build(seq))) seq++;
    finalReceiptNumber = build(seq);
  }

  // Map the legacy payment mode → new enum. The college recorded one of
  // "Cash" / "Bank" / "Online Payment"; a successful online record also confirms
  // ONLINE. CHEQUE is the offline non-cash bucket (bank challan/DD/deposit). The
  // raw legacy mode is kept in txnPaymentMode so nothing is lost.
  const legacyMode = (studentRows[0]["College Payment Mode"] ?? "").trim();
  const onlineStatus = (studentRows[0]["Online Payment Status"] ?? "").trim();
  const isOnline =
    legacyMode.toLowerCase() === "online payment" ||
    onlineStatus.toLowerCase().startsWith("success");
  const paymentMode: "CASH" | "CHEQUE" | "ONLINE" = isOnline
    ? "ONLINE"
    : legacyMode.toLowerCase() === "bank"
      ? "CHEQUE"
      : "CASH";
  const onlineRef =
    (studentRows[0]["Online Payment Reference Number"]?.trim() || null) ??
    (studentRows[0]["Online Payment Order Id"]
      ? String(studentRows[0]["Online Payment Order Id"])
      : null);
  // orderId = the legacy gateway order id (feesinstonlinepayment.id, surfaced as
  // "Online Payment Order Id") ONLY — never the receipt/challan number. When the
  // legacy online row is absent (no gateway record), leave orderId null; the
  // online reference, if any, is still preserved in txnId below.
  const orderId = isOnline
    ? studentRows[0]["Online Payment Order Id"]
      ? String(studentRows[0]["Online Payment Order Id"]).trim()
      : null
    : null;

  // Persist the legacy payment as a linked entry tied directly to the
  // fee_student_mapping via payments.feeStudentMappingId / isLinked.
  // hasExistingPayment: a crashed earlier run may already have written it.
  if (amountPaid && !hasExistingPayment) {
    await db.insert(paymentModel).values({
      userId: user?.id,
      feeStudentMappingId: feeStudentMapping.id!,
      context: "ADMISSION",
      amount: effectiveTotalPayable,
      status: "SUCCESS",
      paymentMode,
      txnPaymentMode: legacyMode || null,
      bankName: isOnline ? studentRows[0]["Bank Name"]?.trim() || null : null,
      orderId,
      txnId: isOnline ? onlineRef : null,
      isManualEntry: true,
      isLinked: true,
      txnDate,
    });
  }

  // Persist fee amounts on the mapping. Receipt/challan numbers now live in
  // fee_student_receipt_numbers (the mapping's own receiptNumber/challanGeneratedAt
  // columns are frozen legacy data and are no longer written or read).
  await db
    .update(feeStudentMappingModel)
    .set({
      totalPayable: effectiveTotalPayable,
      amountPaid: amountPaid ? effectiveTotalPayable : null,
    })
    .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));

  // Record the receipt/challan number in the new source-of-truth table.
  if (finalReceiptNumber) {
    const nnMatch = finalReceiptNumber.match(/^[^/]+\/(\d+)/);
    const parsedSeq = nnMatch ? Number.parseInt(nnMatch[1], 10) : 1;
    await db
      .insert(feeStudentReceiptNumberModel)
      .values({
        studentId: feeStudentMapping.studentId!,
        feeStudentMappingId: feeStudentMapping.id!,
        uid: studentUid,
        sequence: Number.isFinite(parsedSeq) && parsedSeq > 0 ? parsedSeq : 1,
        receiptNumber: finalReceiptNumber,
        challanGeneratedAt: formatDate(txnDate) ?? new Date(),
        isDeprecated: false,
      })
      .onConflictDoNothing();
  }

  // console.log("Saved feeStudentMapping!");
  return { status: "loaded" };
}

async function syncLegacyFeeStructure(
  studentRows: LegacyStudentFeeMappingRow[],
  legacyFeeStructureId: number,
  masterData: MasterDataType,
) {
  //   console.log("in syncLegacyFeeStructure(), studentRows", studentRows);

  const [result] = await queryLegacyWithRetry<
    [LegacyFeeStructureRow[], unknown]
  >(
    `
        SELECT
            -- Fee Structure Meta
            fsm.id AS fee_structure_id,
            rt.name AS receipt_type,
            rt.spltype AS variant,
            fsm.installmentNo AS installment_number,
            fq.name AS fees_quarter,
            -- Batch Details
            sess.sessionName AS session,
            crs.courseName AS course,
            cl.classname AS semester,
            sh.shiftName AS shift,
            -- Fee Component Details
            fsb.installmenttypename AS installment_type,
            fsb.concession,
            fh.name AS fee_head,
            ft.name AS fees_type,
            fsb.instamount AS amount,
            fsb.specialtypename AS fee_component_variant,
            fsb.lateTypeCalculation AS late_type_calculation,
            -- Time Period
            fsm.lastdate AS last_date,
            fsm.closingdate AS closing_date,
            fsm.instfromdt AS installment_from_date,
            fsm.insttodt AS installment_to_date,
            fsm.lastonlinedate AS last_online_from_date,
            fsm.lastonlinedateto AS last_online_to_date,
            -- Boolean Flags
            fsm.readmitcheck,
            fsm.admcodegenchk,
            fsm.admfrmgenchk,
            -- Advance Configurations
            adv_crs.courseName AS advance_for_course,
            adv_sess.sessionName AS advance_for_session,
            adv_cl.classname AS advance_for_semester,
            inst.institutename AS institution,

            -- Legacy Ids
            fsb.id AS legacyFeeStructureSubId,
            rt.id AS legacyReceiptTypeId,
            sess.id AS legacySessionId,
            crs.id AS legacyCourseId,
            cl.id AS legacySemesterId,
            sh.id AS legacyShiftId,
            fh.id AS legacyFeeHeadId,
            adv_crs.id AS legacyAdvanceCourseId,
            adv_sess.id AS legacyAdvanceSessionId,
            adv_cl.id AS legacyAdvanceSemesterId,
            ay.id AS legacyAcademicYearId

        FROM feesstructuremaintab fsm
        JOIN course crs ON crs.id = fsm.courseId
        JOIN studentfeesreceipttype rt ON rt.id = fsm.receipttype
        JOIN classes cl ON cl.id = fsm.classId
        JOIN currentsessionmaster sess ON sess.id = fsm.sessionid
        LEFT JOIN classes adv_cl ON adv_cl.id = fsm.advanceclassid
        LEFT JOIN institutemastermaintable inst ON inst.id = fsm.institutionId
        LEFT JOIN feesquarter fq ON fq.id = fsm.feesquarterid
        LEFT JOIN currentsessionmaster adv_sess ON adv_sess.id = fsm.advancesessionid
        LEFT JOIN course adv_crs on adv_crs.id = fsm.advancecourseid
        LEFT JOIN shift sh ON sh.id = fsm.shiftId
        LEFT JOIN feesstructuresubtab fsb ON fsb.parent_id = fsm.id
        LEFT JOIN feesheadtable fh ON fh.id = fsb.headid
        LEFT JOIN studentFeesType ft ON ft.id = fsb.feestypeid
        LEFT JOIN accademicyear ay ON ay.sessionId = sess.id
        WHERE fsm.id = ${legacyFeeStructureId}
        ORDER BY sess.sessionName DESC, fsm.id, fsb.index_col;
    `,
    `structure detail for legacy fee structure ${legacyFeeStructureId}`,
  );

  // No legacy fee-structure detail rows for this batch (e.g. the structure is
  // for an older session). Skip this batch gracefully — do NOT dereference
  // result[0] below, which would throw and abort the whole student's fee load
  // (and thus drop every other semester/class the student legitimately has).
  if (!result || result.length === 0) {
    await captureErrorRows(
      "Fee Structure - legacy detail rows not found!",
      studentRows,
    );
    return null;
  }

  //   console.log("in syncLegacyFeeStructure(), result", result);

  // Step 1: Try fetching with batch details if not found with legacy_fee_structure_id

  // console.log(
  //   "syncLegacyFeeStructure() | Step 2 (optional): Try fetching with batch details if not found with legacy_fee_structure_id",
  // );
  const tmpResult = await db
    .select({ feeStructure: feeStructureModel })
    .from(feeStructureModel)
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .leftJoin(
      sessionModel,
      eq(sessionModel.academicYearId, feeStructureModel.academicYearId),
    )
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .leftJoin(shiftModel, eq(shiftModel.id, feeStructureModel.shiftId))
    .where(
      and(
        eq(receiptTypeModel.legacyReceiptTypeId, result[0].legacyReceiptTypeId),
        eq(sessionModel.legacySessionId, result[0].legacySessionId),
        ilike(programCourseModel.name, result[0].course.trim()),
        ilike(classModel.name, result[0].semester.trim()),
        eq(shiftModel.legacyShiftId, result[0].legacyShiftId),
      ),
    );

  // console.log(
  //   `result[0].legacyReceiptTypeId: ${result[0].legacyReceiptTypeId}`,
  // );
  // console.log(`result[0].legacySessionId: ${result[0].legacySessionId}`);
  // console.log(`result[0].course.trim(): ${result[0].course.trim()}`);
  // console.log(`result[0].legacyShiftId: ${result[0].legacyShiftId}`);
  // console.log(`tmpResult:`, tmpResult);

  if (tmpResult[0]?.feeStructure) {
    const [{ feeStructure }] = tmpResult;
    // console.log("syncLegacyFeeStructure() | Update the fields");
    // Update the fields
    return await updateFeeStructure(
      studentRows,
      feeStructure,
      result,
      masterData,
    );
  } else {
    // console.log(
    //   "syncLegacyFeeStructure() | Fee Structure - Not Found!, capturing entries",
    // );
    await captureErrorRows("Fee Structure - Not Found!", studentRows);
    return null;
  }
}

async function updateFeeStructure(
  studentRows: LegacyStudentFeeMappingRow[],
  feeStructure: FeeStructureT,
  legacyFeeStructureRows: LegacyFeeStructureRow[],
  masterData: MasterDataType,
) {
  // console.log(
  //   "updateFeeStructure() | Update the fee structure fields",
  //   feeStructure,
  // );
  // Update the fee structure fields
  const [savedFeeStructure] = await db
    .update(feeStructureModel)
    .set({
      closingDate: formatDate(legacyFeeStructureRows[0].closing_date),
      advanceForProgramCourseId: (
        await getProgramCourseByName(
          legacyFeeStructureRows[0].advance_for_course,
        )
      )?.id,
      advanceForClassId: (
        await getClassIdByName(legacyFeeStructureRows[0].advance_for_semester)
      )?.id,
      advanceForSessionId: (
        await getSessionByLegacyId(
          legacyFeeStructureRows[0].legacyAdvanceSessionId,
        )
      )?.id,
      startDate: formatDate(legacyFeeStructureRows[0].installment_from_date),
      endDate: formatDate(legacyFeeStructureRows[0].installment_to_date),
      onlineStartDate: formatDate(
        legacyFeeStructureRows[0].last_online_from_date,
      ),
      onlineEndDate: formatDate(legacyFeeStructureRows[0].last_online_to_date),
      numberOfInstallments: 0,
    })
    .where(eq(feeStructureModel.id, feeStructure.id!))
    .returning();

  // console.log("updateFeeStructure() | Update the fee-structure-components");
  // Update the fee-structure-components
  const savedFeeStructureComponents: FeeStructureComponentT[] = [];
  for (const row of legacyFeeStructureRows) {
    const feeHead = masterData.feeHeads.find(
      (fh) => fh.legacyFeeHeadId == row.legacyFeeHeadId,
    );

    if (!feeHead) {
      // console.log(
      //   "updateFeeStructure() | Fee Head Not Found!, capturing the entries",
      // );
      await captureErrorRows(
        `Fee Head Not Found: ${row.fee_head}`,
        studentRows,
      );
      continue;
    }

    // console.log("updateFeeStructure() | Save the fee-structure components");
    // const [savedFeeStructureComponent] = await db
    //   .update(feeStructureComponentModel)
    //   .set({
    //     legacyFeeStructureId: legacyFeeStructureRows[0].legacyFeeStructureSubId,
    //   })
    //   .where(
    //     and(
    //       eq(feeStructureComponentModel.feeStructureId, savedFeeStructure.id!),
    //       eq(feeStructureComponentModel.feeHeadId, feeHead!.id!),
    //     ),
    //   )
    //   .returning();

    // savedFeeStructureComponents.push(savedFeeStructureComponent);
  }

  return {
    ...savedFeeStructure,
    components: savedFeeStructureComponents,
  };
}

async function syncLegacyFeeHeads() {
  const [legacyFeeHeads] = (await mysqlConnection.query(`
        SELECT * FROM feesheadtable;
    `)) as [LegacyFeeHead[], unknown];

  // fee_heads has no unique on name — serialize this master sync so
  // concurrent cold-cache callers (and other backend instances) can't
  // double-insert. Cross-process safe; the table is tiny so the lock is brief.
  return withAdvisoryXactLock("import:fees:fee-heads", async () => {
    const feeHeads: FeeHeadT[] = [];
    for (const { id, ...row } of legacyFeeHeads) {
      const [existingFeeHead] = await db
        .select()
        .from(feeHeadModel)
        .where(ilike(feeHeadModel.name, row.name.trim()));

      if (existingFeeHead) {
        const [updatedFeeHead] = await db
          .update(feeHeadModel)
          .set({
            legacyFeeHeadId: id,
            name: row.name.trim(),
          })
          .where(eq(feeHeadModel.id, existingFeeHead.id))
          .returning();
        feeHeads.push(updatedFeeHead);
      } else {
        const [createdFeeHead] = await db
          .insert(feeHeadModel)
          .values({
            legacyFeeHeadId: id,
            ...row,
            name: row.name.trim(),
          })
          .returning();
        feeHeads.push(createdFeeHead);
      }
    }

    return feeHeads;
  });
}

/**
 * Legacy -> new receipt-type NAME aliases. The college renamed these when the
 * new fee setup was configured, so the fee structures live under the new name
 * while every legacy installment still carries the old one. Keyed by
 * lowercased legacy name.
 *
 * "Annual Fees" (legacy id 2, the Sem II-VI installments) === "Enrolment Fee"
 * in the new DB — without this alias none of those installments can resolve a
 * fee structure and the whole annual-fees load is skipped.
 */
const LEGACY_RECEIPT_TYPE_ALIASES: Record<string, string> = {
  "annual fees": "Enrolment Fee",
};

async function syncLegacyReceiptTypes() {
  const [legacyReceiptTypes] = (await mysqlConnection.query(`
        SELECT * FROM studentfeesreceipttype;
    `)) as [LegacyReceiptType[], unknown];

  // receipt_types has no unique on name — serialize this master sync (same
  // rationale as syncLegacyFeeHeads above).
  return withAdvisoryXactLock("import:fees:receipt-types", async () => {
    const receiptTypes: ReceiptTypeT[] = [];
    for (const { id, ...row } of legacyReceiptTypes) {
      if (row.name.trim() == "Regular Enrolment") continue;
      const legacyName = row.name.trim();
      const targetName =
        LEGACY_RECEIPT_TYPE_ALIASES[legacyName.toLowerCase()] ?? legacyName;
      const [existingReceiptType] = await db
        .select()
        .from(receiptTypeModel)
        .where(ilike(receiptTypeModel.name, targetName));
      let syncedReceiptType: ReceiptTypeT;
      if (existingReceiptType) {
        const [updatedReceiptType] = await db
          .update(receiptTypeModel)
          .set({
            legacyReceiptTypeId: id,
            chk: row.chk,
            splType: row.spltype,
          })
          .where(eq(receiptTypeModel.id, existingReceiptType.id))
          .returning();
        syncedReceiptType = updatedReceiptType!;
      } else {
        const [createdReceiptType] = await db
          .insert(receiptTypeModel)
          .values({
            legacyReceiptTypeId: id,
            ...row,
            name: targetName,
          })
          .returning();
        syncedReceiptType = createdReceiptType!;
      }
      receiptTypes.push(syncedReceiptType);

      // An aliased legacy id must map to exactly ONE new row: clear it from
      // any other row (e.g. a leftover "Annual Fees" row that an earlier,
      // pre-alias sync stamped with the same legacy id).
      if (targetName !== legacyName && syncedReceiptType?.id != null) {
        await db
          .update(receiptTypeModel)
          .set({ legacyReceiptTypeId: null })
          .where(
            and(
              eq(receiptTypeModel.legacyReceiptTypeId, id),
              ne(receiptTypeModel.id, syncedReceiptType.id),
            ),
          );
      }
    }

    return receiptTypes;
  });
}

/** Only parse with Kolkata + DD/MM/YYYY … when the string actually looks like that (avoids misparsing ISO/other strings and prevents dayjs timezone from throwing RangeError on bad internals). */
const LEGACY_KOLKATA_DATETIME =
  /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?$/;

export const formatDate = (
  date: string | Date | null | undefined,
): Date | null => {
  if (date == null) return null;

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const trimmed = String(date).trim();
  if (!trimmed) return null;

  if (LEGACY_KOLKATA_DATETIME.test(trimmed)) {
    try {
      const legacyFmt = /:\d{2}:\d{2}$/.test(trimmed)
        ? "DD/MM/YYYY HH:mm:ss"
        : "DD/MM/YYYY HH:mm";
      const parsedLegacy = dayjs.tz(trimmed, legacyFmt, "Asia/Kolkata");
      if (parsedLegacy.isValid()) {
        return parsedLegacy.toDate();
      }
    } catch {
      // timezone plugin can throw RangeError (e.g. Invalid time value in formatToParts)
    }
  }

  const parsedISO = dayjs(trimmed);
  if (parsedISO.isValid()) {
    return parsedISO.toDate();
  }

  return null;
};

// const formatDate = (date: string | Date | null): Date | null => {

//   if (typeof date === "string") {
//     return new Date(date);
//   } else if (date instanceof Date) {
//     return date;
//   } else {
//     return null;
//   }
// };
const getClassIdByName = async (
  className: string | null,
): Promise<ClassT | null> => {
  if (!className) return null;
  return (
    await db
      .select()
      .from(classModel)
      .where(ilike(classModel.name, className.trim()))
  )[0];
};
const getProgramCourseByName = async (
  pcName: string | null,
): Promise<ProgramCourseT | null> => {
  if (!pcName) return null;
  return (
    await db
      .select()
      .from(programCourseModel)
      .where(ilike(programCourseModel.name, pcName.trim()))
  )[0];
};
const getSessionByLegacyId = async (
  legacyId: number | null,
): Promise<SessionT | null> => {
  if (!legacyId) return null;
  return (
    await db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.legacySessionId, legacyId))
  )[0];
};

async function captureErrorRows(
  errorMessage: string,
  rows: LegacyStudentFeeMappingRow[],
) {
  for (const row of rows) {
    if (errorArr.some((ele) => ele.installment_id === row.installment_id))
      continue; // Skip if already exist

    const filteredRows = rows.filter(
      (r) => r.installment_id === row.installment_id,
    );

    errorArr.push(...filteredRows.map((r) => ({ errorMessage, ...r })));
  }
}

// Create Excel File with errorArray in the current path
async function writeExcel() {
  // ================= CREATE EXCEL =================

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Error Report");

  // ================= EXTRACT ALL UNIQUE KEYS =================

  // Collect all unique keys from errorArr
  const allKeys = new Set<string>();
  for (const row of errorArr) {
    Object.keys(row).forEach((key) => allKeys.add(key));
  }

  // Put errorMessage at first, then rest alphabetically
  const orderedKeys = [
    "errorMessage",
    ...Array.from(allKeys).filter((k) => k !== "errorMessage"),
  ];

  const baseColumns = orderedKeys.map((key) => ({
    header: key,
    key,
    width: 22,
  }));

  sheet.columns = baseColumns;

  // ================= ADD ROWS =================

  for (const row of errorArr) {
    const rowData: Record<string, any> = {};

    for (const key of orderedKeys) {
      rowData[key] = row[key as keyof ErrorRow] ?? "";
    }

    sheet.addRow(rowData);
  }

  // ================= STYLE =================

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "justify",
    wrapText: true,
  };

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Apply borders to all data rows
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { wrapText: true, vertical: "top" };
    });
  }

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Auto-fit columns width based on content
  sheet.columns.forEach((column, colIndex) => {
    let maxLength = 0;
    const headerCell = headerRow.getCell(colIndex + 1);
    if (headerCell?.value) {
      maxLength = headerCell.value.toString().length;
    }
    column.width = Math.min(maxLength + 2, 50);
  });

  // ================= SAVE FILE =================

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `error-report-${timestamp}.xlsx`;
  const filepath = `./logs/combined/${filename}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const fs = await import("fs").then((m) => m.promises);
  await fs.writeFile(filepath, new Uint8Array(buffer));

  console.log(`Excel file created: ${filepath}`);
  return filepath;
}
