import { eq } from "drizzle-orm";
import { db, getMarks360Connection } from "@/db/index.js";
import { studentModel } from "@repo/db/schemas/models/user";
import { createLogger } from "@/config/logger";

const log = createLogger("academic-progression");

export interface ProgressionPaper {
  subjectName: string;
  paperCode: string | null;
  internalMarks: string | null;
  theoryMarks: string | null;
  practicalMarks: string | null;
  vivaMarks: string | null;
  projectMarks: string | null;
  total: string | null;
  fullMarks: string | null;
  grade: string | null;
  status: string | null;
}

export interface ProgressionAttempt {
  semester: number;
  examYear: number;
  sgpa: number | null;
  cleared: boolean;
  remarks: string | null;
  papers: ProgressionPaper[];
}

export interface AcademicProgression {
  registrationNo: string | null;
  years: number[];
  attempts: ProgressionAttempt[];
}

interface AttemptRow {
  semester: number;
  exam_year: number;
  sgpa: string | null;
  remarks: string | null;
}

interface PaperRow {
  semester: number;
  exam_year: number;
  subject_name: string;
  paper_code: string | null;
  internal_marks: string | null;
  theory_marks: string | null;
  practical_marks: string | null;
  viva_marks: string | null;
  project_marks: string | null;
  total: string | null;
  full_marks: string | null;
  grade: string | null;
  status: string | null;
}

const parseSgpa = (sgpa: string | null): number | null => {
  if (!sgpa) return null;
  const value = Number(sgpa);
  return Number.isFinite(value) ? value : null;
};

export async function findAcademicProgressionByUserId(
  userId: number,
): Promise<AcademicProgression> {
  const empty: AcademicProgression = {
    registrationNo: null,
    years: [],
    attempts: [],
  };

  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.userId, userId));
  if (!student?.registrationNumber) {
    return empty;
  }
  empty.registrationNo = student.registrationNumber;

  const marks360 = getMarks360Connection();
  if (!marks360) {
    log.warn("MARKS360_DB_* env vars not configured; returning empty data");
    return empty;
  }

  try {
    const attemptResult = await marks360.query(
      `SELECT semester, exam_year, MAX(sgpa) AS sgpa, MAX(remarks) AS remarks
         FROM subject_marks
        WHERE registration_no = $1 AND is_rcsi = 0
        GROUP BY semester, exam_year
        ORDER BY semester, exam_year`,
      [student.registrationNumber],
    );
    const attemptRows = attemptResult.rows as AttemptRow[];

    const paperResult = await marks360.query(
      `SELECT semester, exam_year, subject_name, paper_code,
              internal_marks, theory_marks, practical_marks, viva_marks,
              project_marks, total, full_marks, grade, status
         FROM subject_marks
        WHERE registration_no = $1 AND is_rcsi = 0
        ORDER BY semester, exam_year, id`,
      [student.registrationNumber],
    );
    const paperRows = paperResult.rows as PaperRow[];

    const papersByAttempt = new Map<string, ProgressionPaper[]>();
    for (const row of paperRows) {
      const key = `${row.semester}-${row.exam_year}`;
      if (!papersByAttempt.has(key)) papersByAttempt.set(key, []);
      papersByAttempt.get(key)!.push({
        subjectName: row.subject_name,
        paperCode: row.paper_code,
        internalMarks: row.internal_marks,
        theoryMarks: row.theory_marks,
        practicalMarks: row.practical_marks,
        vivaMarks: row.viva_marks,
        projectMarks: row.project_marks,
        total: row.total,
        fullMarks: row.full_marks,
        grade: row.grade,
        status: row.status,
      });
    }

    const attempts: ProgressionAttempt[] = attemptRows.map((row) => {
      const sgpa = parseSgpa(row.sgpa);
      return {
        semester: row.semester,
        examYear: row.exam_year,
        sgpa,
        cleared:
          (row.remarks ?? "").toLowerCase().startsWith("semester cleared") ||
          (sgpa !== null && !(row.remarks ?? "").toLowerCase().includes("not")),
        remarks: row.remarks,
        papers: papersByAttempt.get(`${row.semester}-${row.exam_year}`) ?? [],
      };
    });

    return {
      registrationNo: student.registrationNumber,
      years: [...new Set(attempts.map((a) => a.examYear))].sort(),
      attempts,
    };
  } catch (error) {
    log.error("Failed to fetch marks360 data", {
      registrationNo: student.registrationNumber,
      message: error instanceof Error ? error.message : error,
    });
    return empty;
  }
}
