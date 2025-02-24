import { Level } from "../enums";

export interface Degree {
    readonly id?: number;
    name: string;
    level: Level | null,
    sequence: number | null;
    createdAt: Date;
    updatedAt: Date;
}