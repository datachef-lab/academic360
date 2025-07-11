import { db } from "@/db/index.js";
import { addressModel } from "../models/address.model.js";
import { eq } from "drizzle-orm";
import { Person, personModel, createPersonSchema } from "../models/person.model.js";
import { familyModel } from "../models/family.model.js";
import { addAddress, addressResponseFormat, findAddressById, saveAddress } from "./address.service.js";
import { findOccupationById } from "@/features/resources/services/occupation.service.js";
import { findQualificationById } from "@/features/resources/services/qualification.service.js";
import { z } from "zod";

// Validate input using Zod schema
function validatePersonInput(data: Omit<Person, 'id'>) {
    const parseResult = createPersonSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addPerson(person: Omit<Person, 'id'>): Promise<Person | null> {
    validatePersonInput(person);
    const [newPerson] = await db.insert(personModel).values(person).returning();
    return newPerson ? await personResponseFormatted(newPerson) : null;
}

export async function findPersonById(id: number): Promise<Person | null> {
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));
    return foundPerson ? await personResponseFormatted(foundPerson) : null;
}

export async function getAllPersons(): Promise<Person[]> {
    const persons = await db.select().from(personModel);
    const formatted = await Promise.all(persons.map(personResponseFormatted));
    return formatted.filter((p): p is Person => !!p);
}

export async function savePerson(id: number, person: Omit<Person, 'id'>): Promise<Person | null> {
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));
    if (!foundPerson) {
        return null;
    }
    validatePersonInput(person);
    const [updatedPerson] = await db.update(personModel).set(person).where(eq(personModel.id, id)).returning();
    return updatedPerson ? await personResponseFormatted(updatedPerson) : null;
}

export async function removePerson(id: number): Promise<boolean | null> {
    // Return if the person doesn't exist
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));
    if (!foundPerson) {
        return null;
    }
    // Delete the person: -
    // Step 1: Delete the family
    await db.delete(familyModel).where(eq(familyModel.fatherDetailsId, id)).returning();
    await db.delete(familyModel).where(eq(familyModel.motherDetailsId, id)).returning();
    // Step 2: Delete the person
    await db.delete(personModel).where(eq(personModel.id, id));
    // Step 3: Delete the address
    if (foundPerson.officeAddressId) {
        const [deletedAddress] = await db.delete(addressModel).where(eq(addressModel.id, foundPerson.officeAddressId)).returning();
        if (!deletedAddress) return false;
    }
    return true;
}

export async function removePersonByAddressId(officeAddressId: number): Promise<boolean | null> {
    // Return if the person doesn't exist
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.officeAddressId, officeAddressId));
    if (!foundPerson) {
        return null;
    }
    // Delete the person: -
    // Step 1: Delete the parents
    await db.delete(familyModel).where(eq(familyModel.fatherDetailsId, foundPerson.id)).returning();
    await db.delete(familyModel).where(eq(familyModel.motherDetailsId, foundPerson.id)).returning();
    // Step 2: Delete the person
    const [deletedPerson] = await db.delete(personModel).where(eq(personModel.id, foundPerson.id)).returning();
    if (!deletedPerson) {
        return false;
    }
    return true;
}

export async function personResponseFormatted(person: Person): Promise<Person | null> {
    if (!person) return null;
    const { occupationId, qualificationId, officeAddressId, ...props } = person;
    const formattedPerson: Person = { ...props } as Person;
    if (occupationId) {
        (formattedPerson as any).occupation = await findOccupationById(occupationId);
    }
    if (qualificationId) {
        (formattedPerson as any).qualification = await findQualificationById(qualificationId);
    }
    if (officeAddressId) {
        (formattedPerson as any).officeAddress = await findAddressById(officeAddressId);
    }
    return formattedPerson;
}