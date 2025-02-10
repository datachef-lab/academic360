import { Accommodation } from "@/features/user/models/accommodation.model.js";
import { AddressType } from "./address.js";

export interface AccommodationType extends Omit<Accommodation, "addressId"> {
    address?: AddressType | null;
}

