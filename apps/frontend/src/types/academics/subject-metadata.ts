import { DegreeProgramme, Framework, SubjectCategory } from "../enums";
import { Specialization } from "../resources/specialization";
import { Stream } from "./stream";

export interface SubjectType {
    readonly id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SubjectMetadata {
    readonly id?: number;
    stream: Stream;
    marksheetCode:string;
    degreeProgramme: DegreeProgramme;
    semester: number;
    framework: Framework;
    specialization: Specialization | null;
    category: SubjectCategory;
    subjectType: SubjectType | null;
    name: string;
    isOptional: boolean;
    credit: number;
    fullMarksTheory: number;
    fullMarksTutorial: number;
    fullMarksInternal: number;
    fullMarksPractical: number;
    practicalCredit:number;
    theoryCredit:number;
    fullMarksProject: number;
    fullMarksViva: number;
    fullMarks: number;
    createdAt?: Date;
    updatedAt?: Date;
}