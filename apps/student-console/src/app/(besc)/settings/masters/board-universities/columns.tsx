"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BoardUniversity } from "@/db/schema"; // Make sure this import is correct based on your schema
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
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
import { deleteBoardUniversity } from './actions';

export const columns: ColumnDef<BoardUniversity>[] = [
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
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      if (row.original.createdAt) {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString(); // Or format as needed
      } else {
        return 'N/A'; // Or any other placeholder for missing date
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const boardUniversity = row.original;

      return (
        <div className="flex justify-end gap-2">
          {/* Edit Button Placeholder */}
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          {/* Delete AlertDialog */}
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
                  This action cannot be undone. This will permanently delete the board university:
                  <span className="font-medium"> {boardUniversity.name}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (boardUniversity.id !== undefined) {
                      await deleteBoardUniversity(boardUniversity.id);
                    } else {
                      console.error("Error deleting board university: Missing ID.");
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