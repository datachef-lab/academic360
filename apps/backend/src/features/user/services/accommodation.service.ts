import { AccommodationType } from "@/types/user/accommodation.js";
import {
  Accommodation,
  accommodationModel,
  createAccommodationSchema,
  AccommodationT,
} from "@repo/db/schemas/models/user";
import { addAddress, findAddressById, saveAddress } from "./address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validate input using Zod schema for creation
function validateAccommodationInput(data: Omit<AccommodationType, "id">) {
  const parseResult = createAccommodationSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-expect-error
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

// Validate input using Zod schema for updates
function validateAccommodationUpdateInput(data: AccommodationT) {
  const parseResult = createAccommodationSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-expect-error
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

export async function addAccommodation(
  accommodation: AccommodationType,
): Promise<AccommodationType | null> {
  let { id, address, ...props } = accommodation;
  validateAccommodationInput({ ...props, address });

  // // Check for existing accommodation for this student
  // if (typeof props.studentId !== "number") {
  //     const error = new Error("studentId is required and must be a number.");
  //     // @ts-expect-error
  //     error.status = 400;
  //     throw error;
  // }
  // //  const [existing] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, props.studentId));
  // const existing = null;
  // if (existing) {
  //     const error = new Error("Duplicate entry: Accommodation already exists for this student.");
  //     // @ts-expect-error
  //     error.status = 409;
  //     throw error;
  // }

  // if (address) {
  //     // address = await addAddress(address);
  // }
  // const [newAccommodation] = await db.insert(accommodationModel).values({ ...props, addressId: address?.id }).returning();
  // const formattedAccommodation = await accommodationResponseFormat(newAccommodation);
  return null;
}

export async function findAccommotionById(
  id: number,
): Promise<AccommodationType | null> {
  const [foundAccommodation] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.id, id));
  if (!foundAccommodation) return null;
  const formattedAccommodation =
    await accommodationResponseFormat(foundAccommodation);
  return formattedAccommodation;
}

export async function findAccommotionByStudentId(
  studentId: number,
): Promise<AccommodationType | null> {
  // const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));
  // if (!foundAccommodation) return null;
  // const formattedAccommodation = await accommodationResponseFormat(foundAccommodation);
  return null;
}

export async function updateAccommodation(
  id: number,
  accommodation: AccommodationType,
): Promise<AccommodationType | null> {
  let { id: _id, address, ...props } = accommodation;
  console.log("Updating accommodation:", { id, props, address });
  validateAccommodationUpdateInput(props);

  const [foundAccommodation] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.id, id));
  if (!foundAccommodation) {
    return null;
  }

  // Update address if present
  let addressId = foundAccommodation.addressId;
  // if (address && address.id) {
  //     // Use saveAddress for updates instead of addAddress
  //     const { id: _addressId, createdAt: _createdAt, updatedAt: _updatedAt, ...addressPayload } = address;
  //     console.log('Updating address with payload:', addressPayload);
  //     // const updatedAddress = await saveAddress(address.id, addressPayload);
  //     addressId = updatedAddress?.id || addressId;
  //     console.log('Address updated, new addressId:', addressId);
  // } else if (address && !address.id) {
  //     // Create new address if no id
  //     // const newAddress = await addAddress(address);
  //     // addressId = newAddress?.id || addressId;
  // }

  const [updatedAccommodation] = await db
    .update(accommodationModel)
    .set({ ...props, addressId })
    .where(eq(accommodationModel.id, id))
    .returning();
  const formattedAccommodation =
    await accommodationResponseFormat(updatedAccommodation);
  console.log("Final formatted accommodation:", formattedAccommodation);
  return formattedAccommodation;
}

export async function removeAccommodation(id: number): Promise<boolean | null> {
  const foundAccommodation = await findAccommotionById(id);
  if (!foundAccommodation) {
    return null; // No content!
  }
  const [deletedAccommodation] = await db
    .delete(accommodationModel)
    .where(eq(accommodationModel.id, id))
    .returning();
  if (!deletedAccommodation) {
    return false; // Failure!
  }
  return true; // Success!
}

export async function removeAccommodationByStudentId(
  studentId: number,
): Promise<boolean | null> {
  // const [foundAccommodation] = await db.select().from(accommodationModel).where(eq(accommodationModel.studentId, studentId));
  const foundAccommodation = null;
  if (!foundAccommodation) {
    return null; // No content!
  }
  // const [deletedAccommodation] = await db.delete(accommodationModel).where(eq(accommodationModel.id, foundAccommodation.id)).returning();
  const deletedAccommodation = null;
  if (!deletedAccommodation) {
    return false; // Failure!
  }
  return true; // Success!
}

export async function accommodationResponseFormat(
  accommodation: Accommodation,
): Promise<AccommodationType | null> {
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
