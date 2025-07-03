export interface Category {
    readonly id?: number;
    name: string;
    documentRequired?: boolean;
    code: string | null;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}