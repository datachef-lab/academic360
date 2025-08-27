export interface StudentPaper {
    readonly id?: number;
    index_col: number | null;
    parent_id: number;
    studentId: number;
    isSelected: boolean | null;
}