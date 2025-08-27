'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteCategoryDialog } from './category-dialog';
import { AddCategoryDialog } from './category-dialog';

export type Category = {
  id: string;
  name: string;
  createdAt: Date;
};

export const columns: ColumnDef<Category>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Category Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <div className="text-left">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-2">
          <AddCategoryDialog 
            initialData={{ id: parseInt(category.id)  as number, name: category.name, code: "" }}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <DeleteCategoryDialog categoryId={category.id} />
        </div>
      );
    },
  },
]; 