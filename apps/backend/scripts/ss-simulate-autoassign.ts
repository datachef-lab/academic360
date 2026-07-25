/**
 * Replays the form's auto-assign rules against real per-meta options and
 * compares them to what `main` would have done, for students who actually have
 * auto_assign papers.
 *
 * main's rules (subject-selection-form.tsx on main):
 *   AEC  : `if (!aec3 && autoAec)` -> filled on load.
 *   Minor: only once a minor is already selected — effects at 1290/1319 fill
 *          the *other* minor, and 1331/1349 force it back if displaced.
 * The refactor reproduces this via "single-slot category fills on load;
 * multi-slot category waits for the first pick".
 */
import "dotenv/config";
import { pool } from "../src/db/index.js";
import { findSubjectsSelections } from "../src/features/subject-selection/services/student-subjects.service.js";

type View = {
  metaId: number;
  label: string;
  code: string;
  sequence: number;
  options: string[];
  autos: string[];
};

function toViews(perMetaOptions: any[]): View[] {
  return perMetaOptions
    .map((m) => {
      const options: string[] = [];
      const autos: string[] = [];
      for (const o of m.options ?? []) {
        if (!o?.subjectName) continue;
        if (!options.includes(o.subjectName)) options.push(o.subjectName);
        if (o.autoAssign && !autos.includes(o.subjectName))
          autos.push(o.subjectName);
      }
      return {
        metaId: m.metaId,
        label: m.metaLabel,
        code: (m.subjectTypeCode ?? "").toUpperCase(),
        sequence: m.sequence ?? 0,
        options,
        autos,
      };
    })
    .sort((a, b) => a.sequence - b.sequence || a.metaId - b.metaId);
}

/** The refactored effect, transcribed. */
function applyAutoAssign(views: View[], selections: Record<number, string>) {
  const byCode = new Map<string, View[]>();
  for (const v of views) byCode.set(v.code, [...(byCode.get(v.code) ?? []), v]);

  const additions: Record<number, string> = {};
  for (const [, group] of byCode) {
    const autos = [...new Set(group.flatMap((v) => v.autos))];
    if (!autos.length) continue;
    const hasSelection = group.some((v) => selections[v.metaId]);
    if (group.length > 1 && !hasSelection) continue;
    for (const auto of autos) {
      if (group.some((v) => selections[v.metaId] === auto)) continue;
      const target = group.find(
        (v) =>
          !selections[v.metaId] &&
          !additions[v.metaId] &&
          v.options.includes(auto),
      );
      if (target) additions[target.metaId] = auto;
    }
  }
  return additions;
}

async function main() {
  const ids = (process.env.SS_STUDENT_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);

  let failures = 0;
  const check = (ok: boolean, msg: string) => {
    console.log(`    ${ok ? "PASS" : "FAIL"}  ${msg}`);
    if (!ok) failures++;
  };

  for (const studentId of ids) {
    const res: any = await findSubjectsSelections(studentId);
    const views = toViews(res.perMetaOptions ?? []);
    const withAutos = views.filter((v) => v.autos.length);
    if (!withAutos.length) continue;

    console.log(`\n=== student ${studentId} ===`);
    for (const v of withAutos)
      console.log(`  ${v.label} [${v.code}] auto: ${v.autos.join(", ")}`);

    const minors = views.filter((v) => v.code === "MN");
    const aecs = views.filter((v) => v.code === "AEC" && v.autos.length);

    // Scenario 1: fresh load, nothing picked.
    const onLoad = applyAutoAssign(views, {});
    console.log(
      `  on load -> ${Object.keys(onLoad).length ? JSON.stringify(onLoad) : "(nothing auto-filled)"}`,
    );
    if (minors.length > 1) {
      check(
        !minors.some((v) => onLoad[v.metaId]),
        "multi-slot Minor is NOT pre-filled on load (matches main)",
      );
    }
    if (aecs.length === 1) {
      check(
        Boolean(onLoad[aecs[0]!.metaId]),
        "single-slot AEC IS pre-filled on load (matches main)",
      );
    }

    // Scenario 2: student picks a NON-auto subject in the first Minor.
    if (minors.length > 1) {
      const first = minors[0]!;
      const auto = [...new Set(minors.flatMap((m) => m.autos))][0]!;
      const nonAuto = first.options.find((o) => o !== auto);
      if (nonAuto) {
        const sel: Record<number, string> = { [first.metaId]: nonAuto };
        const after = applyAutoAssign(views, sel);
        const landed = Object.entries(after).find(([, v]) => v === auto);
        console.log(
          `  pick "${nonAuto}" in ${first.label} -> auto "${auto}" placed in ${
            landed
              ? views.find((v) => v.metaId === Number(landed[0]))?.label
              : "(nowhere)"
          }`,
        );
        check(
          Boolean(landed),
          `auto subject "${auto}" still lands in another Minor (matches main)`,
        );
        check(
          after[first.metaId] === undefined,
          "the student's own pick is never overwritten",
        );
      }
    }

    // Scenario 3: auto subject already held -> no further changes.
    if (minors.length) {
      const auto = [...new Set(minors.flatMap((m) => m.autos))][0];
      const holder = minors.find((m) => m.options.includes(auto!));
      if (auto && holder) {
        const after = applyAutoAssign(views, { [holder.metaId]: auto });
        check(
          Object.values(after).every((v) => v !== auto),
          "no duplicate placement once the auto subject is already held",
        );
      }
    }
  }

  console.log(
    `\nVERDICT: ${failures === 0 ? "PASS - auto-assign matches main's semantics" : `FAIL - ${failures}`}`,
  );
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
