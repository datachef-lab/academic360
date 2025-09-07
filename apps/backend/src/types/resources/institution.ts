import { Degree } from "@/features/resources/models/degree.model";
import { Institution } from "@/features/resources/models/institution.model.js";
import { AddressType } from "../user/address";

export interface InstitutionType
  extends Omit<Institution, "degreeId" | "addressId"> {
  degree?: Degree | null;
  address?: AddressType | null;
}
