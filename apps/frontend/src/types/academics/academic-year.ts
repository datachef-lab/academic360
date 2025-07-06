import { Session } from "./session";

export interface AcademicYear {
    readonly id?: number;
    year: string;
    isCurrentYear: boolean;
    session: Session;
    creaytedAt?: Date;
    updatedAt?: Date;
}