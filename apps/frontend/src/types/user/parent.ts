
import { ParentType } from "../enums";
import { AnnualIncome } from "../resources/annual-income";
import { Person } from "./person";

export interface Parent {
    readonly id?: number;
    studentId: number,
    parentType: ParentType | null,
    fatherDetails?: Person | null;
    motherDetails?: Person | null;
    guardianDetails?: Person | null;
    annualIncome?: AnnualIncome | null;
    createdAt: Date,
    updatedAt: Date,
}