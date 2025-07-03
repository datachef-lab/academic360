import { Degree } from "../resources/degree";

export interface Course {
    readonly id?: number;
    degree: Degree;
    name: string;
    shortName: string | null;
    codePrefix: string | null;
    universityCode: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}