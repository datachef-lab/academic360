export interface Department {
    readonly id?: number;
    name: string;
    code: string | null;
    description?: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}