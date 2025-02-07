import { db } from "@/db/index.js";
import { Address, addressModel } from "../models/address.model.js";
import { AddressType } from "@/types/user/address.js";
import { countryModel } from "@/features/resources/models/country.model.js";
import { eq } from "drizzle-orm";
import { stateModel } from "@/features/resources/models/state.model.js";
import { cityModel } from "@/features/resources/models/city.model.js";
import { removePersonByAddressId } from "./person.service.js";
import { removePersonalDetailsByAddressId } from "./personalDetails.service.js";

export async function addAddress(address: Address): Promise<AddressType | null> {
    const [newAddress] = await db.insert(addressModel).values(address).returning();

    const formattedAddress = await addressResponseFormat(newAddress);

    return formattedAddress;
}

export async function findAddressById(id: number): Promise<AddressType | null> {
    const [foundAddress] = await db.select().from(addressModel).where(eq(addressModel.id, id));

    if (foundAddress) {
        const formattedAddress = await addressResponseFormat(foundAddress);

        return formattedAddress;
    }

    return null;
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

    const tmpAddress: AddressType = {
        addressLine: address.addressLine,
        landmark: address.landmark,
        localityType: address.localityType,
        phone: address.phone,
        id: address.id,
        pincode: address.pincode,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
        country: '',
        state: '',
        city: ''
    }

    if (address.countryId) {
        const [country] = await db.select().from(countryModel).where(eq(countryModel.id, address.countryId));
        if (country) {
            tmpAddress.country = country.name;
        }
    }
    if (address.stateId) {
        const [state] = await db.select().from(stateModel).where(eq(stateModel.id, address.stateId));
        if (state) {
            tmpAddress.state = state.name;
        }
    }
    if (address.cityId) {
        const [city] = await db.select().from(cityModel).where(eq(cityModel.id, address.cityId));
        if (city) {
            tmpAddress.city = city.name;
        }
    }


    return tmpAddress;
}