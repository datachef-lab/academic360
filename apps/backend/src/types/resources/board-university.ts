import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.js";
import { AddressType } from "../user/address.js";

export interface BoardUniversityType extends Omit<BoardUniversity, "degreeId" | "addressId"> {
    degree: string | null;
    address: AddressType | null;
}

