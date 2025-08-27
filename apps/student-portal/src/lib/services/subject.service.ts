import { query } from "@/db";
import { BatchSubject } from "@/types/academics/batch-subjects";
import { RowDataPacket } from "mysql2";

export async function findSubjectsByCourseAndClass(courseId: number, classId: number) {
    const sqlQuery = `
        SELECT DISTINCT
            sb.id AS subjectId,
            co.coursename,
            cl.classname,
            st.subjecttypename,
            sb.subjectname,
            pl.paperName
        FROM
            studentpaperlinkingmain m,
            studentpaperlinkingpaperlist p,
            subjecttype st,
            subject sb,
            course co,
            classes cl,
            currentsessionmaster ses,
            paperlist pl
        WHERE
            m.courseId = ? 
            AND m.classId = ?
            AND m.id = p.parent_id 
            AND p.subjectTypeId = st.id 
            AND p.subjectId = sb.id
            AND m.courseid = co.id
            AND m.classid = cl.id
            AND p.paperId = pl.id
    `;
    console.log("Fetching subjects for course:", courseId, "class:", classId);
    const subjects = await query<RowDataPacket[]>(sqlQuery, [courseId, classId]) as BatchSubject[];
    console.log("Found subjects:", subjects.length);
    return subjects;
}
