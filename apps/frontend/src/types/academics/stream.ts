import { Level } from "../enums";

export interface Stream {
    readonly id?: number,
    name: string,
    level: Level | null,
    duration: number,
    numberOfSemesters: number,
    createdAt: Date,
    updatedAt: Date,
}