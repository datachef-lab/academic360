import { db, mysqlConnection } from "@/db";
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
import { and, eq, ilike } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import { updateFeeGroupPromotionMapping } from "./fee-group-promotion-mapping.service";

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

export async function loadStudentFees() {
  errorArr = [];

  const academicYears = await db.select().from(academicYearModel);
  const sessions = await db.select().from(sessionModel);
  const classes = await db.select().from(classModel);
  const sections = await db.select().from(sectionModel);
  const shifts = await db.select().from(shiftModel);

  // Sync/Link the receipt type master
  console.log("Sync/Link the receipt type master");
  const receiptTypes = await syncLegacyReceiptTypes();

  // Sync/Link the fee-heads master
  console.log("Sync/Link the fee-heads master");
  const feeHeads = await syncLegacyFeeHeads();

  // Load the student fees mapping
  console.log("Load the student fees mapping");
  const [result] = (await mysqlConnection.query(`
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

        -- Join with the batch details
        LEFT JOIN historicalrecord h ON h.parent_id = spd.id
        LEFT JOIN currentsessionmaster sess ON sess.id = h.sessionid
        LEFT JOIN course crs ON crs.id = h.courseId
        LEFT JOIN classes cl ON cl.id = h.classId
        LEFT JOIN shift sh ON sh.id = h.shiftId
        LEFT JOIN section sec ON sec.id = h.sectionId
        LEFT JOIN accademicyear ay ON ay.sessionId = sess.id

        -- Join with the fee-structure
        LEFT JOIN feesstructuremaintab fsm ON (
            fsm.id = inst.structid
            AND fsm.courseId = crs.id
            AND fsm.classId = cl.id
            AND fsm.sessionid = sess.id
            AND fsm.shiftId = sh.id
        )
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

        WHERE sess.id >= 18
        ORDER BY sess.sessionName, crs.courseName, cl.classname, spd.codeNumber, fsb.position
        LIMIT 3000000;
    `)) as [LegacyStudentFeeMappingRow[], unknown];

  // Iterate over the result
  console.log("Iterate over the result");
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
            console.log(
              `Processing: ${legacyAcademicYearName} | ${legacyReceiptTypeName} | ${legacyPCName} | ${legacyClassName} | Shift-${legacyShiftId}`,
            );
            // Step 1: Filter the entries by batches
            console.log("in loop, Step 1: Filter the entries by batches");
            const filteredDataByBatches = result.filter(
              (r) =>
                r["Academic Year"] === legacyAcademicYearName &&
                r["Receipt Type"] === legacyReceiptTypeName &&
                r.Course === legacyPCName &&
                r.Semester === legacyClassName &&
                r.legacyShiftId === legacyShiftId,
            );
            console.log("filteredDataByBatches:", filteredDataByBatches.length);
            const donUids: string[] = [];
            // Iterate over each student
            console.log("in loop, Step 2: Iterate over each student");
            for (const data of filteredDataByBatches) {
              const uid = data.Uid;
              if (donUids.includes(uid)) continue; // Skip if already processed

              console.log("Processing the uid:", uid);
              // Grab all the student related entries for the uid from `filteredDataByBatches[]`
              console.log(
                "in loop, Step 3: Grab all the student related entries for the uid from `filteredDataByBatches[]`",
              );
              const studentRows = filteredDataByBatches.filter(
                (ele) => ele.Uid === uid,
              );

              // Find the student id from a360-db via uid
              console.log(
                "in loop, Step 4: Find the student id from a360-db via uid",
              );
              const [foundStudent] = await db
                .select()
                .from(studentModel)
                .where(eq(studentModel.uid, uid));

              if (!foundStudent) {
                console.log(
                  "Student Not Found in a360-db, capturing entries...",
                );
                await captureErrorRows("Student Not Found!", studentRows);
                continue;
                // throw Error("Student - Not Found!"); // TODO
              }

              console.log("Find the fee-structure id from a360-db...");
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
              console.log(
                "in loop, Find the fee student mapping by - studentId, feeStructureId, amount and fees-slab name (if is missing or not provided then use Slab F as default)",
              );
              await syncFeeStudentMapping(
                studentRows,
                uid,
                feeStructureResult!.id!,
                studentRows[0]["Fee Slab"]
                  ? `Slab ${studentRows[0]["Fee Slab"]}`
                  : "Slab F",
                studentRows[0]["Has Fees Paid?"] === "Yes" ? true : false,
                studentRows[0]["Fee Receipt Entry Created At"],
                studentRows[0]["Challan Number"] &&
                  studentRows[0]["Challan Number"].length > 0
                  ? studentRows[0]["Challan Number"]
                  : null,
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
) {
  const tmpResult = await db
    .select({
      feeStudentMapping: feeStudentMappingModel,
      user: userModel,
      feeGroupPromotionMapping: feeGroupPromotionMappingModel,
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
    .where(
      and(
        eq(studentModel.uid, studentUid),
        eq(feeStructureModel.id, feeStructureId),
        // eq(feeStudentMappingModel.totalPayable, totalAmount),
        // ilike(feeSlabModel.name, feeSlab.trim()),
      ),
    );

  let feeStudentMapping: FeeStudentMappingT | undefined =
    tmpResult[0]?.feeStudentMapping;
  let user = tmpResult[0]?.user ?? undefined;
  let feeGroupPromotionMapping =
    tmpResult[0]?.feeGroupPromotionMapping ?? undefined;

  console.log(
    feeStructureId,
    feeStudentMapping,
    user,
    feeGroupPromotionMapping,
    feeSlab,
    studentUid,
  );
  if (!tmpResult[0]?.feeStudentMapping) {
    console.log("feeStudentMapping not found");
    // throw Error("feeStudentMapping not found");
  }

  //   user = tmpResult[0]?.user ?? undefined;
  //   feeGroupPromotionMapping =
  //     tmpResult[0]?.feeGroupPromotionMapping ?? undefined;

  //   feeStudentMapping = tmpResult[0]!.feeStudentMapping;
  console.log("Saving feeStudentMapping!", feeSlab);

  // Update the slabs, if changed
  if (feeSlab.trim() != "Slab F") {
    const tmpFg = await db
      .select({ feeGroup: feeGroupModel })
      .from(feeGroupModel)
      .leftJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
      .where(ilike(feeSlabModel.name, feeSlab.trim()));

    if (!tmpFg[0]?.feeGroup) {
      console.log("Fee Group / Slab - Not Found!", feeSlab.trim());
      await captureErrorRows("Fee Group / Slab - Not Found!", studentRows);
      return;
      // throw Error("Fee Group - Not Found!"); // TODO
    }

    console.log("Fee Slab Provided:", feeSlab);
    console.log(tmpFg);
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

  console.log(feeStudentMapping);

  if (!feeStudentMapping) {
    console.log("feeStudentMapping - Not Found!", feeSlab.trim());
    await captureErrorRows("Fee-Student Mapping - Not Found!", studentRows);
    return;
  }

  [feeStudentMapping] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));

  // Update the payment fields, if done
  let paymentId: number | null = null;
  if (amountPaid) {
    const [savedPayment] = await db
      .insert(paymentModel)
      .values({
        userId: user?.id,
        context: "ADMISSION",
        amount: feeStudentMapping.totalPayable,
        status: "SUCCESS",
        paymentMode: "CASH",
        txnDate,
      })
      .returning();
    paymentId = savedPayment?.id!;
  }

  // Update the fee-student mapping fields
  await db
    .update(feeStudentMappingModel)
    .set({
      amountPaid: amountPaid ? feeStudentMapping.totalPayable : null,
      challanGeneratedAt: formatDate(txnDate),
      receiptNumber: challanNumber,
      paymentId,
    })
    .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!))
    .returning();

  console.log("Saved feeStudentMapping!");
}

async function syncLegacyFeeStructure(
  studentRows: LegacyStudentFeeMappingRow[],
  legacyFeeStructureId: number,
  masterData: MasterDataType,
) {
  //   console.log("in syncLegacyFeeStructure(), studentRows", studentRows);

  const [result] = (await mysqlConnection.query(`
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
        WHERE sess.id >= 18 AND fsm.id = ${legacyFeeStructureId}
        ORDER BY sess.sessionName DESC, fsm.id, fsb.index_col;
    `)) as [LegacyFeeStructureRow[], unknown];

  //   console.log("in syncLegacyFeeStructure(), result", result);

  // Step 1: Try fetching with batch details if not found with legacy_fee_structure_id

  console.log(
    "syncLegacyFeeStructure() | Step 2 (optional): Try fetching with batch details if not found with legacy_fee_structure_id",
  );
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

  console.log(
    `result[0].legacyReceiptTypeId: ${result[0].legacyReceiptTypeId}`,
  );
  console.log(`result[0].legacySessionId: ${result[0].legacySessionId}`);
  console.log(`result[0].course.trim(): ${result[0].course.trim()}`);
  console.log(`result[0].legacyShiftId: ${result[0].legacyShiftId}`);
  console.log(`tmpResult:`, tmpResult);

  if (tmpResult[0]?.feeStructure) {
    const [{ feeStructure }] = tmpResult;
    console.log("syncLegacyFeeStructure() | Update the fields");
    // Update the fields
    return await updateFeeStructure(
      studentRows,
      feeStructure,
      result,
      masterData,
    );
  } else {
    console.log(
      "syncLegacyFeeStructure() | Fee Structure - Not Found!, capturing entries",
    );
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
  console.log(
    "updateFeeStructure() | Update the fee structure fields",
    feeStructure,
  );
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

  console.log("updateFeeStructure() | Update the fee-structure-components");
  // Update the fee-structure-components
  const savedFeeStructureComponents: FeeStructureComponentT[] = [];
  for (const row of legacyFeeStructureRows) {
    const feeHead = masterData.feeHeads.find(
      (fh) => fh.legacyFeeHeadId == row.legacyFeeHeadId,
    );

    if (!feeHead) {
      console.log(
        "updateFeeStructure() | Fee Head Not Found!, capturing the entries",
      );
      await captureErrorRows(
        `Fee Head Not Found: ${row.fee_head}`,
        studentRows,
      );
      continue;
    }

    console.log("updateFeeStructure() | Save the fee-structure components");
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
}

async function syncLegacyReceiptTypes() {
  const [legacyReceiptTypes] = (await mysqlConnection.query(`
        SELECT * FROM studentfeesreceipttype;
    `)) as [LegacyReceiptType[], unknown];

  const receiptTypes: ReceiptTypeT[] = [];
  for (const { id, ...row } of legacyReceiptTypes) {
    const [existingReceiptType] = await db
      .select()
      .from(receiptTypeModel)
      .where(ilike(receiptTypeModel.name, row.name.trim()));
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
      receiptTypes.push(updatedReceiptType);
    } else {
      const [createdReceiptType] = await db
        .insert(receiptTypeModel)
        .values({
          legacyReceiptTypeId: id,
          ...row,
          name: row.name.trim(),
        })
        .returning();
      receiptTypes.push(createdReceiptType);
    }
  }

  return receiptTypes;
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
