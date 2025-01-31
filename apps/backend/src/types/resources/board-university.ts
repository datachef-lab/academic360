import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.ts";
import { AddressType } from "../user/address.ts";

export interface BoardUniversityType extends Omit<BoardUniversity, "degreeId" | "addressId"> {
    degree: string | null;
    address: AddressType | null;
}

