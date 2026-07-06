import { AccommodationType } from "@/types/user/accommodation.js";
import {
  Accommodation,
  accommodationModel,
  createAccommodationSchema,
  AccommodationT,
  Address,
  addressModel,
} from "@repo/db/schemas/models/user";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { addressResponseFormat } from "./address.service.js";

// Upsert the address linked to an accommodation (address holds the accommodationId FK).
async function upsertAccommodationAddress(
  accommodationId: number,
  address: Address | null | undefined,
): Promise<void> {
  if (!address) return;

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    // Drop any nested relation objects and cross-entity FKs that may leak in
    ...rest
  } = address as Record<string, unknown>;
  delete rest.country;
  delete rest.state;
  delete rest.city;
  delete rest.district;
  delete rest.personalDetailsId;
  delete rest.staffId;
  delete rest.personId;
  delete rest.institutionId;
  delete rest.boardId;

  const values = {
    ...(rest as Partial<Address>),
    accommodationId,
  };

  const [existing] = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.accommodationId, accommodationId));

  if (existing) {
    await db
      .update(addressModel)
      .set(values)
      .where(eq(addressModel.id, existing.id));
  } else {
    await db.insert(addressModel).values(values);
  }
}

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
  const { id: _id, address, ...props } = accommodation;
  validateAccommodationInput({ ...props });

  const [newAccommodation] = await db
    .insert(accommodationModel)
    .values({
      admissionGeneralInfoId: props.admissionGeneralInfoId ?? null,
      userId: props.userId ?? null,
      placeOfStay: props.placeOfStay ?? null,
      startDate: props.startDate ?? null,
      endDate: props.endDate ?? null,
    })
    .returning();

  await upsertAccommodationAddress(newAccommodation.id, address);

  return await accommodationResponseFormat(newAccommodation);
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
  const { id: _id, address, ...props } = accommodation;
  validateAccommodationUpdateInput(props);

  const [foundAccommodation] = await db
    .select()
    .from(accommodationModel)
    .where(eq(accommodationModel.id, id));
  if (!foundAccommodation) {
    return null;
  }

  const [updatedAccommodation] = await db
    .update(accommodationModel)
    .set({
      admissionGeneralInfoId:
        props.admissionGeneralInfoId ??
        foundAccommodation.admissionGeneralInfoId,
      userId: props.userId ?? foundAccommodation.userId,
      placeOfStay: props.placeOfStay ?? null,
      startDate: props.startDate ?? null,
      endDate: props.endDate ?? null,
    })
    .where(eq(accommodationModel.id, id))
    .returning();

  await upsertAccommodationAddress(id, address);

  return await accommodationResponseFormat(updatedAccommodation);
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
  const { ...props } = accommodation;
  const formattedAccommodation: AccommodationType = { ...props };

  if (accommodation.id != null) {
    const [linkedAddress] = await db
      .select()
      .from(addressModel)
      .where(eq(addressModel.accommodationId, accommodation.id));
    if (linkedAddress) {
      formattedAccommodation.address =
        await addressResponseFormat(linkedAddress);
    }
  }

  return formattedAccommodation;
}

export async function getAllAccommodations(): Promise<Accommodation[]> {
  const accommodations = await db.select().from(accommodationModel);
  return accommodations;
}
