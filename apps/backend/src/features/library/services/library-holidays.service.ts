import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

/**
 * Holidays roll-up for the Library dashboard's Holidays tab.
 *
 * The library holds two related things: a `holidays` calendar (a date range +
 * name) and a `class_holidays` mapping that decides whether a specific
 * (program_course, class) is on holiday for a given calendar entry. A
 * librarian wants both views — "what are the holidays this year" AND "which
 * courses actually take these off, semester by semester" — so this service
 * returns both, plus a matrix that pivots (program_course × class) to counts.
 *
 * Everything runs in parallel (`Promise.all`) and joins are done in SQL, not
 * JS, so the payload stays well under a screen's worth of data even with
 * hundreds of holidays and dozens of program courses.
 */

export type HolidayRow = {
  id: number;
  name: string;
  shortName: string | null;
  from: string;
  to: string;
  remarks: string | null;
  applicableClassCount: number;
};

export type ProgramCourseBreakdownRow = {
  programCourseId: number;
  programCourseName: string;
  classId: number;
  className: string;
  classSequence: number | null;
  holidayCount: number;
};

export type HolidaysReport = {
  totals: {
    holidays: number;
    classHolidayRows: number;
    activeAssignments: number;
    programCourses: number;
    classes: number;
  };
  holidays: HolidayRow[];
  breakdown: ProgramCourseBreakdownRow[];
};

export async function readLibraryHolidaysReport(): Promise<HolidaysReport> {
  const [holidays, breakdown, totals] = await Promise.all([
    db.execute(sql`
      SELECT
        h.id,
        h.name,
        h.short_name AS "shortName",
        h."from"::text AS "from",
        h."to"::text AS "to",
        h.remarks,
        COALESCE(SUM(CASE WHEN ch.is_holiday THEN 1 ELSE 0 END), 0)::int
          AS "applicableClassCount"
      FROM holidays h
      LEFT JOIN class_holidays ch ON ch.holiday_id_fk = h.id
      GROUP BY h.id
      ORDER BY h."from" DESC, h.id DESC
    `),
    db.execute(sql`
      SELECT
        pc.id AS "programCourseId",
        COALESCE(pc.name, pc.short_name, 'Program #' || pc.id) AS "programCourseName",
        c.id AS "classId",
        c.name AS "className",
        c.sequence AS "classSequence",
        COALESCE(SUM(CASE WHEN ch.is_holiday THEN 1 ELSE 0 END), 0)::int
          AS "holidayCount"
      FROM class_holidays ch
      JOIN program_courses pc ON pc.id = ch.program_course_id_fk
      JOIN classes c ON c.id = ch.class_id_fk
      GROUP BY pc.id, pc.name, pc.short_name, c.id, c.name, c.sequence
      ORDER BY "programCourseName" ASC, c.sequence NULLS LAST, c.id ASC
    `),
    db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM holidays) AS holidays,
        (SELECT COUNT(*)::int FROM class_holidays) AS "classHolidayRows",
        (SELECT COUNT(*)::int FROM class_holidays WHERE is_holiday) AS "activeAssignments",
        (SELECT COUNT(DISTINCT program_course_id_fk)::int FROM class_holidays) AS "programCourses",
        (SELECT COUNT(DISTINCT class_id_fk)::int FROM class_holidays) AS classes
    `),
  ]);

  const t = (totals.rows[0] ?? {}) as Record<string, number>;
  return {
    totals: {
      holidays: Number(t.holidays ?? 0),
      classHolidayRows: Number(t.classHolidayRows ?? 0),
      activeAssignments: Number(t.activeAssignments ?? 0),
      programCourses: Number(t.programCourses ?? 0),
      classes: Number(t.classes ?? 0),
    },
    holidays: (holidays.rows as unknown as HolidayRow[]).map((r) => ({
      ...r,
      applicableClassCount: Number(r.applicableClassCount ?? 0),
    })),
    breakdown: (breakdown.rows as unknown as ProgramCourseBreakdownRow[]).map(
      (r) => ({
        ...r,
        holidayCount: Number(r.holidayCount ?? 0),
        classSequence: r.classSequence == null ? null : Number(r.classSequence),
      }),
    ),
  };
}
