import { DataTableColumnHeader } from "@/components/globals/DataColumnHeader";
import { IssuedBook } from "@/types/resources/IssuedBooks";
import { ColumnDef } from "@tanstack/react-table";

export const IssuedBookColumns: ColumnDef<IssuedBook>[] = [
    {
        accessorKey: "id",
         header: ({ column }) => {
                 return <DataTableColumnHeader column={column} title="Id" />;
               },
    },
    {
        accessorKey: "isbn",
        header:( { column }) => {
            return <DataTableColumnHeader column={column} title="ISBN" />;
        },
    },
    {
        accessorKey: "title",
        header:( { column }) => {
            return <DataTableColumnHeader column={column} title="Title" />;
        },
    },
    {
        accessorKey: "author",
       header:( { column }) => {
            return <DataTableColumnHeader column={column} title="Author" />;
        },
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "issueDate",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Issue Date" />;
          },
    },
    {
        accessorKey: "dueDate",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Due Date" />;
          },
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "fine",
        header: () => <div className="text-right">Fine (₹)</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("fine"));
          const formatted = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(amount);
      
          return <div className="text-right font-medium">{formatted}</div>;
        },
      },
    
   
    
];