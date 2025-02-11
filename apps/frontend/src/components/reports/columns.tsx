import { ColumnDef } from "@tanstack/react-table";
import { Payment } from "./types";
// import { ArrowUpDown } from "lucide-react"
// import { Button } from "@/components/ui/button";

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "roll",
    header: "Roll No.",
  },
  {
    accessorKey: "semester",
    header: "Semester",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "year",
    header: "Year",
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
    accessorKey: "fullMarks",
    header: "Full Marks",
  },
  {
    accessorKey: "marksObtained",
    header: "Marks Obtained",
  },
  {
    accessorKey: "semesterCredit",
    header: "Semester Credit",
  },
  {
    accessorKey: "sgpa",
    header: "SGPA",
  },
  {
    accessorKey: "cumulativeCredit",
    header: "Cumulative Credit",
  },
  {
    accessorKey: "cgpa",
    header: "CGPA",
  },
  {
    accessorKey: "letterGrade",
    header: "Grade",
  },
  {
    accessorKey: "stream",
    header: "stream",
  },
 
];
