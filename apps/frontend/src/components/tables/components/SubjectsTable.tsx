import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

// Interfaces for subject data
interface SubjectType {
  id: number;
  irpName: string;
  marksheetName: string;
  marksheetShortName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stream {
  id: number;
  framework: string;
  degreeProgramme: string;
  duration: number | null;
  numberOfSemesters: number | null;
  createdAt: string;
  updatedAt: string;
  degree: {
    id: number;
    name: string;
    level: string;
    sequence: number | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Subject {
  id: number;
  semester: number;
  category: string | null;
  irpName: string;
  name: string;
  irpCode: string;
  marksheetCode: string;
  isOptional: boolean;
  credit: number;
  fullMarksTheory: number | null;
  fullMarksTutorial: number | null;
  fullMarksInternal: number | null;
  fullMarksPractical: number | null;
  fullMarksProject: number | null;
  fullMarksViva: number | null;
  fullMarks: number;
  createdAt: string;
  updatedAt: string;
  specialization: string | null;
  stream: Stream;
  subjectType: SubjectType;
}

interface SubjectsTableProps {
  subjects: Subject[];
}

const columnHelper = createColumnHelper<Subject>();

const SubjectsTable: React.FC<SubjectsTableProps> = ({ subjects }) => {
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
      columnHelper.accessor('subjectType.marksheetName', {
        header: 'Subject Type',
        cell: info => (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('credit', {
        header: 'Credit',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('stream.degree.name', {
        header: 'Degree',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('stream.degreeProgramme', {
        header: 'Programme',
        cell: info => (
          <Badge variant="secondary">
            {info.getValue()}
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
    ],
    []
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
                  No results found.
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

export default SubjectsTable; 