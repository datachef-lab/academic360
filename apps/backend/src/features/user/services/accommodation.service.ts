import { AccommodationType } from "@/types/user/accommodation.js";
import { Accommodation, accommodationModel, createAccommodationSchema } from "../models/accommodation.model.js";
import { addAddress, findAddressById } from "./address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validate input using Zod schema
function validateAccommodationInput(data: Omit<AccommodationType, 'id'>) {
    const parseResult = createAccommodationSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addAccommodation(accommodation: AccommodationType): Promise<AccommodationType | null> {
    let { id, address, ...props } = accommodation;
    validateAccommodationInput({ ...props, address });

    // Check for existing accommodation for this student
    if (typeof props.studentId !== "number") {
        const error = new Error("studentId is required and must be a number.");
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    const [existing] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, props.studentId));
    if (existing) {
        const error = new Error("Duplicate entry: Accommodation already exists for this student.");
        // @ts-expect-error
        error.status = 409;
        throw error;
    }

    if (address) {
        address = await addAddress(address);
    }
    const [newAccommodation] = await db.insert(accommodationModel).values({ ...props, addressId: address?.id }).returning();
    const formattedAccommodation = await accommodationResponseFormat(newAccommodation);
    return formattedAccommodation;
}

export async function findAccommotionById(id: number): Promise<AccommodationType | null> {
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.id, id));
    if (!foundAccommodation) return null;
    const formattedAccommodation = await accommodationResponseFormat(foundAccommodation);
    return formattedAccommodation;
}

export async function findAccommotionByStudentId(studentId: number): Promise<AccommodationType | null> {
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));
    if (!foundAccommodation) return null;
    const formattedAccommodation = await accommodationResponseFormat(foundAccommodation);
    return formattedAccommodation;
}

export async function updateAccommodation(id: number, accommodation: AccommodationType): Promise<AccommodationType | null> {
    let { id: _id, address, ...props } = accommodation;
    validateAccommodationInput({ ...props, address });
    if (address) {
        address = await addAddress(address);
    }
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.id, id));
    if (!foundAccommodation) {
        return null;
    }
    const [updatedAccommodation] = await db.update(accommodationModel).set({ ...props, addressId: address?.id }).where(eq(accommodationModel.id, id)).returning();
    const formattedAccommodation = await accommodationResponseFormat(updatedAccommodation);
    return formattedAccommodation;
}

export async function removeAccommodation(id: number): Promise<boolean | null> {
    const foundAccommodation = await findAccommotionById(id);
    if (!foundAccommodation) {
        return null; // No content!
    }
    const [deletedAccommodation] = await db.delete(accommodationModel).where(eq(accommodationModel.id, id)).returning();
    if (!deletedAccommodation) {
        return false; // Failure!
    }
    return true; // Success!
}

export async function removeAccommodationByStudentId(studentId: number): Promise<boolean | null> {
    const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));
    if (!foundAccommodation) {
        return null; // No content!
    }
    const [deletedAccommodation] = await db.delete(accommodationModel).where(eq(accommodationModel.id, foundAccommodation.id)).returning();
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

export async function getAllAccommodations(): Promise<Accommodation[]> {
    const accommodations = await db.select().from(accommodationModel);
    return accommodations;
}


  