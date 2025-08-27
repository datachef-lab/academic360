"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, CheckCircle, Ban } from "lucide-react";
import { SportsCategoryDialog } from "./sports-category-dialog";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";

export interface SportsCategory {
  id?: number;
  name: string;
  disabled?: boolean;
  createdAt?: string;
}

export const columns: ColumnDef<SportsCategory>[] = [
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
    accessorKey: "disabled",
    header: "Status",
    cell: ({ row }) => (
      row.original.disabled ? (
        <span className="text-red-600 font-semibold">Disabled</span>
      ) : (
        <span className="text-green-600 font-semibold">Active</span>
      )
    ),
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const sportsCategory = row.original;
      const [loading, setLoading] = useState(false);
      const { toast } = useToast();

      const handleToggle = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/sports-categories?id=${sportsCategory.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disabled: !sportsCategory.disabled }),
          });
          if (response.ok) {
            toast({
              title: 'Status Updated',
              description: `Category is now ${!sportsCategory.disabled ? 'disabled' : 'active'}.`,
            });
            window.location.reload();
          } else {
            toast({
              title: 'Error',
              description: 'Failed to update status.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'An unexpected error occurred.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="flex justify-end gap-2">
          <SportsCategoryDialog onSuccess={() => window.location.reload()} sportsCategory={sportsCategory}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </SportsCategoryDialog>
          <Button variant="ghost" size="icon" onClick={handleToggle} disabled={loading}>
            {sportsCategory.disabled ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-red-600" />}
          </Button>
        </div>
      );
    },
  },
]; 