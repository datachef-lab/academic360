import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Import Subject type from service
// import { SubjectMe } from '@/services/subject-metadata';
import {SubjectMetadata} from "@/types/academics/subject-metadata";

// Remove unused interfaces
interface SubjectsTableProps {
  subjects: SubjectMetadata[];
  onDelete?: (subjectId: number) => void;
  onEdit?: (subject: SubjectMetadata) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

const columnHelper = createColumnHelper<SubjectMetadata>();

const SubjectsTable: React.FC<SubjectsTableProps> = ({ 
  subjects, 
  onDelete, 
  onEdit, 
  canDelete = false,
  canEdit = false
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Subject Name',
        cell: info => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('irpCode', {
        header: 'Code',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor(row => row.subjectType?.name, {
        id: 'subjectType',
        header: 'Subject Type',
        cell: info => (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            {info.getValue() || 'N/A'}
          </Badge>
        ),
      }),
      columnHelper.accessor('credit', {
        header: 'Credit',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor(row => row?.degree?.name, {
        id: 'degree',
        header: 'Degree',
        cell: info => info.getValue() || 'N/A',
      }),
      columnHelper.accessor(row => row?.programmeType, {
        id: 'programme',
        header: 'Programme',
        cell: info => (
          <Badge variant="secondary">
            {info.getValue() || 'N/A'}
          </Badge>
        ),
      }),
      columnHelper.accessor('fullMarks', {
        header: 'Full Marks',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('isOptional', {
        header: 'Optional',
        cell: info => (
          <Badge variant={info.getValue() ? "default" : "destructive"}>
            {info.getValue() ? "Yes" : "No"}
          </Badge>
        ),
      }),
      ...(canEdit || canDelete ? [
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <div className="flex justify-end space-x-2">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEdit && onEdit(row.original)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete && onDelete(row.original.id!)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        })
      ] : []),
    ],
    [onDelete, onEdit, canDelete, canEdit]
  );

  const table = useReactTable({
    data: subjects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <Table className="min-w-full border">
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="sticky top-0 z-10 bg-white border-b p-4">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="border-b p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <p className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubjectsTable; 