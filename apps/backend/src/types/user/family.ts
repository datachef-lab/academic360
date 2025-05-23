import { Family } from "@/features/user/models/family.model.js";
import { PersonType } from "./person.js";
import { AnnualIncome } from "@/features/resources/models/annualIncome.model.js";

export interface FamilyType extends Omit<Family, "fatherDetailsId" | "motherDetailsId" | "guardianDetailsId" | "annualIncomeId"> {
    fatherDetails?: PersonType | null;
    motherDetails?: PersonType | null;
    guardianDetails?: PersonType | null;
    annualIncome?: AnnualIncome | null;
}