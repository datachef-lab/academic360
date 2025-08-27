export interface Class {
    readonly id?: number;
    name: string;
    type: "YEAR" | "SEMESTER";
    shortName: string | null;
    sequence?: number;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
