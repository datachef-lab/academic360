import { DegreeProgramme, Framework, Level } from "../enums";
import { Degree } from "../resources/degree";

export interface Stream {
    readonly id?: number,
    name: string,
    level: Level | null,
    framework: Framework,
    degree: Degree,
    degreeProgramme: DegreeProgramme | null,
    duration: number,
    numberOfSemesters: number,
    createdAt: Date,
    updatedAt: Date,
}