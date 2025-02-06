import { Guardian } from "@/features/user/models/guardian.model.js";
import { PersonType } from "./person.js";

export interface GuardianType extends Omit<Guardian, "gaurdianDetailsId"> {
    gaurdianDetails: PersonType | null;
}
