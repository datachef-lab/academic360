export interface Category {
    readonly id?: number;
    name: string;
    documentRequired?: boolean;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}