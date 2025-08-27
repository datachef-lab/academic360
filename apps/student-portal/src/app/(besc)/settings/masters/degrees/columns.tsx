"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Degree } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDegree } from "./actions";

export const columns = ({ onEdit }: { onEdit: (degree: Degree) => void }): ColumnDef<Degree>[] => [
  {
    accessorKey: "id",
    header: "Sr. No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "level",
    header: "Level",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      if (row.original.createdAt) {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString();
      } else {
        return 'N/A';
      }
    },
  },
  {
    accessorKey: "disabled",
    header: "Status",
    cell: ({ row }) => {
      const isActive = !row.original.disabled;
      return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const degree = row.original;
      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(degree)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the degree:
                  <span className="font-medium"> {degree.name}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (degree.id !== undefined) {
                      await deleteDegree(degree.id);
                    } else {
                      console.error("Error deleting degree: Missing ID.");
                    }
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
]; 