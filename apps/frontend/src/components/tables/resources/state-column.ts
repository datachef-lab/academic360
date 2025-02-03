import { ColumnDef } from "@tanstack/react-table";
import { State } from "@/types/resources/state";

export const stateColumns: ColumnDef<State>[] = [
    {
        accessorKey: "country",
        header: "Country",
    },
    {
        accessorKey: "State",
        header: "Name",
    },
];