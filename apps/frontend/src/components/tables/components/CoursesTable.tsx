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

// Import Course type from service
// import { Course } from '@/services/course-api';
import { Course } from '@/types/academics/course';

interface CoursesTableProps {
  courses: Course[];
  onDelete?: (courseId: number) => void;
  onEdit?: (course: Course) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

const columnHelper = createColumnHelper<Course>();

const CoursesTable: React.FC<CoursesTableProps> = ({ 
  courses, 
  onDelete, 
  onEdit, 
  canDelete = false,
  canEdit = false
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Course Name',
        cell: info => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('shortName', {
        header: 'Short Name',
        cell: info => <span>{info.getValue() || 'N/A'}</span>,
      }),
      columnHelper.accessor('codePrefix', {
        header: 'Code Prefix',
        cell: info => (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {info.getValue() || 'N/A'}
          </Badge>
        ),
      }),
      columnHelper.accessor('universityCode', {
        header: 'University Code',
        cell: info => (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            {info.getValue() || 'N/A'}
          </Badge>
        ),
      }),
      columnHelper.accessor(row => row.stream?.degree?.name, {
        id: 'degree',
        header: 'Degree',
        cell: info => (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {info.getValue() || 'N/A'}
          </Badge>
        ),
      }),
      columnHelper.accessor(row => row.stream?.degreeProgramme, {
        id: 'programme',
        header: 'Programme',
        cell: info => (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
            {info.getValue() || 'N/A'}
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
    data: courses,
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
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

export default CoursesTable; 