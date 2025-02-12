import { AccommodationType } from "@/types/user/accommodation";
import { Accommodation, accommodationModel } from "../models/accommodation.model";
import { addAddress, findAddressById } from "./address.service";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";

export async function addAccommodation(accommodation: AccommodationType): Promise<AccommodationType | null> {
    let { address, startDate, ...props } = accommodation;

    if (address) {
        address = await addAddress(address);
    }

    const [newAccommodation] = await db.insert(accommodationModel).values({...props, addressId: address?.id}).returning();

    const formattedAccommodation = await accommodationResponseFormat(newAccommodation);

    return formattedAccommodation;
}

export async function findAccommotionById(id: number): Promise<AccommodationType | null> {
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.id, id));

    const formattedAccommodation = await accommodationResponseFormat(foundAccommodation);

    return formattedAccommodation;
}

export async function findAccommotionByStudentId(studentId: number): Promise<AccommodationType | null> {
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));

    const formattedAccommodation = await accommodationResponseFormat(foundAccommodation);

    return formattedAccommodation;
}

export async function removeAccommodation(id: number): Promise<boolean | null> {
    // Return if the accommodation does not exist
    const foundAccommodation = await findAccommotionById(id);
    if (!foundAccommodation) {
        return null; // No content!
    }
    // Delete the accommodation: -
    const [deletedAccommodation] = await db.delete(accommodationModel).where(eq(accommodationModel.id, id)).returning()

    if (!deletedAccommodation) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removeAccommodationByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the accommodation does not exist
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));
    if (!foundAccommodation) {
        return null; // No content!
    }
    // Delete the accommodation: -
    const [deletedAccommodation] = await db.delete(accommodationModel).where(eq(accommodationModel.id, foundAccommodation.id)).returning()

    if (!deletedAccommodation) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function accommodationResponseFormat(accommodation: Accommodation): Promise<AccommodationType | null> {
    if (!accommodation) {
        return null;
    }

    const { addressId, ...props } = accommodation;

    const formattedAccommodation: AccommodationType = { ...props };

    if (addressId) {
        formattedAccommodation.address = await findAddressById(addressId);
    }

    return formattedAccommodation;
}