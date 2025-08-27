export interface Course {
    readonly id?: number;
    courseName: string;
    courseSName: string;
    position: number | null;
    codeprefix: number | null;
    univcode: number | null;
    flg: string | null;
    cuflg: string | null;
}