export interface DisabilityCode {
    readonly id?: number;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}