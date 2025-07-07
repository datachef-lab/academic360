export interface AnnualIncome {
    readonly id?: number;
    range: string;
    sequence: number  | null;
    disabled?: boolean;
    createdAt: Date;
    updatedAt: Date;
}