import { query } from "@/db";
import { Exam } from "@/types/exams/exam";

export async function findExamsByStudentId(studentId: number) {
    const sqlQuery = `
        SELECT
            em.id,
            em.testid,
            t.testName,
            em.classid,
            c.className,
            em.sessid,
            sess.sessionName,
            em.examdate,
            em.frmhr,
            em.frmmnt,
            em.tohr,
            em.tomnt,
            r.roomNo AS room,
            em.entrydate,
            sbt.subjectTypeName,
            em.paperid,
            pl.paperName

        FROM
            examassignmentmain em,
            examassignmentsub es,
            testtype t,
            classes c,
            subjecttype sbt,
            paperlist pl,
            roomentry r,
            currentsessionmaster sess
        WHERE
            es.parent_id = em.id
            AND es.studentid = ${studentId}
            AND t.id = em.testid
            AND c.id = em.classid
            AND sbt.id = em.subjecttypeid
            AND pl.id = em.paperid
            AND r.id = es.roomid
            AND sess.id = em.sessid
        ORDER BY em.entrydate desc
        ;`;
    const exams = await query(sqlQuery) as Exam[];
    console.log("exams", exams);

    return exams;
}