import { Health } from "@/features/user/models/health.model.js";
import { BloodGroupType } from "../resources/blood-group";

export interface HealthType extends Omit<Health, "bloodGroupId"> {
    bloodGroup?: BloodGroupType | null;
}

