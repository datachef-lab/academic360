import { Address } from "./address";

export interface BoardUniversity {
    readonly id?: number;
    name: string;
    degree: string | null;
    passingMarks: number | null;
    code: string | null;
    address: Address | null;
    sequence: number;
    disabled?: boolean;
    createdAt: Date;
    updatedAt: Date;
}