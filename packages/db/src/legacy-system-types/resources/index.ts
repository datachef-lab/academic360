export interface Country {
    readonly id: number;
    countryName: string;
    pos: number;
}

export interface CountrySubTab {
    readonly id: number;
    parent_id: number; // References: countrymaintab
    index_col: number;
    stateName: string;
    pos: number;
}

export interface CityMaintab {
    readonly id: number;
    countryId: number; // References: countrymaintab
    stateId: string; // References: countrysubtab
}

export interface CitySubtab {
    readonly id: number;
    index_col: number;
    parent_id: number; // References: citymaintab
    cityname: string;
    isdistrictName: string;
    pos: number;
}

export interface DistrictMaintab {
    readonly id: number;
    stateId: string; // References: countrysubtab
    cityId: string; // References: citysubtab
    name: string;
}