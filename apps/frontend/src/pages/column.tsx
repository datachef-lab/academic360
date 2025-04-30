import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";

export interface User {
    id: number;
    name: string;
    position: string;
    email: string;
    contact: string;
    avatarColor: string;
  }
export const columns: ColumnDef<User, unknown>[] = [
  {
    accessorKey: "id",
    header: "S.No",
    cell: ({ row }) => (
      <div className="text-sm text-center text-gray-900">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarFallback style={{ backgroundColor: row.original.avatarColor }}>
            {row.original.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: ({ row }) => {
      const position = row.getValue("position") as string;
      return (
        <Badge 
          variant={position === 'Teacher' ? 'default' : 'secondary'}
          className={`${
            position === 'Teacher' 
              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
              : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
          } rounded-full px-3 py-1 text-xs`}
        >
          {position}
        </Badge>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-sm text-gray-500">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "contact",
    header: "Mail Contact/Phone",
    cell: ({ row }) => (
      <div className="text-sm text-gray-500">{row.getValue("contact")}</div>
    ),
  },
];
