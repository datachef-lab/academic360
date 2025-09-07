import { BoardUniversity } from "@/features/resources/models/boardUniversity.model.js";
import { AddressType } from "../user/address.js";
import { Degree } from "@/features/resources/models/degree.model.js";

export interface BoardUniversityType
  extends Omit<BoardUniversity, "degreeId" | "addressId"> {
  degree?: Degree | null;
  address?: AddressType | null;
}
