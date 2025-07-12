import { PlaceOfStay } from "../enums";
import { Address } from "@/types/user/address";

export interface Accommodation {
    readonly id?: number;
    studentId: number,
    placeOfStay: PlaceOfStay | null,
    startDate: Date,
    endDate: Date,
    address: Address | null;
   
}