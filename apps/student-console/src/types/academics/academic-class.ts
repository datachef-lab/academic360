export interface AcademicClass {
    readonly id?: number;
    classname: string;
    position: number;
    details: string | null;
    type: "year" | "semester";
}