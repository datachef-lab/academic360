export interface City {
    readonly id?: number;
    state: string | null;
    name: string;
    documentRequired: boolean;
    code: string | null;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}