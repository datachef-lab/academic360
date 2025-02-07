import { BloodGroup } from "@/features/resources/models/bloodGroup.model.js";

export interface BloodGroupType extends BloodGroup {
    percentageUsers: number | null;
}