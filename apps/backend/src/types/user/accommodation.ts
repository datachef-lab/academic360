import { Accommodation } from "@repo/db/schemas/models/user";
import { Address } from "@repo/db/schemas/models/user";

export interface AccommodationType extends Omit<Accommodation, "addressId"> {
    address?: Address | null;
}

