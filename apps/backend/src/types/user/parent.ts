import { Parent } from "@/features/user/models/parent.model.js";
import { PersonType } from "./person.js";
import { AnnualIncome } from "@/features/resources/models/annualIncome.model.js";

export interface ParentType extends Omit<Parent, "fatherDetailsId" | "motherDetailsId" | "annualIncomeId"> {
    fatherDetails?: PersonType | null;
    motherDetails?: PersonType | null;
    annualIncome?: AnnualIncome | null;
}