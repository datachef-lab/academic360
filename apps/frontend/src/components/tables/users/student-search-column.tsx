import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Stream } from "@/types/academics/stream";
import { Gender, StudentStatus } from "@/types/enums";
import { Category } from "@/types/resources/category";
import { Nationality } from "@/types/resources/nationality";
import { Religion } from "@/types/resources/religion";
import { Specialization } from "@/types/resources/specialization";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

export interface StudentSearchType {
  readonly id?: number;
  registrationNumber: string | null;
  rollNumber: string | null;
  uid: string | null;
  name: string;
  nationality: Nationality | null;
  gender: Gender | null;
  religion: Religion | null;
  category: Category | null;
  handicapped: boolean;
  stream: Stream | null;
  specialization: Specialization | null;
  active: boolean;
  alumni: boolean;
  leavingDate: Date | null;
}

export const studentSearchColumns: ColumnDef<StudentSearchType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nationality",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nationality" />;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
    cell: ({ row }) => {
      const student = row.original;

      if (student.name) {
        console.log(student.name);
        return <p>{student.name}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const student = row.original;

      if (student.gender) {
        return <p>{student.gender}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "religion",
    header: "Religion",
    cell: ({ row }) => {
      const student = row.original;

      if (student.religion) {
        return <p>{student.religion.name}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const student = row.original;

      if (student.category) {
        return <p>{student.category.name}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "registrationNumber",
    header: "Registration No.",
  },
  {
    accessorKey: "rollNumber",
    header: "Roll No.",
  },
  {
    accessorKey: "stream",
    header: "Stream",
    cell: ({ row }) => {
      const student = row.original;

      if (student.stream) {
        return <p>{student.stream.name}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    cell: ({ row }) => {
      const student = row.original;

      if (student.specialization) {
        return <p>{student.specialization.name}</p>;
      }

      return <p>-</p>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const student = row.original;
      let status: StudentStatus | null = null;

      if (student.leavingDate || (!student.active && student.alumni)) {
        status = "GRADUATED";
      } else if (student.active == null || student.alumni == null) {
        status = null;
      } else if (!student.active && !student.alumni) {
        status = "DROPPED_OUT";
      } else if (student.active && !student.alumni) {
        status = "ACTIVE";
      } else if (student.active && student.alumni) {
        status = "PENDING_CLEARANCE";
      }

      return <p>{status ? status : "-"}</p>;
    },
  },
  {
    accessorKey: "leavingDate",
    header: "Leaving Date",
  },
  {
    header: "Actions",
    cell: ({ row }) => {
      const student = row.original;

      return (
        <Link to={`${student.id}`} className="p-0 m-0 flex">
          <Button variant="secondary" size="sm">
            View
          </Button>
        </Link>
      );
    },
  },
];
