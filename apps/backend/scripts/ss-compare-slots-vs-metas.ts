/**
 * Phase E guard: proves the meta-driven dropdowns show the SAME subjects the
 * hardcoded slots showed.
 *
 * The old forms derived each dropdown client-side: bucket paperOptions by
 * subject-type name/code, then filter by a semester roman parsed out of
 * class.name. This script re-implements that bucketing verbatim (ported from
 * subject-selection-form.tsx / SubjectSelectionForm.tsx) and diffs it against
 * the server-built `perMetaOptions`.
 *
 * Every slot/meta pair is classified:
 *   MATCH     - both present, identical subject-name sets  (the goal)
 *   DIFF      - both present, sets differ                  (a regression)
 *   OLD_ONLY  - slot had options but no meta matches it    (dropdown that
 *               rendered before but whose save silently dropped, since
 *               findMetaId would return null)
 *   NEW_ONLY  - meta has options but no old slot maps to it
 */
import "dotenv/config";
import { pool } from "../src/db/index.js";
import { findSubjectsSelections } from "../src/features/subject-selection/services/student-subjects.service.js";

// ---- ported verbatim from the forms -------------------------------------
const romanMap: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
};

function extractSemesterRoman(name?: string | null): string {
  if (!name) return "";
  const upper = String(name).toUpperCase();
  const romanMatch = upper.match(/\b(I|II|III|IV|V|VI)\b/);
  if (romanMatch) return romanMatch[1];
  const digitMatch = upper.match(/\b([1-6])\b/);
  return digitMatch ? romanMap[digitMatch[1]] || "" : "";
}

const isMinor = (n = "", c = "") =>
  n.toUpperCase().includes("MINOR") || c?.toUpperCase() === "MN";
const isIDC = (n = "", c = "") =>
  n.toUpperCase().includes("INTERDISCIPLINARY") ||
  n.toUpperCase().includes("INTER DISCIPLINARY") ||
  c?.toUpperCase() === "IDC";
const isAEC = (n = "", c = "") =>
  n.toUpperCase().includes("ABILITY ENHANCEMENT") || c?.toUpperCase() === "AEC";
const isCVAC = (n = "", c = "") =>
  n.toUpperCase().includes("COMMON VALUE ADDED") || c?.toUpperCase() === "CVAC";

const dedupe = (arr: string[]) => [...new Set(arr.filter(Boolean))];

/** The 8 hardcoded slots: which subject type, which semesters. */
const SLOTS: {
  slot: string;
  code: string;
  sems: string[];
  match: (n: string, c: string) => boolean;
}[] = [
  { slot: "minor1", code: "MN", sems: ["I", "II"], match: isMinor },
  { slot: "minor2", code: "MN", sems: ["III", "IV"], match: isMinor },
  { slot: "minor3", code: "MN", sems: ["III"], match: isMinor },
  { slot: "idc1", code: "IDC", sems: ["I"], match: isIDC },
  { slot: "idc2", code: "IDC", sems: ["II"], match: isIDC },
  { slot: "idc3", code: "IDC", sems: ["III"], match: isIDC },
  { slot: "aec3", code: "AEC", sems: ["III", "IV"], match: isAEC },
  { slot: "cvac4", code: "CVAC", sems: ["II"], match: isCVAC },
];

function oldSlotOptions(res: any, slot: (typeof SLOTS)[number]): string[] {
  const groups = res.studentSubjectsSelection ?? [];
  const group = groups.find((g: any) =>
    slot.match(g.subjectType?.name ?? "", g.subjectType?.code ?? ""),
  );
  if (!group) return [];
  const papers = (group.paperOptions ?? []).filter((p: any) =>
    slot.sems.includes(extractSemesterRoman(p?.class?.name)),
  );
  return dedupe(papers.map((p: any) => p?.subject?.name ?? ""));
}

function metaKey(codes: string | null, classNames: string[]): string {
  const sems = [...new Set(classNames.map(extractSemesterRoman))]
    .filter(Boolean)
    .sort();
  return `${(codes ?? "").toUpperCase()}|${sems.join(",")}`;
}

const setEq = (a: string[], b: string[]) => {
  const A = [...new Set(a)].sort();
  const B = [...new Set(b)].sort();
  return A.length === B.length && A.every((v, i) => v === B[i]);
};

async function main() {
  const ids = (process.env.SS_STUDENT_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);
  if (!ids.length) throw new Error("set SS_STUDENT_IDS=1,2,3");

  const tally = { MATCH: 0, DIFF: 0, OLD_ONLY: 0, NEW_ONLY: 0 };
  const problems: string[] = [];

  for (const studentId of ids) {
    const res: any = await findSubjectsSelections(studentId);
    const perMeta = res.perMetaOptions ?? [];

    // index metas by subjectTypeCode + semesters
    const byKey = new Map<string, any>();
    for (const m of perMeta)
      byKey.set(metaKey(m.subjectTypeCode, m.classNames), m);

    const seenMetaIds = new Set<number>();

    // The old forms did not render every slot they computed. Minor II showed
    // only when Minor I had options; Minor III only when Minor I had none
    // (the "BCOM" branch). Compare what was RENDERED, not what was computed.
    const minor1Opts = oldSlotOptions(res, SLOTS[0]!);
    const oldRendered = (slot: (typeof SLOTS)[number], opts: string[]) => {
      if (!opts.length) return false;
      if (slot.slot === "minor2") return minor1Opts.length > 0;
      if (slot.slot === "minor3") return minor1Opts.length === 0;
      return true;
    };

    for (const slot of SLOTS) {
      const computed = oldSlotOptions(res, slot);
      const oldOpts = oldRendered(slot, computed) ? computed : [];
      const key = `${slot.code}|${[...slot.sems].sort().join(",")}`;
      const meta = byKey.get(key);
      if (meta) seenMetaIds.add(meta.metaId);
      const newOpts = meta
        ? dedupe(meta.options.map((o: any) => o.subjectName))
        : [];

      if (!oldOpts.length && !newOpts.length) continue;
      if (oldOpts.length && !meta) {
        tally.OLD_ONLY++;
        problems.push(
          `student ${studentId} ${slot.slot}: OLD_ONLY (${oldOpts.length} opts, no meta for ${key})`,
        );
      } else if (!oldOpts.length && newOpts.length) {
        tally.NEW_ONLY++;
        problems.push(
          `student ${studentId} ${slot.slot}: NEW_ONLY meta=${meta.metaLabel} (${newOpts.length} opts)`,
        );
      } else if (setEq(oldOpts, newOpts)) {
        tally.MATCH++;
      } else {
        tally.DIFF++;
        const onlyOld = oldOpts.filter((o) => !newOpts.includes(o));
        const onlyNew = newOpts.filter((o) => !oldOpts.includes(o));
        problems.push(
          `student ${studentId} ${slot.slot} [${meta.metaLabel}]: DIFF -old:${JSON.stringify(onlyOld)} +new:${JSON.stringify(onlyNew)}`,
        );
      }
    }

    // metas with options that no old slot maps to
    for (const m of perMeta) {
      if (seenMetaIds.has(m.metaId)) continue;
      if (!m.options?.length) continue;
      tally.NEW_ONLY++;
      problems.push(
        `student ${studentId}: NEW_ONLY meta="${m.metaLabel}" src=${m.optionSource} (${m.options.length} opts)`,
      );
    }
  }

  console.log("\n===== SLOT vs META COMPARISON =====");
  console.table(tally);
  if (problems.length) {
    console.log("\n--- non-MATCH details ---");
    for (const p of problems) console.log("  " + p);
  }
  console.log(
    `\nVERDICT: ${tally.DIFF === 0 ? "PASS - no option-set differences" : `FAIL - ${tally.DIFF} differing dropdowns`}`,
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
