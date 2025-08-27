'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteNationalityDialog } from './nationality-dialog';
import { AddNationalityDialog } from './nationality-dialog';

export type Nationality = {
  id: string;
  name: string;
  createdAt: Date;
};

export const columns: ColumnDef<Nationality>[] = [
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
        Nationality Name
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
      const nationality = row.original;
      return (
        <div className="flex items-center gap-2">
          <AddNationalityDialog
            onSuccess={() => {}}
            initialData={{ id: Number(nationality.id), name: nationality.name }}
            // trigger={
            //   <Button variant="ghost" size="icon">
            //     <Pencil className="h-4 w-4" />
            //   </Button>
            // }
          />
          <DeleteNationalityDialog nationalityId={nationality.id} />
        </div>
      );
    },
  },
]; 