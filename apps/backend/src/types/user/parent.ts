import { Parent } from "@/features/user/models/parent.model.ts";
import { PersonType } from "./person.ts";

export interface ParentType extends Omit<Parent, "fatherDetailsId" | "motherDetailsId" | "annualIncomeId"> {
    fatherDetails: PersonType | null;
    motherDetails: PersonType | null;
    annualIncome: string | null;
}