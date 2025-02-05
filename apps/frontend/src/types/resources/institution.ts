import { Address } from "./address";
import { Degree } from "./degree";

export interface Institution {
    readonly id?: number;
    name: string;
    degree: Degree | null;
    address: Address | null;
    sequence: number | null;
    createdAt: Date;
    updatedAt: Date;
}