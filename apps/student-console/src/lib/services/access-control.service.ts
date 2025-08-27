import { query } from "@/db";
import { DbStudentAccessControl, StudentAccessControl } from "@/types/academics/access-control";
import { Student } from "@/types/academics/student";
import { RowDataPacket } from "mysql2";

export async function findAll(
    page: number = 1,
    size: number = 10,
    searchText: string
) {
    console.log("fired")
    const offset = (page - 1) * size;
    const formattedSearchText = searchText.toLowerCase().trim();
    const likePattern = `%${formattedSearchText}%`;

    let sqlQuery = `
        SELECT
            c.*,
            st.name,
            st.codeNumber,
            st.univregno,
            st.univlstexmrollno,
            st.institutionalemail,
            st.whatsappno,
            st.cuformno,
            st.imgFile,
            st.leavingdate,
            st.active,
            st.alumni
        FROM
            studentpersonaldetails st,
            student_access_control c
        WHERE st.id = c.student_id_fk 
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

    sqlQuery += `  ORDER BY c.id DESC LIMIT ? OFFSET ? `;
    queryParams.push(size, offset);

    console.log("SQL Query:", sqlQuery);
    console.log("Query Params:", queryParams);


    const [{ totalStudents }] = await query<RowDataPacket[]>(`
        SELECT COUNT(id) AS totalStudents FROM studentpersonaldetails;
    `) as { totalStudents: number }[];
    console.log("totalStudents", totalStudents)

    const studentsRaw = await query<RowDataPacket[]>(sqlQuery, queryParams) as StudentAccessControl[];
    console.log("Query returned", studentsRaw.length, "rows");
    // Log a sample row for inspection
    if (studentsRaw.length > 0) {
        console.log("Sample row:", studentsRaw[0]);
    }
    console.log("Returning result for page", page);

    // Convert Buffer fields to booleans and map field names if needed
    const students = studentsRaw.map((row) => ({
        ...row,
        active: typeof row.active === "boolean" ? row.active : !!(row.active && row.active[0]),
        alumni: typeof row.alumni === "boolean" ? row.alumni : !!(row.alumni && row.alumni[0]),
        institutionEmail: row.institutionalemail,
    }));

    // for (const st of students) {
    //     const { alumni, active, leavingdate, id } = st;
    //     if (!st.status) {
    //         await handleAccessControlStatus({
    //             id,
    //             alumni,
    //             active,
    //             leavingdate: leavingdate as string ?? undefined
    //         })
    //     }
    // }


    const totalPages = Math.ceil(Number(totalStudents) / size);

    return {
        page,
        size,
        totalPages,
        data: students
    };
}

export async function handleAccessControlStatus(student: Partial<Student>) {
    const [accessControl] = await query<RowDataPacket[]>(`
        SELECT * FROM student_access_control WHERE student_id_fk = ${student.id}
    `) as DbStudentAccessControl[];

    if (accessControl.status) return;

    const { alumni, active, leavingdate } = student;

    let status: 'alumni' | 'active' | 'dropped_out' | 'supplementary' | 'suspended' | null = null;
    if (leavingdate) {
        status = "alumni";
    }
    else {
        if (!active && !alumni) {
            status = "dropped_out";
        }
        else if (!active && alumni) {
            status = "alumni";
        }
        else if (active && !alumni) {
            status = "active";
        }
        else if (active && alumni) {
            status = "supplementary";
        }
    }

    const sqlQuery = `
        UPDATE student_access_control
        SET 
            status = '${status}',
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id_fk = ${student.id}
    `;

    await query<RowDataPacket[]>(sqlQuery);

    console.log("done updating the access statuses");

}

export async function updateAccessControl(accessControl: Partial<StudentAccessControl>) {
    const { status, access_course, access_library, access_exams } = accessControl;
    console.log("in updated,status:", status)
    const sqlQuery = `
        UPDATE student_access_control
        SET 
            status = '${status}',
            access_course = ${access_course},
            access_library = ${access_library},
            access_exams = ${access_exams},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${accessControl.id}
    `;

    await query<RowDataPacket[]>(sqlQuery);

    console.log("done updating the access control:", accessControl);


    const sqlQuery1 = `
        SELECT
            c.*,
            st.name,
            st.codeNumber,
            st.univregno,
            st.univlstexmrollno,
            st.institutionalemail,
            st.whatsappno,
            st.cuformno,
            st.imgFile,
            st.leavingdate,
            st.active,
            st.alumni
        FROM
            studentpersonaldetails st,
            student_access_control c
        WHERE 
            c.id = ${accessControl.id}
    `;

    const [result] = await query<RowDataPacket[]>(sqlQuery1) as StudentAccessControl[];

    return result;

}

export async function findStats() {
    const totalStudentsQuery = `
    SELECT COUNT(id) AS totalStudents
    FROM studentpersonaldetails;
  `;
    const activeStudentsQuery = `
    SELECT COUNT(id) AS activeStudents
    FROM student_access_control
    WHERE status = 'active';
  `;
    const suspendedStudentsQuery = `
    SELECT COUNT(id) AS suspendedStudents
    FROM student_access_control
    WHERE status = 'suspended';
  `;
    const alumniStudentsQuery = `
    SELECT COUNT(id) AS alumniStudents
    FROM student_access_control
    WHERE status = 'alumni';
  `;
    const supplementaryStudentsQuery = `
    SELECT COUNT(id) AS supplementaryStudents
    FROM student_access_control
    WHERE status = 'supplementary';
  `;

    const [{ totalStudents }] = await query<RowDataPacket[]>(totalStudentsQuery) as { totalStudents: number }[];
    const [{ activeStudents }] = await query<RowDataPacket[]>(activeStudentsQuery) as { activeStudents: number }[];
    const [{ suspendedStudents }] = await query<RowDataPacket[]>(suspendedStudentsQuery) as { suspendedStudents: number }[];
    const [{ alumniStudents }] = await query<RowDataPacket[]>(alumniStudentsQuery) as { alumniStudents: number }[];
    const [{ supplementaryStudents }] = await query<RowDataPacket[]>(supplementaryStudentsQuery) as { supplementaryStudents: number }[];

    return {
        totalStudents,
        activeStudents,
        suspendedStudents,
        alumniStudents,
        supplementaryStudents
    };
}


export async function findAccessControlByStudentId(studentId: number) {
    const sqlQuery = `
        SELECT *
        FROM student_access_control
        WHERE student_id_fk = ${studentId};
    `;

    const [result] = await query<RowDataPacket[]>(sqlQuery) as StudentAccessControl[];

    return result;

}