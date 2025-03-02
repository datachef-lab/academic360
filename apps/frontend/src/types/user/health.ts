import { BloodGroup } from "../resources/blood-group";

export interface Health {
    readonly id?: number;
    studentId: number,
    bloodGroup?: BloodGroup | null;
    eyePowerLeft: number | null,
    eyePowerRight: number | null,
    height: number | null,
    width: number | null,
    pastMedicalHistory: string | null,
    pastSurgicalHistory: string | null,
    drugAllergy: string | null,
    createdAt?: Date;
    updatedAt?: Date;
}