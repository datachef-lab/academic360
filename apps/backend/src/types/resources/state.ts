import { State } from "@/features/resources/models/state.model.js";

export interface StateType extends Omit<State, "countryId"> {
    country: string | null;
}