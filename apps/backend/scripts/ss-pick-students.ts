import "dotenv/config";
import { pool } from "../src/db/index.js";
// A representative sample: a few students from each program course that has active promotions in the current year
const rows = (
  await pool.query(`
  WITH ranked AS (
    SELECT pr.student_id_fk AS student_id, pr.program_course_id_fk AS pc,
           ROW_NUMBER() OVER (PARTITION BY pr.program_course_id_fk ORDER BY pr.student_id_fk) AS rn
    FROM promotions pr
    JOIN sessions s ON s.id = pr.session_id_fk
    JOIN academic_years ay ON ay.id = s.academic_id_fk AND ay.is_current_year = true
    WHERE COALESCE(pr.is_deprecated,false)=false
  )
  SELECT student_id, pc FROM ranked WHERE rn <= 4 ORDER BY pc, student_id
`)
).rows;
console.log(JSON.stringify(rows.map((r) => r.student_id)));
console.error(
  `picked ${rows.length} students across ${new Set(rows.map((r) => r.pc)).size} program courses`,
);
await pool.end();
