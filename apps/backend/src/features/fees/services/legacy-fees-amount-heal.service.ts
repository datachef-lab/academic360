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
  HEAL_APPROVAL_USER_ID,
} from "./fee-student-mapping-slab-reassign.service.js";

// Bumped to -v2 when the heal learned to resolve concession slabs directly
// from studentfeesconcessiontab (section-less + no-installment cases, the 0017
// Sem IV cohort). Bumping the marker makes the boot heal run ONCE MORE on the
// next restart to repair mappings loaded before that fix, then it is
// marker-guarded again (no repeated runs, no resets on later restarts).
const MARKER_NAME = "legacy-fees-slab-heal-v2";

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
  mappingsSkippedManual: number;
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
    // If set, restrict the heal to just these UIDs (a TARGETED run — used to
    // heal a freshly-imported batch right after the import loop). A targeted
    // run NEVER touches the global `legacy-fees-amount-heal` marker: it neither
    // checks it (so it always runs) nor writes it (so it can't mask a later
    // full run). The global boot heal keeps its one-shot marker semantics.
    uids?: string[];
  } = {},
): Promise<FeeAmountHealResult> {
  const commit = options.commit !== false;
  const force = options.force === true;
  const sampleLimit = options.sampleLimit ?? 20;
  const progress = options.onProgress ?? (() => {});
  const unresolvedReportPath = options.unresolvedReportPath?.trim() || null;
  // Sanitised, de-duplicated UID scope (alphanumeric codeNumbers only). Empty
  // array or undefined => full run; a non-empty list => targeted run.
  const scopedUids = options.uids
    ? [
        ...new Set(
          options.uids
            .map((u) => String(u ?? "").trim())
            .filter((u) => /^[a-zA-Z0-9]+$/.test(u)),
        ),
      ]
    : null;
  const isTargeted = scopedUids != null && scopedUids.length > 0;
  const allUnresolved: UnresolvedRow[] = [];

  const result: FeeAmountHealResult = {
    studentsInScope: 0,
    irpRowsPulled: 0,
    mappingsChecked: 0,
    mappingsMatched: 0,
    mappingsMismatched: 0,
    mappingsReassigned: 0,
    mappingsUnresolved: 0,
    mappingsSkippedManual: 0,
    paymentsUpdated: 0,
    skippedOutOfScope: 0,
    sampleReassigned: [],
    sampleUnresolved: [],
  };

  // Caller asked for a targeted run but no UID survived sanitisation — do
  // nothing rather than silently widening to a full-DB heal.
  if (scopedUids != null && !isTargeted) {
    result.skipped = true;
    result.skipReason = "no valid UIDs to heal";
    return result;
  }

  // Marker guard applies to FULL runs only. A targeted run always executes and
  // never reads/writes the marker (see the `uids` option doc above).
  if (!isTargeted && commit && !force) {
    const marker = await getBootMigrationMarker(MARKER_NAME);
    if (marker) {
      result.skipped = true;
      result.skipReason = `already ran on ${marker.ran_at.toISOString()}; pass --force to re-run`;
      return result;
    }
  }

  // --- Step 1: pull all in-scope mappings from new DB in one query.
  // A targeted run restricts to the given UIDs (already sanitised alphanumeric).
  progress("Loading new-DB mappings…");
  const mappingUidClause = isTargeted
    ? ` AND st.uid IN (${scopedUids.map((u) => `'${u}'`).join(",")})`
    : "";
  const mapRes = await db.execute(
    `SELECT fsm.id                                                AS mapping_id,
            fsm.fee_structure_id_fk                               AS fee_structure_id,
            fgpm.id                                               AS fgpm_id,
            fgpm.approval_type                                    AS fgpm_approval_type,
            fgpm.approval_user_id_fk                              AS fgpm_approval_user_id,
            fg.fee_slab_id_fk                                     AS assigned_slab_id,
            fsl.name                                              AS assigned_slab_name,
            st.uid                                                AS uid,
            ay.year                                               AS year,
            cls.name                                              AS class_name,
            rt.name                                               AS receipt_type,
            rt.legacy_receipt_type_id                             AS legacy_receipt_type_id,
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
     WHERE st.uid IS NOT NULL AND st.uid <> ''${mappingUidClause}`,
  );
  const mappingRows = ((mapRes as any).rows ?? (mapRes as any)) as Array<{
    mapping_id: number;
    fee_structure_id: number;
    fgpm_id: number | null;
    fgpm_approval_type: string | null;
    fgpm_approval_user_id: number | null;
    assigned_slab_id: number | null;
    assigned_slab_name: string | null;
    uid: string;
    year: string;
    class_name: string;
    receipt_type: string;
    legacy_receipt_type_id: number | null;
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
            fsm.receipttype                                    AS legacy_receipt_type_id,
            inst.amount                                        AS installment_amount,
            COALESCE(csm.name, '')                             AS fee_slab
     FROM studentinstlmain inst
     JOIN studentpersonaldetails spd ON spd.id = inst.stdid
     JOIN feesstructuremaintab   fsm ON fsm.id = inst.structid
     JOIN currentsessionmaster   sess ON sess.id = fsm.sessionid
     JOIN classes                cl  ON cl.id  = fsm.classId
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
      legacy_receipt_type_id: number | string;
      installment_amount: number | string;
      fee_slab: string;
    }>,
    unknown,
  ];
  result.irpRowsPulled = irpRows.length;
  progress(`  ${irpRows.length} IRP installments loaded`);

  // --- Step 2b: pull IRP concession slabs DIRECTLY (not via an installment).
  // The installment query above can only reach a concession that hangs off a
  // studentinstlmain row. A concession-holder IRP has not billed yet (no
  // installment — the 0017 Sem IV case) never appears there, so their new-DB
  // mapping stays on the default Slab F (full fee). Read the concession tab on
  // its own so the slab is reachable independent of any installment.
  // Section-less by design (the concession's own section can differ from the
  // student's historicalrecord section, and no concession group spans
  // conflicting slabs — verified in IRP).
  const [concessionRows] = (await mysqlConnection.query(
    `SELECT spd.codeNumber AS uid,
            CONCAT(SUBSTRING(sess.sessionName, 1, 4),'-', RIGHT(sess.sessionName, 2)) AS year,
            cl.classname                                       AS class_name,
            sct.receipttypeid                                  AS legacy_receipt_type_id,
            COALESCE(csm.name, '')                             AS fee_slab
     FROM studentfeesconcessiontab sct
     JOIN studentpersonaldetails spd  ON spd.id  = sct.student_id
     JOIN currentsessionmaster   sess ON sess.id = sct.sessionid
     JOIN classes                cl   ON cl.id   = sct.classid
     JOIN studentfeesconcessionslab csm ON csm.id = sct.slabid
     WHERE sess.sessionName IS NOT NULL
       AND COALESCE(csm.name, '') <> ''
       AND spd.codeNumber IN (${uidList})`,
  )) as [
    Array<{
      uid: string;
      year: string;
      class_name: string;
      legacy_receipt_type_id: number | string;
      fee_slab: string;
    }>,
    unknown,
  ];
  progress(`  ${concessionRows.length} IRP concession rows loaded`);

  // Batch key = uid | year | CLASS | legacyReceiptTypeId. The legacy
  // receipt-type id lines up legacy "Annual Fees" (id 2) with the new
  // "Enrolment Fee" (which the import stamped with legacy_receipt_type_id = 2)
  // — reusing that already-correct id bridge, NOT re-comparing receipt names.
  const batchKey = (
    uid: unknown,
    year: unknown,
    className: unknown,
    legacyReceiptTypeId: unknown,
  ) =>
    `${trimStr(uid)}|${trimStr(year)}|${normUpper(className)}|${trimStr(legacyReceiptTypeId)}`;

  // --- Step 3: group IRP installment totals + slab per batch.
  const irpBatches = new Map<IrpBatchKey, IrpBatch>();
  for (const r of irpRows) {
    const key = batchKey(r.uid, r.year, r.class_name, r.legacy_receipt_type_id);
    const cur = irpBatches.get(key) ?? { total: 0, rawSlab: null };
    cur.total += toInt(r.installment_amount);
    if (!cur.rawSlab && trimStr(r.fee_slab)) cur.rawSlab = trimStr(r.fee_slab);
    irpBatches.set(key, cur);
  }

  // Concession slab letter per batch, from the direct read — populated even
  // when there is no installment. All rows of a batch share one slab (verified:
  // 0 conflicting-slab groups), so the first non-empty letter wins.
  const concessionSlabByBatch = new Map<string, string>();
  for (const r of concessionRows) {
    const key = batchKey(r.uid, r.year, r.class_name, r.legacy_receipt_type_id);
    if (!concessionSlabByBatch.has(key) && trimStr(r.fee_slab)) {
      concessionSlabByBatch.set(key, trimStr(r.fee_slab));
    }
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

    // Never revert a mapping an ADMIN manually approved. The loader and this
    // heal stamp their OWN reassignments MANUAL + approvalUserId =
    // HEAL_APPROVAL_USER_ID (41), so those stay eligible for an idempotent
    // re-heal; a genuine staff edit is MANUAL with a different (or null) user
    // id — leave it exactly as the admin set it.
    if (
      m.fgpm_approval_type === "MANUAL" &&
      m.fgpm_approval_user_id !== HEAL_APPROVAL_USER_ID
    ) {
      result.mappingsSkippedManual += 1;
      continue;
    }

    const key = batchKey(m.uid, m.year, m.class_name, m.legacy_receipt_type_id);
    const irp = irpBatches.get(key);
    // The concession slab letter IRP recorded for this batch — from the
    // installment-anchored join if present, else the section-less direct read
    // (which exists even when IRP has raised no installment yet).
    const concessionLetter =
      (irp && irp.rawSlab) || concessionSlabByBatch.get(key) || null;

    const currentPayable = toInt(m.total_payable);
    const currentPaid = toInt(m.amount_paid);

    // === Case A: IRP has billed this batch (an installment exists). ===
    if (irp && irp.total > 0) {
      // Assigned-slab sum: what total_payable SHOULD be given the current fgpm.
      const assignedSlabSum =
        m.assigned_slab_id != null
          ? (slabSums.get(`${m.fee_structure_id}|${m.assigned_slab_id}`) ??
            null)
          : null;

      // amount_paid is null for unpaid mappings — that's the expected shape,
      // not a mismatch. Only demand paid == IRP when a payment has actually
      // been recorded on the mapping.
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
      // letter resolves to the default "Slab F" (Admission-Fees cohort).
      let slabName: string | null = null;
      let resolvedBy: "slab-name" | "component-sum" = "slab-name";
      if (concessionLetter) {
        slabName = resolveLegacySlabName(concessionLetter, m.year);
      }
      if (!slabName || slabName === "Slab F") {
        const match = await findFeeSlabByComponentSum(
          m.fee_structure_id,
          irp.total,
        );
        if (match) {
          slabName = match.slabName;
          resolvedBy = "component-sum";
        } else if (concessionLetter) {
          // IRP DID give a letter — trust it even if it resolved to Slab F
          // (student really is on the default full-fee slab; the mismatch is
          // amount-only, not slab-only).
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
      continue;
    }

    // === Case B: IRP has NOT billed this batch (no installment). ===
    // The 0017 Sem IV case: a concession-holder IRP has not yet raised an
    // installment for. If IRP recorded a concession slab for the batch, an
    // UNPAID default Slab-F mapping is over-charging the student — repoint it
    // to the concession slab so the console shows the correct (FA) amount.
    // NEVER touch a paid mapping (decision 0017's rule).
    if (!concessionLetter) continue;
    const targetSlab = resolveLegacySlabName(concessionLetter, m.year);
    // A concession that resolves to the full-fee slab is no discount — skip.
    if (!targetSlab || targetSlab === "Slab F") continue;
    // Paid mapping: leave it for manual review, never auto-alter (0017).
    if (m.amount_paid != null) continue;
    const assignedName = trimStr(m.assigned_slab_name);
    if (assignedName.toLowerCase() === targetSlab.toLowerCase()) {
      result.mappingsMatched += 1;
      continue;
    }
    result.mappingsMismatched += 1;
    plans.push({
      mappingId: m.mapping_id,
      feeStructureId: m.fee_structure_id,
      uid: trimStr(m.uid),
      year: trimStr(m.year),
      className: trimStr(m.class_name),
      receiptType: trimStr(m.receipt_type),
      currentPayable,
      // No installment billed yet; the target is the concession slab's
      // component sum, filled in by the reassign step.
      irpAmount: 0,
      slabName: targetSlab,
      resolvedBy: "slab-name",
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
