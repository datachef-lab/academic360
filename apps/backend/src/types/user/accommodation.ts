import { Accommodation } from "@academic/db/schemas/models/user";
import { Address } from "@academic/db/schemas/models/user";

export interface AccommodationType extends Omit<Accommodation, "addressId"> {
  address?: Address | null;
}
