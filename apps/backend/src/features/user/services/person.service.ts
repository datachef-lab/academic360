import { db } from "@/db/index.js";
import { addressModel } from "../models/address.model.js";
import { eq } from "drizzle-orm";
import { Person, personModel } from "../models/person.model.js";
import { PersonType } from "@/types/user/person.js";
import { familyModel } from "../models/family.model.js";
import { addAddress, addressResponseFormat, findAddressById, saveAddress } from "./address.service.js";
import { findOccupationById } from "@/features/resources/services/occupation.service.js";
import { findQualificationById } from "@/features/resources/services/qualification.service.js";

export async function addPerson(person: PersonType): Promise<PersonType | null> {
    let { occupation, qualification, officeAddress, ...props } = person;

    if (officeAddress) {
        officeAddress = await addAddress(officeAddress);
    }

    const [newPerson] = await db.insert(personModel).values({
        ...props,
        occupationId: occupation?.id,
        qualificationId: qualification?.id,
        officeAddressId: officeAddress?.id,
    }).returning();

    const formattedPerson = await personResponseFormatted(newPerson);

    return formattedPerson;
}

export async function findPersonById(id: number): Promise<PersonType | null> {
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));

    const formatedPerson = await personResponseFormatted(foundPerson);

    return formatedPerson;
}

export async function savePerson(id: number, person: PersonType): Promise<PersonType | null> {
    const [foundPerson] = await db.select().from(personModel).where(eq(personModel.id, id));
    if (!foundPerson) {
        return null;
    }

    // Update the fields for person
    const { name, email, aadhaarCardNumber, image, officePhone, phone } = person;
    const [updatedPerson] = await db.update(personModel).set({
        name,
        email,
        aadhaarCardNumber,
        image,
        officePhone,
        phone
    }).where(eq(personModel.id, id)).returning();

    // Update the office-address
    if (person.officeAddress?.id) {
        await saveAddress(person.officeAddress?.id, person.officeAddress);
    }

    const formatedPerson = await personResponseFormatted(updatedPerson);

    return formatedPerson;
}

export async function removePerson(id: number): Promise<boolean | null> {
    // Return if the person doesn't exit
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
    // Return if the person doesn't exit
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

export async function personResponseFormatted(person: Person): Promise<PersonType | null> {
    const { occupationId, qualificationId, officeAddressId, ...props } = person;

    const formatedPerson: PersonType = { ...props };

    if (occupationId) {
        formatedPerson.occupation = await findOccupationById(occupationId);
    }

    if (qualificationId) {
        formatedPerson.qualification = await findQualificationById(qualificationId);
    }

    if (officeAddressId) {
        formatedPerson.officeAddress = await findAddressById(officeAddressId);
    }

    return formatedPerson;
}