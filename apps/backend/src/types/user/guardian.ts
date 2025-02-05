import { Guardian } from "@/features/user/models/guardian.model.ts";
import { PersonType } from "./person.ts";

export interface GuardianType extends Omit<Guardian, "gaurdianDetailsId"> {
    gaurdianDetails: PersonType | null;
}
