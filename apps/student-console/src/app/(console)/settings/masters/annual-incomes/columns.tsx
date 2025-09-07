"use client";

// import { ColumnDef } from "@tanstack/react-table";
import { AnnualIncome } from "@/db/schema";

// Define ColumnDef type locally to work around import issues
type ColumnDef<T> = {
  accessorKey?: keyof T;
  id?: string;
  header?: string;
  cell?: (props: { row: { index: number; original: T } }) => React.ReactNode;
};
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
import { deleteAnnualIncome } from "./actions";

// Define row type for table cells
type TableRow = {
  index: number;
  original: AnnualIncome;
};

// Work around strict shadcn typings with proper type extensions
const AlertDialogTriggerFixed = AlertDialogTrigger as React.ComponentType<
  React.ComponentProps<typeof AlertDialogTrigger> & { children?: React.ReactNode; asChild?: boolean }
>;
const AlertDialogTitleFixed = AlertDialogTitle as React.ComponentType<
  React.ComponentProps<typeof AlertDialogTitle> & { children?: React.ReactNode }
>;
const AlertDialogDescriptionFixed = AlertDialogDescription as React.ComponentType<
  React.ComponentProps<typeof AlertDialogDescription> & { children?: React.ReactNode }
>;
const AlertDialogCancelFixed = AlertDialogCancel as React.ComponentType<
  React.ComponentProps<typeof AlertDialogCancel> & { children?: React.ReactNode }
>;
const AlertDialogActionFixed = AlertDialogAction as React.ComponentType<
  React.ComponentProps<typeof AlertDialogAction> & { children?: React.ReactNode; onClick?: () => void }
>;

export const columns: ColumnDef<AnnualIncome>[] = [
  {
    accessorKey: "id",
    header: "Sr. No",
    cell: ({ row }: { row: TableRow }) => row.index + 1,
  },
  {
    accessorKey: "range",
    header: "Income Range",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: { row: TableRow }) => {
      if (row.original.createdAt) {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString(); // Or format as needed
      } else {
        return "N/A"; // Or any other placeholder for missing date
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: TableRow }) => {
      const annualIncome = row.original;

      return (
        <div className="flex justify-end gap-2">
          {/* Edit Button Placeholder */}
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          {/* Delete AlertDialog */}
          <AlertDialog>
            <AlertDialogTriggerFixed asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTriggerFixed>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitleFixed>Are you absolutely sure?</AlertDialogTitleFixed>
                <AlertDialogDescriptionFixed>
                  This action cannot be undone. This will permanently delete the annual income range:
                  <span className="font-medium"> {annualIncome.range}</span>.
                </AlertDialogDescriptionFixed>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancelFixed>Cancel</AlertDialogCancelFixed>
                <AlertDialogActionFixed
                  onClick={async () => {
                    if (annualIncome.id !== undefined) {
                      await deleteAnnualIncome(annualIncome.id);
                    } else {
                      console.error("Error deleting annual income range: Missing ID.");
                    }
                  }}
                >
                  Continue
                </AlertDialogActionFixed>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
];
