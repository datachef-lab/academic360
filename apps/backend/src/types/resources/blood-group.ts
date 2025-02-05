import { BloodGroup } from "@/features/resources/models/bloodGroup.model.ts";

export interface BloodGroupType extends BloodGroup {
    percentageUsers: number | null;
}