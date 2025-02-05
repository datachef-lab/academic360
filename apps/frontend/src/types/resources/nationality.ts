export interface Nationality {
    readonly id?: number;
    name: string;
    sequence: number | null;
    code: number | null;
    createdAt: Date;
    updatedAt: Date;
}