export interface Shift {
    readonly id?: number;
    name: string;
    codePrefix: string;
    sequence: number;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}