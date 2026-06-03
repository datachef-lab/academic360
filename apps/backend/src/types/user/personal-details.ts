import { PersonalDetails } from "@academic/db/schemas/models/user";
import { AddressType } from "./address.js";
import { Nationality } from "@academic/db/schemas/models/resources";
import { Religion } from "@academic/db/schemas/models/resources";
import { Category } from "@academic/db/schemas/models/resources";
import { LanguageMedium } from "@academic/db/schemas/models/resources";
import { Disability } from "@academic/db/schemas/models/user";

export interface PersonalDetailsType extends Omit<
  PersonalDetails,
  | "nationalityId"
  | "religionId"
  | "categoryId"
  | "motherTongueId"
  | "mailingAddressId"
  | "residentialAddressId"
  | "disabilityCodeId"
> {
  nationality?: Nationality | null;
  religion?: Religion | null;
  category?: Category | null;
  motherTongue?: LanguageMedium | null;
  mailingAddress?: AddressType | null;
  residentialAddress?: AddressType | null;
  disabilityCode?: Disability | null;
}
