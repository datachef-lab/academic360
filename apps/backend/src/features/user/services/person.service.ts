import { db } from "@/db/index";
import { addressModel } from "../models/address.model";
import { eq } from "drizzle-orm";
import { Person, personModel } from "../models/person.model";
import { PersonType } from "@/types/user/person";
import { gaurdianModel } from "../models/guardian.model";
import { parentModel } from "../models/parent.model";

export async function findPersonById(id: number): Promise<PersonType | null> {
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));

    const formatedPerson = await personResponseFormatted(foundPerson);

    return formatedPerson;
}

export async function removePerson(id: number): Promise<boolean | null> {
    // Return if the person doesn't exit
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));
    if (!findPersonById) {
        return null;
    }

    // Delete the person: -
    // Step 1: Delete the parents
    await db.delete(parentModel).where(eq(parentModel.fatherDetailsId, id)).returning();
    await db.delete(parentModel).where(eq(parentModel.motherDetailsId, id)).returning();

    // Step 2: Delete the guardian
    await db.delete(gaurdianModel).where(eq(gaurdianModel.gaurdianDetailsId, id)).returning();

    // Step 3: Delete the person
    await db.delete(personModel).where(eq(personModel.id, id));

    // Step 4: Delete the address
    if (foundPerson.officeAddressId) {
        const [deletedAddress] = await db.delete(addressModel).where(eq(addressModel.id, foundPerson.officeAddressId)).returning();
        if (!deletedAddress) return false;
    }

    return true;
}

export async function removePersonByAddressId(addressId: number): Promise<boolean | null> {

    return null;
}

export async function personResponseFormatted(person: Person): Promise<PersonType | null> {
    return null
}