import { Person } from "./person";

export interface Guardian {
    readonly id?: number;
    studentId: number,
    gaurdianDetails: Person | null;
    createdAt: Date,
    updatedAt: Date,
}