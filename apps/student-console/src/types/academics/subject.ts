export interface Subject {
    readonly id?: number;
    subjectName: string;
    subjectTypeId: number | null;
    univcode: string | null;
    ifgroup: boolean | null;
}