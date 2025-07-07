export interface Class {
    readonly id?: number;
    name: string;
    type: "YEAR" | "SEMESTER";
    sequence: number;
    disabled: boolean;
    creaytedAt?: Date;
    updatedAt?: Date;
}
