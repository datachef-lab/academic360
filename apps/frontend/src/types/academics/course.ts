import { Stream } from "./stream";

export interface Course {
    readonly id?: number;
    stream: Stream;
    name: string;
    shortName: string | null;
    codePrefix: string | null;
    universityCode: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}