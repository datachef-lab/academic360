// import { query } from "@/db";

// export async function findFeesStructureByStudentId(studentId: number) {
//     const sqlQuery = `
//         SELECT
//             rcpt.name,
//             crs.courseName,
//             c.className,
//             sess.sessionName,
//             fsm.lastDate,
//             fsm.closingDate,

//             fsm.instfromdt,
//             fsm.insttoomdt,
//             fsm.lastonlinedate,
//             fsm.lastonlinedateto,

//             fsb.headid,
//             fsh.name,
//             fsb.instamount,
//             fsb.specialitytypename,
//             fsb.installmenttypename


//         FROM
//             feesstructuremaintab fsm,
//             studentinstlmain si,
//             studentfeesreceipttype rcpt,
//             classes c,
//             course crs,
//             currentsessionmaster sess,
//             feesstructuresubtab fsb,
//             feesheadtable fsh

//         WHERE
//             si.stdid = ${studentId}
//             AND fsm.id = si.structid
//             AND fsm.id = fsb.parent_id
//             AND rcpt.id = fsm.receiptType
//             AND fsm.classId = c.id
//             AND fsm.courseId = crs.id
//             AND sess.id = fsm.sessionid
//         ;`;








//         const feesStructure = await query(sqlQuery) as [];
//     // console.log("exams", exams);

//     // return exams;
// }
