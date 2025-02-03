export interface Category {
    readonly id?: number;
    name: string;
    documentRequired?: boolean;
    code: string | null;
    createdAt: Date;
    updatedAt: Date;
}