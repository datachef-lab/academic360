export interface Course {
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

export interface Class {
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

export interface StudentCategory {
    readonly id: number;
    studentCName: string;
    document: boolean | 1 | 0;
    courseId: number;
    classId: number;
    flgyes: boolean | 1 | 0;
}

