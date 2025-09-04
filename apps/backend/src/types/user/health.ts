import { Health } from "@repo/db/schemas/models/user";
import { BloodGroupType } from "../resources/blood-group";

export interface HealthType extends Omit<Health, "bloodGroupId"> {
    bloodGroup?: BloodGroupType | null;
}

