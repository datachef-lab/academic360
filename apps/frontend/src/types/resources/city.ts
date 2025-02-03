export interface City {
    readonly id?: number;
    state: string | null;
    name: string;
    documentRequired: boolean;
    code: string | null;
    createdAt: Date;
    updatedAt: Date;
}