import { Address } from "../resources/address";
import { Occupation } from "../resources/occupation";
import { Qualification } from "../resources/qualification";

export interface Person {
    readonly id?: number,
    name: string | null,
    email: string | null,
    phone: string | null,
    aadhaarCardNumber: string | null,
    image: string | null,
    officePhone: string | null,
    qualification?: Qualification | null;
    occupation?: Occupation | null;
    officeAddress?: Address | null;
    createdAt: Date,
    updatedAt: Date,
}