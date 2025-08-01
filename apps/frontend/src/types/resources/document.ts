export interface Document {
    readonly id?: number;
    name: string;
    description: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: string; // ISO date string
    updatedAt?: string; // ISO date string
}