import { ColumnDef } from "@tanstack/react-table";

import { SearchStudent } from "@/types/resources/SearchStudent";
import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
// import { ArrowUpDown } from "lucide-react"
// import { Button } from "@/components/ui/button";

export const StudentSearchColumn: ColumnDef<SearchStudent>[] = [
  {
    accessorKey: "reg_number",
    header: "Registration No.",
  },
  // {
  //   accessorKey: "roll",
  //   header: "Roll No.",
  // },
  {
    accessorKey: "uid",
    header: "UID",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
         return <DataTableColumnHeader column={column} title="Name" />;
       },
  },
  // {
  //   accessorKey: "email",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Email
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button>
  //     )
  //   },
  // },
  {
    accessorKey: "nationality",
    header: "Nationality",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "religion",
    header: "Religion",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "handicapped",
    header: "Handicapped",
  },
  {
    accessorKey: "course",
    header: "Course",
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
  },
  // {
  //   accessorKey: "shift",
  //   header: "Shift",
  // },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "leaving_date",
    header: "Leaving Date",
  },
 
 
];
