import { Occupation } from "@/features/resources/models/occupation.model";
import { Qualification } from "@/features/resources/models/qualification.model";
import { Person } from "@/features/user/models/person.model.js";
import { AddressType } from "./address";

export interface PersonType extends Omit<Person, "qualificationId" | "occupationId" | "officeAddressId"> {
    qualification?: Qualification | null;
    occupation?: Occupation | null;
    officeAddress?: AddressType | null;
}
