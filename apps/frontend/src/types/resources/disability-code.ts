export interface DisabilityCode {
    readonly id?: number;
    code: string | null;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}