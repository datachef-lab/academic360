import { City } from "@/features/resources/models/city.model";
import { Country } from "@/features/resources/models/country.model";
import { State } from "@/features/resources/models/state.model";
import { Address } from "@academic/db/schemas/models/user";

export interface AddressType extends Omit<
  Address,
  "countryId" | "stateId" | "cityId"
> {
  country?: Country | null;
  state?: State | null;
  city?: City | null;
}
