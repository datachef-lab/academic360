export interface OldAcademicYear {
    readonly id: number;
    accademicYearName: string;
    presentAcademicYear: boolean;
    sessionId: number;
}

export interface OldBatchPaper {
    readonly ID: number;
    index_col: number | null;
    parent_id: number | null;
    subjectTypeId: number | null;
    subjectId: number | null;
    paperId: number | null;
    allStudents: boolean | null;
}

export interface OldBatch {
    readonly id?: number;
    courseId: number;
    classId: number;
    sectionId: number | null;
    shiftId: number;
    sessionId: number;
    instituteId: number;
}

export interface OldBoardStatus {
    readonly id?: number;
    name: string;
    spcltype: string;
    degreeid: number;
    flag: string | null;
}

export interface OldBoard {
    readonly id?: number;
    boardName: string;
    baseBoard: boolean | null,
    degreeid: number;
    passmrks: number | null;
    code: string | null;
}

export interface OldSection {
    readonly id?: number;
    sectionName: string;
}

export interface OldShift {
    readonly id?: number;
    shiftName: string;
    codeprefix: string;
}



export interface OldSession {
    id?: number;
    sessionName: string;
    fromDate: Date;
    toDate: Date;
    iscurrentsession: boolean;
    codeprefix: string | null;
}

export interface OldAcademicDetails {
    readonly id: number | null;
    index_col: number | null;
    parent_id: number | null;
    degreeId: number | null;
    boardId: number | null;
    year: string | null;
    percentageOfMarks: number | null;
    division: string | null;
    rank: string | null;
    totalPoints: number | null;
    otherBoardName: string | null;
    rollNo: string | null;
    aggregate: number | null;
    degreeCourseId: number | null;
    regno: string | null;
    subjectStudied: string | null;
    lastschoolName: string | null;
    lastSchoolAddress: string | null;
    schoolCountryId: number | null;
    stateId: number | null;
    schoolcityId: number | null;
    otherSchoolState: string | null;
    otherSchoolCity: string | null;
    mailingPinNo: string | null;
    yearofPassing: number | null;
    mediumofInstruction: number | null;
    lastschoolId: number | null;
    prevadmitted: string | null;
    prevregno: string | null;
    prevcrshdrid: number | null;
    prevcrshdrother: string | null;
    previnstid: number | null;
    previnstother: string | null;
    sciencebg: string | null;
    marksheetfilenm: string | null;
    admitcardflnm: string | null;
    prevuniexam: string | null;
    boardResultStatus: string | null;
    schoolno: string | null;
    centerno: string | null;
    admintcardid: string | null;
    registrationno: string | null;
    indexno1: string | null;
    indexno2: string | null;
    ugcourse: string | null;
    specialization: string | null;
    sgpa1: number | null;
    sgpa2: number | null;
    sgpa3: number | null;
    sgpa4: number | null;
    sgpa5: number | null;
    sgpa6: number | null;
}