export interface OldCountry {
    readonly id: number;
    countryName: string;
    pos: number;
}

export interface OldCountrySubTab {
    readonly id: number;
    parent_id: number; // References: countrymaintab
    index_col: number;
    stateName: string;
    pos: number;
}

export interface OldCityMaintab {
    readonly id: number;
    countryId: number; // References: countrymaintab
    stateId: string; // References: countrysubtab
}

export interface OldCitySubtab {
    readonly id: number;
    index_col: number;
    parent_id: number; // References: citymaintab
    cityname: string;
    isdistrictName: string;
    pos: number;
}

export interface OldDistrict {
    readonly id: number;
    stateId: string; // References: countrysubtab
    cityId: string; // References: citysubtab
    name: string;
}

export interface OldDegree {
    readonly id?: number;
    degreeName: string;
}

export interface OldInstitution {
    readonly id: number;
    name: string;
    pos: number;
    degreeid: number;
}