import { ColumnDef } from "@tanstack/react-table";
import { Report } from "./types";

export const ReportColumns: ColumnDef<Report>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "rollNumber",
    header: "Roll No.",
  },
  {
    accessorKey: "registrationNumber",
    header: "Registration No.",
  },
  {
    accessorKey: "uid",
    header: "UID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "stream",
    header: "Stream",
  },
  {
    accessorKey: "framework",
    header: "Framework",
  },
  {
    accessorKey: "semester",
    header: "Semester",
  },
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "sgpa",
    header: "SGPA",
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
    accessorKey: "remarks",
    header: "Remarks",
  },

  {
    accessorKey: "totalFullMarks",
    header: "Total Full Marks",
  },
  {
    accessorKey: "totalObtainedMarks",
    header: "Total Marks Obtained",
  },
  {
    accessorKey: "totalCredit",
    header: " Credit",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "percentage",
    header: "Percentage",
  },
  // {
  //   accessorKey: "isFailed",
  //   header: "Failed?",
  //   cell: ({ row }) => (row.original.isFailed ? "Yes" : "No"),
  // },
 
  // {
  //   accessorKey: "historicalStatus",
  //   header: "Historical Status",
  // },
];