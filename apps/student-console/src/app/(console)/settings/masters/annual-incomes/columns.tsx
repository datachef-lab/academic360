"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AnnualIncome } from "@/db/schema"; // Make sure this import is correct based on your schema
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
import { deleteAnnualIncome } from './actions';

export const columns: ColumnDef<AnnualIncome>[] = [
  {
    accessorKey: "id",
    header: "Sr. No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "range",
    header: "Income Range",
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
      const annualIncome = row.original;

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
                  This action cannot be undone. This will permanently delete the annual income range:
                  <span className="font-medium"> {annualIncome.range}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (annualIncome.id !== undefined) {
                      await deleteAnnualIncome(annualIncome.id);
                    } else {
                      console.error("Error deleting annual income range: Missing ID.");
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