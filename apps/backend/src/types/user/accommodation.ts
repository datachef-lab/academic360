import { Accommodation } from "@/features/user/models/accommodation.model.ts";
import { AddressType } from "./address.ts";

export interface AccommodationType extends Omit<Accommodation, "addressId"> {
    address: AddressType;
}

