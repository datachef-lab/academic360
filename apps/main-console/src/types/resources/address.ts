import { City } from "../user/city";
import { Country } from "./country.types";
import { State } from "./state.types";

export interface Address {
    readonly id?: number;
    country: Country | null;
    state: State | null;
    city: City | null;
    addressLine: string | null;
    landmark: string | null;
    localityType: "RURAL" | "URBAN" | null;
    phone: string | null;
    pincode: string | null;
}