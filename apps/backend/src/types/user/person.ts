import { Person } from "@/features/user/models/person.model.js";

export interface PersonType extends Omit<Person, "qualificationId" | "occupationId"> {
    qualification: string | null;
    occupation: string | null;
    officeAddress: string | null;
}
