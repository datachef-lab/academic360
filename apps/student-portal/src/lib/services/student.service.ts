import { DbStudent, Student } from "@/types/academics/student";
import { RowDataPacket } from "mysql2";
import { findNationalityById } from "./nationality.service";
import { query } from "@/db";
import { handleAccessControlStatus } from "./access-control.service";

export async function findAllStudents(page: number = 1, size: number = 10): Promise<DbStudent[]> {
    const rows = await query<RowDataPacket[]>(`
        SELECT * 
        FROM studentpersonaldetails
        LIMIT ? 
        OFFSET ?
    `, [size, (page - 1) * size]);

    if (!rows || rows.length === 0) {
        return [];
    }

    // Cast directly to DbStudent without formatting with nationality data
    return rows.map(row => row as DbStudent);
}

export async function findStudentByEmail(email: string): Promise<Student | null> {
    try {
        const rows = await query<RowDataPacket[]>(
            `SELECT * FROM studentpersonaldetails WHERE institutionalemail = ?`,
            [email]
        );

        if (!rows || rows.length === 0) {
            return null;
        }

        const formattedStudent = await formatResponse(rows[0] as DbStudent);


        await handleAccessControlStatus({
            id: formattedStudent?.id,
            alumni: formattedStudent?.alumni,
            active: formattedStudent?.active,
            leavingdate: formattedStudent?.leavingdate as string ?? undefined
        });


        return formattedStudent;
    } catch (error) {
        console.error("Error finding student by email:", error);
        return null;
    }
}

export async function findStudentByApplicationId(applicationId: number): Promise<Student | null> {
    return null;
}

export async function findStudentByUid(uid: string): Promise<Student | null> {
    try {
        // Don't log the function itself
        console.log("Looking up student with UID:", uid);

        const rows = await query<RowDataPacket[]>(
            `SELECT * FROM studentpersonaldetails WHERE codeNumber = ?`,
            [uid]
        );

        // console.log("Query results:", rows);

        if (!rows || rows.length === 0) {
            console.log(`No student found with UID: ${uid}`);
            return null;
        }

        const tmp = { ...rows[0] } as DbStudent;
        tmp.active = Boolean(tmp.active)
        tmp.alumni = Boolean(tmp.alumni)

        const formattedStudent = await formatResponse(tmp);

        await handleAccessControlStatus({
            id: formattedStudent?.id,
            alumni: formattedStudent?.alumni,
            active: formattedStudent?.active,
            leavingdate: formattedStudent?.leavingdate as string ?? undefined
        });

        return formattedStudent;
    } catch (error) {
        console.error("Error finding student by UID:", error);
        return null;
    }
}

export async function findStudentByUidAndContact(uid: string, contactNo: string): Promise<Student | null> {
    try {
        // Don't log the function itself
        console.log("Looking up student with UID:", uid);

        const rows = await query<RowDataPacket[]>(`
            SELECT * 
            FROM studentpersonaldetails 
            WHERE codeNumber = '${uid}' AND contactNo = '${contactNo}'
        `);

        // console.log("Query results:", rows);

        if (!rows || rows.length === 0) {
            console.log(`No student found with UID: ${uid} and contactNo: ${contactNo}`);
            return null;
        }

        const formattedStudent = await formatResponse(rows[0] as DbStudent);

        await handleAccessControlStatus({
            id: formattedStudent?.id,
            alumni: formattedStudent?.alumni,
            active: formattedStudent?.active,
            leavingdate: formattedStudent?.leavingdate as string ?? undefined
        });

        return formattedStudent;
    } catch (error) {
        console.error("Error finding student by UID:", error);
        return null;
    }
}

export async function formatResponse(student: DbStudent | null) {
    if (!student) {
        return null;
    }

    try {
        console.log("student.nationalityId:", student.nationalityId);
        const nationality = await findNationalityById(student.nationalityId);

        let formattedStudent: Student = {
            ...student,
            nationalityName: '',
            pos: null,
            code: null
        };

        console.log("in lib/services/student/ | nationality:", nationality)

        if (nationality) {
            const { pos, code, nationalityName } = nationality;
            formattedStudent = { ...formattedStudent, pos, code, nationalityName };
        }

        return formattedStudent;
    } catch (error) {
        console.error("Error formatting student response:", error);
        // Still return the student data even if nationality lookup fails
        return {
            ...student,
            nationalityName: '',
            pos: null,
            code: null
        };
    }
}

export async function findStudentsByBatchId(batchId: number, page: number = 1, size: number = 10): Promise<DbStudent[] | null> {
    const sqlQuery = `
        SELECT
            st.*
        FROM 
            studentpersonaldetails st,
            studentpaperlinkingmain batch,
            
            studentpaperlinkingpaperlist paper,
            
            studentpaperlinkingstudentlist sl

        WHERE
            batch.id = ${batchId}
            AND paper.parent_id = ${batchId}
            AND sl.parent_id = paper.id
            AND sl.studentId = st.id
        LIMIT ?
        OFFSET ?
    `;

    const students = await query<RowDataPacket[]>(sqlQuery, [size, (page - 1) * size]) as DbStudent[];

    return students;
}

export async function findStudentsBySearch(
    page: number = 1,
    size: number = 10,
    searchText: string
): Promise<DbStudent[] | null> {
    const offset = (page - 1) * size;
    const formattedSearchText = searchText.toLowerCase().trim();
    const likePattern = `%${formattedSearchText}%`;

    let sqlQuery = `
        SELECT st.*
        FROM studentpersonaldetails st
        WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];

    if (formattedSearchText.length > 0) {
        sqlQuery += ` AND (
            LOWER(st.codeNumber) LIKE ?
            OR LOWER(st.name) LIKE ?
            OR LOWER(st.email) LIKE ?
            OR LOWER(st.phoneMobileNo) LIKE ?
            OR LOWER(st.resiPhoneMobileNo) LIKE ?
            OR LOWER(st.residentialAddress) LIKE ?
            OR LOWER(st.fatherName) LIKE ?
            OR LOWER(st.motherName) LIKE ?
            OR LOWER(st.universityRegNo) LIKE ?
            OR LOWER(st.univregno) LIKE ?
            OR LOWER(st.univlstexmrollno) LIKE ?
            OR LOWER(st.cuformno) LIKE ?
            OR LOWER(st.aadharcardno) LIKE ?
            OR LOWER(st.fatheraadharno) LIKE ?
            OR LOWER(st.motheraadharno) LIKE ?
            OR LOWER(st.gurdianaadharno) LIKE ?
            OR LOWER(st.institutionalemail) LIKE ?
        )`;

        // Push the same like pattern for all fields
        for (let i = 0; i < 17; i++) {
            queryParams.push(likePattern);
        }
    }

    sqlQuery += ` ORDER BY st.id DESC LIMIT ? OFFSET ?`;
    queryParams.push(size, offset);

    console.log("SQL Query:", sqlQuery);
    console.log("Query Params:", queryParams);

    const students = await query<RowDataPacket[]>(sqlQuery, queryParams) as DbStudent[];
    return students;
}
