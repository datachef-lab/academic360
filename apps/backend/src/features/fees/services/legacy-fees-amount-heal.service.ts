// Legacy-fees amount heal.
//
// Root cause this heals: the fresh-import loader points fee_student_mappings
// at a fee_group whose fee_slab is derived from IRP `Fee Slab`. When IRP
// carries an empty slab (typical for Admission-Fees installments, where the
// concession is expressed as an installment carve-out rather than a slab
// letter), the loader falls back to "Slab F" (default), and the mapping
// ends up on the full-fee group (e.g. 42,900 for a student who actually
// paid 12,440 under Slab A). Every downstream figure (total_payable,
// amount_paid, payments.amount) then reflects the wrong slab.
//
// The correct model is: mapping → fgpm → fee_group → fee_slab, and
// total_payable is DERIVED from SUM(fee_structure_components) filtered by
// (fee_structure_id, fee_slab_id). So the heal must fix the SLAB assignment,
// not overwrite total_payable in place — otherwise any code path that
// recomputes total_payable from the slab (e.g. saving a fee_structure edit)
// silently reverts the heal.
//
// The fresh-import loader already does the right thing (see
// legacy-fees-data.service.ts :: syncFeeStudentMapping, lines 792-822 +
// 846-863 + 984-990). That flow is extracted into
// reassignFeeStudentMappingSlab so the heal uses the SAME code path.
//
// Two slab-resolution modes per mismatched mapping:
//   1. IRP `Fee Slab` is non-empty → resolveLegacySlabName maps letter → name.
//   2. IRP `Fee Slab` is empty (Admission Fees) → findFeeSlabByComponentSum
//      back-solves the slab by matching IRP installment total against the
//      sum of each slab's components under the mapping's fee_structure.
//      Multi-match or no-match → the mapping is LEFT ALONE and reported for
//      manual review (never guess).
//
// "Internal-inconsistency" detection: a mapping whose stored total_payable
// does NOT equal SUM(components for the assigned slab) is also treated as
// mismatched. This catches (a) the state left by an earlier direct-overwrite
// heal (total_payable healed but fgpm still on wrong slab), and (b) any
// admin edit to total_payable that drifted away from the slab. Both must be
// repaired by pointing the mapping at the correct slab, else the next
// downstream recompute reverts the total.
//
// Scope exclusion (per Harsh's rule): mappings for
//   - academic year 2025-26, Semester I
//   - academic year 2026-27, Semester I
// are LEFT ALONE — those cohorts filled the new CU-reg form directly so
// their fees data is the authoritative source, not IRP.
//
// Safety against overwriting later admin edits: a marker table
// (`system_boot_migrations`). Once a commit run finishes, a marker is
// written; subsequent boots skip unless `--force` is passed. If you re-run
// with --force after admin edits have been made, be aware it will overwrite
// them — reserve --force for a one-time reconcile after a loader bug fix.
//
// Performance: bulk-loads all in-scope mappings + all IRP installments +
// all fee_structure_components in three queries; matches in memory. Slab
// reassignment then runs per-mapping (each call issues ~5 small queries via
// the shared helper), which for the current mismatch volume (~100s of
// mappings) completes in seconds.
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { db, mysqlConnection } from "@/db";
import {
  getBootMigrationMarker,
  setBootMigrationMarker,
} from "@/db/boot-migration-markers.js";

import { resolveLegacySlabName } from "./legacy-fees-data.service.js";
import {
  findFeeSlabByComponentSum,
  reassignFeeStudentMappingSlab,
} from "./fee-student-mapping-slab-reassign.service.js";

const MARKER_NAME = "legacy-fees-amount-heal";

export type FeeAmountHealResult = {
  skipped?: boolean;
  skipReason?: string;
  studentsInScope: number;
  irpRowsPulled: number;
  mappingsChecked: number;
  mappingsMatched: number;
  mappingsMismatched: number;
  mappingsReassigned: number;
  mappingsUnresolved: number;
  paymentsUpdated: number;
  skippedOutOfScope: number;
  sampleReassigned: Array<{
    uid: string;
    year: string;
    class: string;
    receiptType: string;
    slab: string;
    resolvedBy: "slab-name" | "component-sum";
    before: number;
    after: number;
    mode: "would-reassign" | "reassigned";
  }>;
  sampleUnresolved: Array<{
    uid: string;
    year: string;
    class: string;
    receiptType: string;
    irpAmount: number;
    currentPayable: number;
    reason: string;
  }>;
  unresolvedReportPath?: string;
};

type UnresolvedRow = {
  uid: string;
  year: string;
  class: string;
  receiptType: string;
  currentSlab: string;
  irpAmount: number;
  currentPayable: number;
  currentPaid: number | null;
  reason: string;
};

function toInt(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
const normUpper = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toUpperCase();
const trimStr = (s: unknown) => String(s ?? "").trim();

function isOutOfScope(year: string, className: string): boolean {
  const c = normUpper(className);
  return (
    (year === "2025-26" && c === "SEMESTER I") ||
    (year === "2026-27" && c === "SEMESTER I")
  );
}

type IrpBatchKey = string; // `${uid}|${year}|${class}|${receiptType}`

type IrpBatch = {
  total: number;
  // The IRP `Fee Slab` letter, if IRP has a non-empty one anywhere in the
  // batch. Batches typically carry a single slab across all their heads;
  // if IRP disagrees within a batch (rare) we take the first non-empty.
  rawSlab: string | null;
};

export async function runLegacyFeesAmountHeal(
  options: {
    commit?: boolean;
    force?: boolean;
    sampleLimit?: number;
    onProgress?: (msg: string) => void;
    // If set, write the FULL list of unresolved mappings to this .xlsx path
    // (parent dir is created if missing). Independent of sampleLimit, which
    // only bounds the in-result preview.
    unresolvedReportPath?: string;
  } = {},
): Promise<FeeAmountHealResult> {
  const commit = options.commit !== false;
  const force = options.force === true;
  const sampleLimit = options.sampleLimit ?? 20;
  const progress = options.onProgress ?? (() => {});
  const unresolvedReportPath = options.unresolvedReportPath?.trim() || null;
  const allUnresolved: UnresolvedRow[] = [];

  const result: FeeAmountHealResult = {
    studentsInScope: 0,
    irpRowsPulled: 0,
    mappingsChecked: 0,
    mappingsMatched: 0,
    mappingsMismatched: 0,
    mappingsReassigned: 0,
    mappingsUnresolved: 0,
    paymentsUpdated: 0,
    skippedOutOfScope: 0,
    sampleReassigned: [],
    sampleUnresolved: [],
  };

  if (commit && !force) {
    const marker = await getBootMigrationMarker(MARKER_NAME);
    if (marker) {
      result.skipped = true;
      result.skipReason = `already ran on ${marker.ran_at.toISOString()}; pass --force to re-run`;
      return result;
    }
  }

  // --- Step 1: pull all in-scope mappings from new DB in one query.
  progress("Loading new-DB mappings…");
  const mapRes = await db.execute(
    `SELECT fsm.id                                                AS mapping_id,
            fsm.fee_structure_id_fk                               AS fee_structure_id,
            fgpm.id                                               AS fgpm_id,
            fg.fee_slab_id_fk                                     AS assigned_slab_id,
            fsl.name                                              AS assigned_slab_name,
            st.uid                                                AS uid,
            ay.year                                               AS year,
            cls.name                                              AS class_name,
            rt.name                                               AS receipt_type,
            COALESCE(fsm.total_payable, 0)                        AS total_payable,
            fsm.amount_paid                                       AS amount_paid
     FROM fee_student_mappings fsm
     JOIN fee_structures fs      ON fs.id = fsm.fee_structure_id_fk
     JOIN academic_years ay      ON ay.id = fs.academic_year_id_fk
     JOIN classes cls            ON cls.id = fs.class_id_fk
     JOIN receipt_types rt       ON rt.id = fs.receipt_type_id_fk
     JOIN students st            ON st.id = fsm.student_id_fk
     LEFT JOIN fee_group_promotion_mappings fgpm
              ON fgpm.id = fsm.fee_group_promotion_mapping_id_fk
     LEFT JOIN fee_groups fg     ON fg.id = fgpm.fee_group_id_fk
     LEFT JOIN fee_slabs fsl     ON fsl.id = fg.fee_slab_id_fk
     WHERE st.uid IS NOT NULL AND st.uid <> ''`,
  );
  const mappingRows = ((mapRes as any).rows ?? (mapRes as any)) as Array<{
    mapping_id: number;
    fee_structure_id: number;
    fgpm_id: number | null;
    assigned_slab_id: number | null;
    assigned_slab_name: string | null;
    uid: string;
    year: string;
    class_name: string;
    receipt_type: string;
    total_payable: number | string;
    amount_paid: number | string | null;
  }>;

  const uidsInScope = new Set<string>();
  const feeStructureIdsInScope = new Set<number>();
  for (const m of mappingRows) {
    if (isOutOfScope(m.year, m.class_name)) continue;
    uidsInScope.add(String(m.uid).trim());
    if (m.fee_structure_id != null)
      feeStructureIdsInScope.add(m.fee_structure_id);
  }
  result.studentsInScope = uidsInScope.size;
  progress(
    `  ${mappingRows.length} mappings loaded; ${uidsInScope.size} students in scope`,
  );

  if (uidsInScope.size === 0) {
    if (commit) {
      try {
        await setBootMigrationMarker(MARKER_NAME, {
          note: "no students in scope",
          ...result,
        });
      } catch {
        // non-fatal
      }
    }
    return result;
  }

  // --- Step 2: pull all IRP installments + slab letters for those uids in ONE query.
  progress("Loading IRP installments (bulk)…");
  const uidList = [...uidsInScope]
    .filter((u) => /^[a-zA-Z0-9]+$/.test(u))
    .map((u) => `'${u}'`)
    .join(",");
  if (!uidList) {
    progress("  No sanitisable UIDs; nothing to do");
    if (commit) {
      try {
        await setBootMigrationMarker(MARKER_NAME, {
          note: "no sanitisable uids",
        });
      } catch {
        // non-fatal
      }
    }
    return result;
  }
  // Join studentfeesconcessiontab + studentfeesconcessionslab (anchored on
  // FSM batch cols, matching the fresh-import query at
  // legacy-fees-data.service.ts:224-232) to surface the slab letter IRP
  // actually used for each batch. May be empty (Admission Fees) — that's
  // handled downstream via component-sum back-solve.
  const [irpRows] = (await mysqlConnection.query(
    `SELECT spd.codeNumber AS uid,
            CONCAT(SUBSTRING(sess.sessionName, 1, 4),'-', RIGHT(sess.sessionName, 2)) AS year,
            cl.classname                                       AS class_name,
            rt.name                                            AS receipt_type,
            inst.amount                                        AS installment_amount,
            COALESCE(csm.name, '')                             AS fee_slab
     FROM studentinstlmain inst
     JOIN studentpersonaldetails spd ON spd.id = inst.stdid
     JOIN feesstructuremaintab   fsm ON fsm.id = inst.structid
     JOIN currentsessionmaster   sess ON sess.id = fsm.sessionid
     JOIN classes                cl  ON cl.id  = fsm.classId
     JOIN studentfeesreceipttype rt  ON rt.id  = fsm.receipttype
     LEFT JOIN studentfeesconcessiontab sct ON (
         sct.student_id = spd.id
         AND sct.courseid = fsm.courseId
         AND sct.classid = fsm.classId
         AND sct.sessionid = fsm.sessionid
         AND sct.shiftid = fsm.shiftId
         AND sct.receipttypeid = fsm.receipttype
     )
     LEFT JOIN studentfeesconcessionslab csm ON csm.id = sct.slabid
     WHERE sess.sessionName IS NOT NULL
       AND spd.codeNumber IN (${uidList})`,
  )) as [
    Array<{
      uid: string;
      year: string;
      class_name: string;
      receipt_type: string;
      installment_amount: number | string;
      fee_slab: string;
    }>,
    unknown,
  ];
  result.irpRowsPulled = irpRows.length;
  progress(`  ${irpRows.length} IRP installments loaded`);

  // --- Step 3: group IRP totals + slab per (uid, year, class, receipt_type).
  const irpBatches = new Map<IrpBatchKey, IrpBatch>();
  for (const r of irpRows) {
    const key = `${trimStr(r.uid)}|${trimStr(r.year)}|${normUpper(r.class_name)}|${trimStr(r.receipt_type)}`;
    const cur = irpBatches.get(key) ?? { total: 0, rawSlab: null };
    cur.total += toInt(r.installment_amount);
    if (!cur.rawSlab && trimStr(r.fee_slab)) cur.rawSlab = trimStr(r.fee_slab);
    irpBatches.set(key, cur);
  }

  // --- Step 4: bulk-load slab sums for internal-inconsistency detection.
  // Fetches components for the union of in-scope fee_structure_ids only.
  progress("Loading slab sums…");
  const fsIdList = [...feeStructureIdsInScope]
    .filter((n) => Number.isFinite(n))
    .join(",");
  const slabSums = new Map<string, number>(); // `${feeStructureId}|${slabId}` -> sum
  if (fsIdList) {
    const compRes = await db.execute(
      `SELECT fee_structure_id_fk AS fee_structure_id,
              fee_slab_id_fk      AS fee_slab_id,
              amount
       FROM fee_structure_components
       WHERE fee_structure_id_fk IN (${fsIdList})`,
    );
    const compRows = ((compRes as any).rows ?? (compRes as any)) as Array<{
      fee_structure_id: number;
      fee_slab_id: number | null;
      amount: number | string | null;
    }>;
    for (const r of compRows) {
      if (r.fee_slab_id == null) continue;
      const key = `${r.fee_structure_id}|${r.fee_slab_id}`;
      slabSums.set(key, (slabSums.get(key) ?? 0) + toInt(r.amount));
    }
  }
  progress(`  ${slabSums.size} (fee_structure, slab) sums indexed`);

  // --- Step 5: classify each mapping.
  type Plan = {
    mappingId: number;
    feeStructureId: number;
    uid: string;
    year: string;
    className: string;
    receiptType: string;
    currentPayable: number;
    irpAmount: number;
    slabName: string; // resolved target slab name
    resolvedBy: "slab-name" | "component-sum";
  };
  const plans: Plan[] = [];

  progress("Comparing new-DB vs IRP…");
  for (const m of mappingRows) {
    if (isOutOfScope(m.year, m.class_name)) {
      result.skippedOutOfScope += 1;
      continue;
    }
    result.mappingsChecked += 1;

    const key = `${trimStr(m.uid)}|${trimStr(m.year)}|${normUpper(m.class_name)}|${trimStr(m.receipt_type)}`;
    const irp = irpBatches.get(key);
    if (!irp || irp.total <= 0) continue;

    const currentPayable = toInt(m.total_payable);
    const currentPaid = toInt(m.amount_paid);
    // Assigned-slab sum: what total_payable SHOULD be given the current fgpm.
    const assignedSlabSum =
      m.assigned_slab_id != null
        ? (slabSums.get(`${m.fee_structure_id}|${m.assigned_slab_id}`) ?? null)
        : null;

    // amount_paid is null for unpaid mappings — that's the expected shape, not
    // a mismatch. Only demand paid == IRP when a payment has actually been
    // recorded on the mapping.
    const amountMatchesIrp =
      currentPayable === irp.total &&
      (m.amount_paid == null || currentPaid === irp.total);
    const internallyConsistent =
      assignedSlabSum != null && currentPayable === assignedSlabSum;

    if (amountMatchesIrp && internallyConsistent) {
      result.mappingsMatched += 1;
      continue;
    }
    result.mappingsMismatched += 1;

    // Resolve the target slab. Prefer IRP's own letter (concession cases);
    // fall back to component-sum back-solve when IRP is silent or when the
    // letter resolves to the default "Slab F" (i.e. IRP has no meaningful
    // slab info for this batch — the Admission-Fees cohort).
    let slabName: string | null = null;
    let resolvedBy: "slab-name" | "component-sum" = "slab-name";
    if (irp.rawSlab) {
      slabName = resolveLegacySlabName(irp.rawSlab, m.year);
    }
    if (!slabName || slabName === "Slab F") {
      const match = await findFeeSlabByComponentSum(
        m.fee_structure_id,
        irp.total,
      );
      if (match) {
        slabName = match.slabName;
        resolvedBy = "component-sum";
      } else if (irp.rawSlab) {
        // IRP DID give a letter — trust it even if it resolved to Slab F
        // (i.e. student really is on the default full-fee slab; the
        // mismatch is amount-only, not slab-only).
      } else {
        slabName = null;
      }
    }

    if (!slabName) {
      result.mappingsUnresolved += 1;
      const row: UnresolvedRow = {
        uid: trimStr(m.uid),
        year: trimStr(m.year),
        class: trimStr(m.class_name),
        receiptType: trimStr(m.receipt_type),
        currentSlab: m.assigned_slab_name ?? "",
        irpAmount: irp.total,
        currentPayable,
        currentPaid: m.amount_paid == null ? null : currentPaid,
        reason: "no IRP slab letter and no unique component-sum match",
      };
      allUnresolved.push(row);
      if (result.sampleUnresolved.length < sampleLimit) {
        result.sampleUnresolved.push({
          uid: row.uid,
          year: row.year,
          class: row.class,
          receiptType: row.receiptType,
          irpAmount: row.irpAmount,
          currentPayable: row.currentPayable,
          reason: row.reason,
        });
      }
      continue;
    }

    plans.push({
      mappingId: m.mapping_id,
      feeStructureId: m.fee_structure_id,
      uid: trimStr(m.uid),
      year: trimStr(m.year),
      className: trimStr(m.class_name),
      receiptType: trimStr(m.receipt_type),
      currentPayable,
      irpAmount: irp.total,
      slabName,
      resolvedBy,
    });
  }

  progress(
    `  matched=${result.mappingsMatched}  mismatched=${result.mappingsMismatched}  ` +
      `plans=${plans.length}  unresolved=${result.mappingsUnresolved}`,
  );

  // --- Step 6: apply plans one-by-one via the shared helper.
  let n = 0;
  for (const p of plans) {
    n += 1;
    const outcome = await reassignFeeStudentMappingSlab(
      p.mappingId,
      p.slabName,
      { commit, updatePayments: true },
    );
    if (outcome.status === "reassigned") {
      result.mappingsReassigned += 1;
      result.paymentsUpdated += outcome.paymentsUpdated;
      if (result.sampleReassigned.length < sampleLimit) {
        result.sampleReassigned.push({
          uid: p.uid,
          year: p.year,
          class: p.className,
          receiptType: p.receiptType,
          slab: outcome.slabName,
          resolvedBy: p.resolvedBy,
          before: outcome.totalPayableBefore,
          after: outcome.totalPayableAfter,
          mode: commit ? "reassigned" : "would-reassign",
        });
      }
    } else if (outcome.status === "already-on-slab") {
      // Mapping's fgpm ALREADY points at the target slab, but total_payable
      // is wrong (drifted from slab sum). Repair by writing the derived
      // total. This is the shape left by an earlier direct-overwrite heal.
      // Do the fix inline rather than adding a whole "amount-only repair"
      // path to the helper — it's a narrow one-run situation.
      const slabSum = slabSums.get(
        `${p.feeStructureId}|${
          mappingRows.find((mm) => mm.mapping_id === p.mappingId)
            ?.assigned_slab_id ?? -1
        }`,
      );
      if (slabSum != null && commit) {
        await db.execute(
          `UPDATE fee_student_mappings
              SET total_payable = ${slabSum},
                  amount_paid = CASE WHEN amount_paid IS NOT NULL THEN ${slabSum} ELSE amount_paid END,
                  updated_at = now()
            WHERE id = ${p.mappingId}`,
        );
        const upd = await db.execute(
          `UPDATE payments SET amount = ${slabSum}
             WHERE fee_student_mapping_id_fk = ${p.mappingId}
               AND status = 'SUCCESS'
           RETURNING id`,
        );
        const affected = ((upd as any).rows ?? (upd as any)) as Array<{
          id: number;
        }>;
        result.paymentsUpdated += affected.length;
      }
      result.mappingsReassigned += 1;
      if (result.sampleReassigned.length < sampleLimit) {
        result.sampleReassigned.push({
          uid: p.uid,
          year: p.year,
          class: p.className,
          receiptType: p.receiptType,
          slab: outcome.slabName,
          resolvedBy: p.resolvedBy,
          before: p.currentPayable,
          after: slabSum ?? p.currentPayable,
          mode: commit ? "reassigned" : "would-reassign",
        });
      }
    } else {
      result.mappingsUnresolved += 1;
      const mm = mappingRows.find((mr) => mr.mapping_id === p.mappingId);
      allUnresolved.push({
        uid: p.uid,
        year: p.year,
        class: p.className,
        receiptType: p.receiptType,
        currentSlab: mm?.assigned_slab_name ?? "",
        irpAmount: p.irpAmount,
        currentPayable: p.currentPayable,
        currentPaid: mm?.amount_paid == null ? null : toInt(mm.amount_paid),
        reason: `helper returned ${outcome.status}`,
      });
      if (result.sampleUnresolved.length < sampleLimit) {
        result.sampleUnresolved.push({
          uid: p.uid,
          year: p.year,
          class: p.className,
          receiptType: p.receiptType,
          irpAmount: p.irpAmount,
          currentPayable: p.currentPayable,
          reason: `helper returned ${outcome.status}`,
        });
      }
    }
    if (n % 25 === 0 || n === plans.length) {
      progress(`  reassigned ${n}/${plans.length}`);
    }
  }

  if (commit) {
    try {
      await setBootMigrationMarker(MARKER_NAME, {
        ran_at: new Date().toISOString(),
        studentsInScope: result.studentsInScope,
        mappingsChecked: result.mappingsChecked,
        mappingsReassigned: result.mappingsReassigned,
        mappingsUnresolved: result.mappingsUnresolved,
        paymentsUpdated: result.paymentsUpdated,
      });
    } catch (err) {
      console.warn(
        `[fees-heal] Failed to write marker (heal succeeded): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  // --- Step 7: optionally write the full unresolved list to xlsx.
  if (unresolvedReportPath && allUnresolved.length > 0) {
    try {
      const abs = path.resolve(unresolvedReportPath);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      await writeUnresolvedXlsx(abs, allUnresolved);
      result.unresolvedReportPath = abs;
      progress(`  unresolved report → ${abs}`);
    } catch (err) {
      console.warn(
        `[fees-heal] Failed to write unresolved xlsx: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return result;
}

async function writeUnresolvedXlsx(
  filePath: string,
  rows: UnresolvedRow[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Unresolved Fees");
  sheet.columns = [
    { header: "UID", key: "uid", width: 16 },
    { header: "Academic Year", key: "year", width: 14 },
    { header: "Class", key: "class", width: 16 },
    { header: "Receipt Type", key: "receiptType", width: 20 },
    { header: "Current Slab", key: "currentSlab", width: 14 },
    { header: "IRP Amount", key: "irpAmount", width: 14 },
    { header: "Current Payable", key: "currentPayable", width: 16 },
    { header: "Current Paid", key: "currentPaid", width: 14 },
    { header: "Reason", key: "reason", width: 60 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  header.alignment = { horizontal: "center", vertical: "middle" };
  for (const r of rows) sheet.addRow(r);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(filePath, new Uint8Array(buffer));
}
