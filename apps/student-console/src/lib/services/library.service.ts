import { query } from "@/db";
import { IssuedBookDetails, LibraryVisit } from "@/types/academics/library";

export async function findIssuesByStudentId(studentId: number) {
    const sqlQuery = `
        SELECT
        -- Book Details
            b.mainTitle,
            b.subTitle,
            b.alternateTitle,
            b.isbn,
            b.edition,
            b.editionYear,
            b.bookVolume,
            b.bookPart,
            l.libMasterName,
            b.subjectGroupId,
            sg.subjectgroupName,
            gs.name AS generalSubject,
            lang.languageName,
            b.callNo,
            p.publisherName,
            p.address AS publisherAddress,
        -- Issued Details
            i.borrowingTypeId,
            bt.borrowingTypeName,
            i.issueDate,
            i.returnDate,
            i.actualRetDate,
            i.isReturn,
            i.fine,
            i.reIssue,
            i.isForceIssue,
        -- Copy Details
            i.copyId,
            cp.copyTypeId,
            cp.issueType,
            cp.statusId,
            sta.statusName,
            cp.rackId,
            r.rackName,
            cp.selfId,
            sh.shelfName,
            cp.encloserTypeId,
            enc.enclosetypeName,
            cp.noOfEncloser,
            cp.noOfPages,
            cp.priceINR,
            bind.bindingTypeName,
            cp.departmentId,
            dept.department

        FROM
            issuereturn i
        JOIN bookentry b ON i.bookId = b.id
        JOIN subjectgroup sg ON b.subjectGroupId = sg.id
        JOIN gensubject gs ON sg.genSubId = gs.id
        JOIN libmaster l ON b.libMasterId = l.id
        JOIN language lang ON b.languageId = lang.id
        JOIN publisher p ON b.pubNameId = p.id
        JOIN borrowingtype bt ON i.borrowingTypeId = bt.id
        JOIN copydetailsub cp ON cp.id = i.copyId
        JOIN status sta ON sta.id = cp.statusId
        LEFT JOIN rack r ON r.id = cp.rackId
        LEFT JOIN shelf sh ON sh.id = cp.selfId
        LEFT JOIN enclosetype enc ON enc.id = cp.encloserTypeId
        LEFT JOIN bindingtype bind ON bind.id = cp.bindingId
        LEFT JOIN department dept ON dept.id = cp.departmentId

        WHERE
            i.userId = ${studentId}
            AND i.userTypeId = 'Student';
    `;
    const result = await query(sqlQuery) as IssuedBookDetails[];
    console.log("lib result", result);

    return result;
}

export async function findLibraryVisits(studentId: number) {
    const sqlQuery = `
        SELECT
            le.id,
            le.libMasterId,
            lm.libMasterName,
            le.entrydt,
            le.entrytime,
            le.exittime
        FROM
            libentryexit le,
            libmaster lm
        WHERE
            le.libMasterId = lm.id
            AND usrid = ${studentId}
            AND usrtype = 'Student'
        ORDER BY le.entrytime DESC;
    `;

    const result = await query(sqlQuery) as LibraryVisit[];
    console.log("lib-visits, result", result);

    return result;
}