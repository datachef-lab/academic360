export interface DisabilityCode {
    readonly id?: number;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}