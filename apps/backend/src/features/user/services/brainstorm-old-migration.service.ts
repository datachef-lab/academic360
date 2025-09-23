import { db, mysqlConnection } from "@/db";
import { OldStudent } from "@/types/old-student";
import { studentModel } from "@repo/db/schemas";
import { inArray } from "drizzle-orm";

const BATCH_SIZE = 500;

export async function brainstormOldMigration() {
  const [[{ totalStudents }]] = (await mysqlConnection.query(`
        SELECT COUNT(spd.id) AS totalStudents
        FROM
            studentpersonaldetails spd,
            personaldetails pd,
            coursedetails cd
        WHERE
            spd.admissionId = cd.id
            AND pd.id = cd.parent_id
            AND pd.sessionId = 18
            AND cd.transferred = true;
    `)) as [{ totalStudents: number }[], any];
  console.log(`Total students: ${totalStudents}`);

  const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);

  console.log(`Total batches: ${totalBatches}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  let grandMissingCount = 0;
  for (let i = 0; i < totalBatches; i++) {
    const offset = i * BATCH_SIZE;
    const limit = BATCH_SIZE;

    const [oldStudentIds] = (await mysqlConnection.query(`
            SELECT id AS legacyStudentId
            FROM studentpersonaldetails
            WHERE admissionId IN (
                SELECT cd.id
                FROM 
                    coursedetails cd,
                    personaldetails pd
                WHERE cd.parent_id = pd.id
                AND pd.sessionId = 18
                AND cd.transferred = true
            )
            ORDER BY id
            LIMIT ${limit} OFFSET ${offset};
        `)) as [{ legacyStudentId: number }[], any];

    if (oldStudentIds.length === 0) {
      console.log(`Batch ${i + 1}/${totalBatches}: no records`);
      continue;
    }

    const legacyIds = oldStudentIds.map((r) => r.legacyStudentId);
    const existing = await db
      .select({ legacyStudentId: studentModel.legacyStudentId })
      .from(studentModel)
      .where(inArray(studentModel.legacyStudentId, legacyIds));

    const existingSet = new Set(
      existing
        .map((r) => r.legacyStudentId)
        .filter((v): v is number => typeof v === "number"),
    );
    const missing = legacyIds.filter((id) => !existingSet.has(id));

    grandMissingCount += missing.length;
    if (missing.length > 0) {
      console.log(
        `Batch ${i + 1}/${totalBatches}: missing ${missing.length} students`,
      );
      console.log(missing.join(", "));
    } else {
      console.log(
        `Batch ${i + 1}/${totalBatches}: all ${legacyIds.length} present`,
      );
    }
  }
  console.log(`Total missing across all batches: ${grandMissingCount}`);
}
