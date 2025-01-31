import { State } from "@/features/resources/models/state.model.ts";

export interface StateType extends Omit<State, "countryId"> {
    country: string | null;
}