import { Address } from "@/features/user/models/address.model.js";

export interface AddressType extends Omit<Address, "countryId" | "stateId" | "cityId"> {
    country: string | null;
    state: string | null;
    city: string | null;
}