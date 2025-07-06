export interface Nationality {
    readonly id?: number;
    name: string;
    code: number | null;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}