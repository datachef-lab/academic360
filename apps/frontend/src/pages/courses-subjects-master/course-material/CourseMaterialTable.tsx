import React, { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { CourseMaterialRow } from "./types";
import { getCourseMaterialColumns } from "./columns";

interface CourseMaterialTableProps {
  data: CourseMaterialRow[];
  isLoading?: boolean;
}

const CourseMaterialTable: React.FC<CourseMaterialTableProps> = ({
  data,
  isLoading = false,
}) => {
  const table = useReactTable({
    data,
    columns: getCourseMaterialColumns(),
    getCoreRowModel: getCoreRowModel(),
  });

  const skeletonRowCount = 5; // fallback if no pagination
  const columns = table.getAllColumns();
  const skeletonRows = useMemo(
    () => Array(skeletonRowCount).fill(null),
    []
  );
  return (
    <div className="rounded-xl  drop-shadow-md overflow-x-hidden ">
      <Table className="border-separate  border-spacing-y-4 w-full">
        <TableHeader >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-50 whitespace-nowrap hover:bg-gray-50  ">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="py-6 px-4 first:pl-9 text-center   font-semibold text-base"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            skeletonRows.map((_, index: number) => (
              <TableRow key={index} className="bg-gray-50 rounded-lg">
                {columns.map((_, colIndex: number) => (
                  <TableCell
                    key={colIndex}
                    className="px-4 py-3  first:rounded-l-lg last:rounded-r-lg"
                  >
                    <Skeleton className="h-4 w-full rounded-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="  my-24 drop-shadow-sm  bg-gray-100 whitespace-nowrap  rounded-full hover:bg-gray-100 "
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3 first:pl-10  text-center first:rounded-l-lg last:rounded-r-lg"
                  >
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
  );
};

export default CourseMaterialTable; 