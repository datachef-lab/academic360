export interface OldCourse {
    readonly id: number | null;
    courseName: string;
    courseSName: string | null;
    position: number | null;
    codeprefix: string | null;
    univcode: string | null;
    isaddon: boolean | 1 | 0;
    coursetypeid: number | null;
    flg: string | null;
    cuflg: string | null;
    creationdt: Date | null | string;
    modifydt: Date | null | string;
}

export interface OldClass {
    readonly id: number;
    classname: string | null;
    position: number | null;
    details: string | null;
    type: string | null;
}

export interface OldEligibilityCriteria {
    readonly id: number;
    courseId: number;
    classId: number;
    categoryId: number;
    description: string;
    generalInstruction: string;
}

export interface OldPaperList {
    readonly id?: number;
    index_col: number | null;
    parent_id: number;
    paperName: string;
    paperShortName: string;
    isPractical: boolean;
    paperCreditPoint: number | null;
    paperType: string | null;
    displayName: string | null;
}

export interface OldPaperSubject {
    readonly ID?: number;
    subjectTypeId: number;
    subjectId: number;
}

export interface OldStudentPaper {
    readonly ID: number;
    index_col: number;
    parent_id: number
    studentId: number
}

export interface OldSubjectType {
    readonly id?: number;
    subjectTypeName: string;
    rptpos: number | null;
    shortname: string | null;
}

export interface OldSubject {
    readonly id: number;
    subjectName: string;
    subjectTypeId: number;
    univcode: string | null;
}