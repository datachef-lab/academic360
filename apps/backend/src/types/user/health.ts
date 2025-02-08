import { Health } from "@/features/user/models/health.model.js";

export interface HealthType extends Omit<Health, "bloodGroupId"> {
    bloodGroup: string | null;
}

