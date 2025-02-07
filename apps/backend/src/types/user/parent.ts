import { Parent } from "@/features/user/models/parent.model.js";
import { PersonType } from "./person.js";

export interface ParentType extends Omit<Parent, "fatherDetailsId" | "motherDetailsId" | "annualIncomeId"> {
    fatherDetails?: PersonType | null;
    motherDetails?: PersonType | null;
    annualIncome?: string | null;
}