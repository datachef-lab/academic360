import { BloodGroupT, BoardT, CityT, DegreeT, InstitutionT, StateT } from "@/schemas";
import { AddressDto } from "../user";


export interface BloodGroupDto extends BloodGroupT {
    percentageUsers?: number | null;
}

export interface BoardUniversityDto extends Omit<BoardT, "degreeId" | "addressId"> {
    degree?: DegreeT | null;
    address?: AddressDto | null;
}

export interface StateDto extends Omit<StateT, "countryId"> {
    country: string | null;
}

export interface CityDto extends Omit<CityT, "stateId"> {
    state: StateDto | null;
}

export interface InstitutionDto extends Omit<InstitutionT, "degreeId" | "addressId"> {
    degree?: DegreeT | null;
    address?: AddressDto | null;
}

