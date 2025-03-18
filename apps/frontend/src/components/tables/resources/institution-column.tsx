import { ColumnDef } from "@tanstack/react-table";
import { Institution } from "@/types/resources/institution";

export const institutionColumns: ColumnDef<Institution>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "degree",
        header: "Degree",
    },
    {
        accessorKey: "sequence",
        header: "Sequence",
    },
    {
        accessorKey: "address",
        header: "Address",
    },
    //  {
    //         accessorKey:"actions",
    //         header:"Actions",
    //         cell:({row})=>{
    //             return <ActionMenu institution={row.original} />
    //         }
    //     }
];