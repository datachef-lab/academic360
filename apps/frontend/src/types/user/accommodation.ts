import { PlaceOfStay } from "../enums";
import { Address } from "../resources/address";

export interface Accommodation {
    readonly id?: number;
    studentId: number,
    placeOfStay: PlaceOfStay | null,
    startDate: Date,
    endDate: Date,
    address: Address | null;
    createdAt: Date;
    updatedAt: Date;
}