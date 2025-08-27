"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BloodGroup } from "@/db/schema";
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
import { deleteBloodGroup } from './actions';

export const columns: ColumnDef<BloodGroup>[] = [
  {
    accessorKey: "id",
    header: "Sr. No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "type",
    header: "Blood Group",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bloodGroup = row.original;

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
                  This action cannot be undone. This will permanently delete the blood group:
                  <span className="font-medium"> {bloodGroup.type}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (bloodGroup.id !== undefined) {
                      await deleteBloodGroup(bloodGroup.id);
                    } else {
                      console.error("Error deleting blood group: Missing ID.");
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