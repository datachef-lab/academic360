import { db } from "@/db/index.js";
import {
  Address,
  addressModel,
  createAddressSchema,
} from "@repo/db/schemas/models/user";
// Use shared resource models from @repo/db to ensure column names match DB schema
import { countryModel } from "@repo/db/schemas/models/resources/country.model.js";
import { eq } from "drizzle-orm";
import { stateModel } from "@repo/db/schemas/models/resources/state.model.js";
import { cityModel } from "@repo/db/schemas/models/resources/city.model.js";
import { removePersonByAddressId } from "./person.service.js";
import { removePersonalDetailsByAddressId } from "./personalDetails.service.js";
import { z } from "zod";
import { AddressDto } from "@repo/db/index.js";
import { districtModel } from "@repo/db/schemas/models/resources/district.model.js";
import { districtT } from "@repo/db/schemas/models/resources/district.model.js";
import { postOfficeModel } from "@repo/db/schemas/models/user/post-office.model.js";
import { policeStationModel } from "@repo/db/schemas/models/user/police-station.model.js";

// Validate input using Zod schema for creation
function validateAddressInput(data: Omit<Address, "id">) {
  const parseResult = createAddressSchema.safeParse(data);
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
function validateAddressUpdateInput(data: Address) {
  const parseResult = createAddressSchema.safeParse(data);
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

export async function addAddress(
  address: Omit<Address, "id">,
): Promise<AddressDto | null> {
  validateAddressInput(address);
  const [newAddress] = await db
    .insert(addressModel)
    .values(address)
    .returning();
  return newAddress ? await addressResponseFormat(newAddress) : null;
}

export async function findAddressById(id: number): Promise<AddressDto | null> {
  const [foundAddress] = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.id, id));
  return foundAddress ? await addressResponseFormat(foundAddress) : null;
}

// Cache for addresses to prevent repeated expensive queries
const addressesCache = new Map<
  string,
  { data: AddressDto[]; timestamp: number }
>();
const ADDRESS_CACHE_DURATION = 60000; // 1 minute cache

export async function getAllAddresses(): Promise<AddressDto[]> {
  const cacheKey = "all_addresses";
  const cached = addressesCache.get(cacheKey);

  // Return cached data if it's still valid
  if (cached && Date.now() - cached.timestamp < ADDRESS_CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Simplified query - just get addresses without complex joins
    const addresses = await db
      .select()
      .from(addressModel)
      .orderBy(addressModel.createdAt)
      .limit(100); // Limit to prevent huge datasets

    // Use the existing addressResponseFormat function for consistency
    const formatted = await Promise.all(
      addresses.map((addr) => addressResponseFormat(addr)),
    );

    const validAddresses = formatted.filter((a): a is AddressDto => !!a);

    // Cache the result
    addressesCache.set(cacheKey, {
      data: validAddresses,
      timestamp: Date.now(),
    });

    return validAddresses;
  } catch (error) {
    console.error("Error fetching addresses:", error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

export async function saveAddress(
  id: number,
  address: Address,
): Promise<AddressDto | null> {
  const [foundAddress] = await db
    .select()
    .from(addressModel)
    .where(eq(addressModel.id, id));
  if (!foundAddress) {
    return null;
  }
  validateAddressUpdateInput(address);
  const [updatedAddress] = await db
    .update(addressModel)
    .set(address)
    .where(eq(addressModel.id, id))
    .returning();
  return updatedAddress ? await addressResponseFormat(updatedAddress) : null;
}

export async function removeAddress(id: number): Promise<boolean | null> {
  // Return if the address does not exist
  const foundAddress = await findAddressById(id);
  if (!foundAddress) {
    return null;
  }
  // Delete the address: -
  let isDeleted: boolean | null = false;
  // Step 1: Delete the person
  isDeleted = await removePersonByAddressId(id);
  if (isDeleted !== null && !isDeleted) return false;

  // Step 2: Delete the personal-details
  isDeleted = await removePersonalDetailsByAddressId(id);
  if (isDeleted !== null && !isDeleted) return false;

  // Step 3: Delete the address
  const [deletedAddress] = await db
    .delete(addressModel)
    .where(eq(addressModel.id, id))
    .returning();
  if (!deletedAddress) {
    return false;
  }
  return true; // Success!
}

export async function addressResponseFormat(
  address: Address,
): Promise<AddressDto | null> {
  if (!address) {
    return null;
  }
  const { countryId, stateId, cityId, districtId, ...props } = address;
  const formattedAddress: AddressDto = {
    ...(props as any),
    country: null,
    state: null,
    city: null,
    district: null,
  } as AddressDto;
  if (countryId) {
    const [country] = await db
      .select()
      .from(countryModel)
      .where(eq(countryModel.id, countryId));
    if (country) {
      formattedAddress.country = country as any;
    }
  }
  if (stateId) {
    const [state] = await db
      .select()
      .from(stateModel)
      .where(eq(stateModel.id, stateId));
    if (state) {
      formattedAddress.state = state as any;
    }
  }
  if (cityId) {
    const [city] = await db
      .select()
      .from(cityModel)
      .where(eq(cityModel.id, cityId));
    if (city) {
      formattedAddress.city = city as any;
    }
  }
  if (districtId) {
    const [district] = await db
      .select()
      .from(districtModel)
      .where(eq(districtModel.id, districtId));
    if (district) {
      formattedAddress.district = district as any;
    }
  }
  return formattedAddress;
}
