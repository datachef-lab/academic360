import { City } from "@/features/resources/models/city.model.ts";
import { StateType } from "./state.ts";

export interface CityType extends Omit<City, "stateId"> {
    state: StateType | null;
}