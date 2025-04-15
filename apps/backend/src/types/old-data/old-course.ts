export interface OldCourse {
    readonly id?: number;
    courseName: string;
    courseSName: string | null;
    position: number | null;
    codeprefix: string | null;
    univcode: string | null;
    flg: string | null;
    cuflg: "hnrs" | "gnrl" | "bba" | null;
}