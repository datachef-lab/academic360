export interface Nationality {
    readonly id?: number;
    name: string;
    code: number | null;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}