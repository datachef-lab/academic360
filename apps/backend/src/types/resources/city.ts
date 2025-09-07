import { City } from "@/features/resources/models/city.model.js";
import { StateType } from "./state.js";

export interface CityType extends Omit<City, "stateId"> {
  state: StateType | null;
}
