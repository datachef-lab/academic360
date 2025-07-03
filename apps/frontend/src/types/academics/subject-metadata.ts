import { Framework, ProgrammeType, SubjectCategory } from "../enums";
import { Degree } from "../resources/degree";
import { Specialization } from "../resources/specialization";
import { Class } from "./class";

export interface SubjectType {
    readonly id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SubjectMetadata {
    readonly id?: number;
    degree: Degree;
    programmeType: ProgrammeType;
    framework: Framework;
    class: Class;
    specialization: Specialization | null;
    category: SubjectCategory;
    subjectType: SubjectType | null;
    irpName: string | null;
    name: string;
    irpCode: string | null;
    marksheetCode: string | null;
    isOptional: boolean;
    credit: number;
    theoryCredit:number;
    fullMarksTheory: number;
    practicalCredit:number;
    fullMarksPractical: number;

    internalCredit: number | null,
    fullMarksInternal: number | null,
    projectCredit: number | null,
    fullMarksProject: number | null,
    vivalCredit: number | null,
    fullMarksViva: number | null,
    fullMarks: number | null,

    createdAt?: Date;
    updatedAt?: Date;
}