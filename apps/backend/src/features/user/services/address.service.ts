import { db } from "@/db/index.js";
import { Address, addressModel, createAddressSchema, updateAddressSchema, AddressUpdate } from "../models/address.model.js";
import { countryModel, Country } from "@/features/resources/models/country.model.js";
import { eq } from "drizzle-orm";
import { stateModel, State } from "@/features/resources/models/state.model.js";
import { cityModel, City } from "@/features/resources/models/city.model.js";
import { removePersonByAddressId } from "./person.service.js";
import { removePersonalDetailsByAddressId } from "./personalDetails.service.js";
import { z } from "zod";

// Validate input using Zod schema for creation
function validateAddressInput(data: Omit<Address, 'id'>) {
    const parseResult = createAddressSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

// Validate input using Zod schema for updates
function validateAddressUpdateInput(data: AddressUpdate) {
    const parseResult = updateAddressSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addAddress(address: Omit<Address, 'id'>): Promise<Address | null> {
    validateAddressInput(address);
    const [newAddress] = await db.insert(addressModel).values(address).returning();
    return newAddress ? await addressResponseFormat(newAddress) : null;
}

export async function findAddressById(id: number): Promise<Address | null> {
    const [foundAddress] = await db.select().from(addressModel).where(eq(addressModel.id, id));
    return foundAddress ? await addressResponseFormat(foundAddress) : null;
}

export async function getAllAddresses(): Promise<Address[]> {
    const addresses = await db.select().from(addressModel);
    const formatted = await Promise.all(addresses.map(addressResponseFormat));
    return formatted.filter((a): a is Address => !!a);
}

export async function saveAddress(id: number, address: AddressUpdate): Promise<Address | null> {
    const [foundAddress] = await db.select().from(addressModel).where(eq(addressModel.id, id));
    if (!foundAddress) {
        return null;
    }
    validateAddressUpdateInput(address);
    const [updatedAddress] = await db.update(addressModel).set(address).where(eq(addressModel.id, id)).returning();
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
    const [deletedAddress] = await db.delete(addressModel).where(eq(addressModel.id, id)).returning();
    if (!deletedAddress) {
        return false;
    }
    return true; // Success!
}

export async function addressResponseFormat(address: Address) {
    if (!address) {
        return null;
    }
    const { countryId, stateId, cityId, ...props } = address;
    const formattedAddress: Address & { country?: Country; state?: State; city?: City } = { ...props } as Address;
    if (countryId) {
        const [country] = await db.select().from(countryModel).where(eq(countryModel.id, countryId));
        if (country) {
            formattedAddress.country = country;
        }
    }
    if (stateId) {
        const [state] = await db.select().from(stateModel).where(eq(stateModel.id, stateId));
        if (state) {
            formattedAddress.state = state;
        }
    }
    if (cityId) {
        const [city] = await db.select().from(cityModel).where(eq(cityModel.id, cityId));
        if (city) {
            formattedAddress.city = city;
        }
    }
    return formattedAddress;
}