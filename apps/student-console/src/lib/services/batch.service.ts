"use server";

import { query } from "@/db";
import Batch, { BatchCustom, } from "@/types/academics/batch";
import { RowDataPacket } from "mysql2";

export async function findAllBatches(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize; // Starting point for pagination

    const [rows] = await query<RowDataPacket[]>(
        `SELECT * 
        FROM studentpaperlinkingmain 
        ORDER BY id DESC 
        LIMIT ? 
        OFFSET ?`,
        [pageSize, offset]
    );

    return rows; // Return the paginated batch data in descending order
}

export async function findBatchesByStudentUid(uid: string): Promise<BatchCustom[]> {
    console.log("in findBatchesByStudentId(), uid:", uid);

    // Step 1: Fetch the batches and subjects
    console.log("Fetching batches for student with UID:", uid);
    const sqlQuery = `
        (
            SELECT
                co.coursename,
                cl.classname,
                s.name,
                s.codenumber,
                st.subjecttypename,
                sb.subjectname,
                sb.id as subjectId,
                shft.shiftName,
                sec.sectionName,
                sess.sessionName,
                pl.paperName
            FROM 
                studentpaperlinkingmain m,
                studentpaperlinkingpaperlist p,
                historicalrecord h,
                studentpersonaldetails s,
                course co,
                classes cl,
                subjecttype st,
                subject sb,
                shift shft,
                section sec,
                currentsessionmaster sess,
                paperlist pl
            WHERE
                m.sessionid IN (SELECT id FROM currentsessionmaster)
                AND m.classid IN (SELECT id FROM classes)
                AND m.sessionid = sess.id
                AND m.shiftId = shft.id
                AND m.sectionId = sec.id
                AND s.codeNumber = '${uid}'
                AND m.id = p.parent_id 
                AND p.allstudents = 1 
                AND p.paperId = pl.id
                AND m.courseid = h.courseid 
                AND m.classid = h.classid 
                AND m.sectionid = h.sectionid 
                AND m.shiftid = h.shiftid 
                AND m.sessionid = h.sessionid 
                AND h.parent_id = s.id 
                AND m.courseid = co.id 
                AND m.classid = cl.id 
                AND p.subjectTypeId = st.id 
                AND p.subjectId = sb.id 
        ) UNION (
            SELECT 
                co.coursename,
                cl.classname,
                s.name,
                s.codenumber,
                st.subjecttypename,
                sb.subjectname,
                sb.id as subjectId,
                shft.shiftName,
                sec.sectionName,
                sess.sessionName,
                pl.paperName
            FROM 
                studentpaperlinkingmain m,
                studentpaperlinkingpaperlist p,
                studentpaperlinkingstudentlist ss,
                historicalrecord h,
                studentpersonaldetails s,
                course co,
                classes cl,
                subjecttype st,
                subject sb,
                shift shft,
                section sec,
                currentsessionmaster sess,
                paperlist pl
            WHERE 
                m.sessionid IN (SELECT id FROM currentsessionmaster)
                AND m.classid IN (SELECT id FROM classes)
                AND m.sessionid = sess.id
                AND m.shiftId = shft.id
                AND m.sectionId = sec.id
                AND s.codeNumber = '${uid}'
                AND m.id = p.parent_id 
                AND p.allstudents = 0 
                AND p.paperId = pl.id
                AND p.id = ss.parent_id 
                AND m.courseid = h.courseid 
                AND m.classid = h.classid 
                AND m.sectionid = h.sectionid 
                AND m.shiftid = h.shiftid 
                AND m.sessionid = h.sessionid 
                AND h.parent_id = s.id 
                AND m.courseid = co.id 
                AND m.classid = cl.id 
                AND p.subjectTypeId = st.id 
                AND p.subjectId = sb.id 
                AND ss.studentid = s.id 
            ) 
        ORDER BY coursename, codenumber, subjectTypeName
    `;
    console.log("SQL Query:", sqlQuery);

    try {
        const results = await query<RowDataPacket[]>(sqlQuery);
        console.log("Result length:", results.length);
        console.log("First result:", results[0]);

        // Step 3: Format the result
        if (!results || results.length === 0) {
            console.log("No batches found for the student.");
            return []; // Return an empty array if no batches are found
        }

        // Group the results by batch (unique combination of course, class, section, session, shift)
        const batchMap = new Map();

        // Create a unique key for each batch
        for (const row of results) {
            const { coursename, classname, sectionName, sessionName, shiftName,
                subjectname, subjecttypename, paperName, subjectId } = row;

            const batchKey = `${coursename}|${classname}|${sectionName}|${sessionName}|${shiftName}`;

            if (!batchMap.has(batchKey)) {
                // Create a new batch
                batchMap.set(batchKey, {
                    coursename,
                    classname,
                    sectionName,
                    sessionName,
                    shiftName,
                    papers: []
                });
            }

            // Add the paper to the batch
            const batch = batchMap.get(batchKey);
            batch.papers.push({
                subjectId,
                subjectname,
                subjecttypename,
                paperName
            });
        }

        // Convert the map values to an array
        const formattedBatches = Array.from(batchMap.values());
        console.log("Formatted batches length:", formattedBatches.length);

        return formattedBatches;
    } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
    }
}

export async function findBatchesMetadataByCourseId(courseId: number) {
    const batches: Batch[] = [];

    const sqlQuery = `
        SELECT 
            batch.*,
            crs.coursename,
            c.classname,
            sec.sectionName,
            sess.sessionName,
            shft.shiftName
        FROM 
            studentpaperlinkingmain AS batch
        JOIN 
            course AS crs ON batch.courseid = crs.id
        JOIN 
            classes AS c ON batch.classid = c.id
        JOIN 
            section AS sec ON batch.sectionid = sec.id
        JOIN 
            currentsessionmaster AS sess ON batch.sessionid = sess.id
        JOIN 
            shift AS shft ON batch.shiftid = shft.id
        WHERE 
            batch.courseId = ${courseId}
        ORDER BY 
            batch.sessionId DESC
    ;`;

    const result = await query<RowDataPacket[]>(sqlQuery) as Batch[];

    for (const tmpBatch of result) {
        const sqlQuery = `
        SELECT
            COUNT(st.id) AS totalCount
        FROM 
            studentpersonaldetails st,
            studentpaperlinkingmain batch,
            
            studentpaperlinkingpaperlist paper,
            
            studentpaperlinkingstudentlist sl

        WHERE
            batch.id = ${tmpBatch.id}
            AND paper.parent_id = ${tmpBatch.id}
            AND sl.parent_id = paper.id
            AND sl.studentId = st.id
    `;

        const { totalCount } = (await query<RowDataPacket[]>(sqlQuery) as { totalCount: number }[])[0];

        if (totalCount > 0) {
            batches.push(tmpBatch);
        }


    }




    return batches;
}
