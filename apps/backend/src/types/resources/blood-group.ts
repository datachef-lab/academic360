<<<<<<< HEAD
import { BloodGroup } from "@/features/resources/models/bloodGroup.model.ts";
=======
import { BloodGroup } from "@/features/resources/models/bloodGroup.model.js";
>>>>>>> 90004db6fb605e03f0ecb8df3be32b6658a1417b

export interface BloodGroupType extends BloodGroup {
    percentageUsers?: number | null;
}