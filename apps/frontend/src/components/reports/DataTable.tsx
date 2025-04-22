// import { useMemo, useState } from "react";
// import {
//   ColumnDef,
//   flexRender,
//   getCoreRowModel,
//   SortingState,
//   getSortedRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   useReactTable,
//   ColumnFiltersState,
// } from "@tanstack/react-table";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { DataTablePagination } from "./Pagination";
// import { Skeleton } from "../ui/skeleton";

// interface DataTableProps<TData, TValue> {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
//   pageCount: number;
//   onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
//   pagination: { pageIndex: number; pageSize: number };
//   isLoading?: boolean;
// }

// export function DataTable<TData, TValue>({
//   isLoading=false,
//   columns,
//   data,
//   pageCount,
//   pagination,
//   onPaginationChange,
// }: DataTableProps<TData, TValue>) {
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

//   const table = useReactTable({
//     data,
//     columns,
//     pageCount,
//     manualPagination: true,
//     onPaginationChange: (updater) => {
//       const newPagination = typeof updater === "function" ? updater(pagination) : updater;
//       onPaginationChange(newPagination);
//     },
    

//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     state: {
//       sorting,
//       columnFilters,
//       pagination,
//     },
//   });
//   const skeletonRows = useMemo(
//     () => Array(pagination.pageSize).fill(null),
//     [pagination.pageSize]
//   );

//   return (
//     <div className=" p-4 space-y-4">
      

//       <div className="rounded-md border shadow-md  border-gray-400 ">
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id} className="rounded-t-md">
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead
//                       key={header.id}
//                       className={`text-center border-r border-b text-black   dark:text-white`}
//                     >
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                     </TableHead>
//                   );
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//           {isLoading ? (
             
//               skeletonRows.map((_, index) => (
//                 <TableRow key={`skeleton-${index}`}>
//                   {columns.map((_, colIndex) => (
//                     <TableCell key={`skeleton-cell-${index}-${colIndex}`} className="text-center border-r">
//                       <Skeleton className="h-7 w-full mx-auto" />
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) :
//             table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id} className="text-center border-r">
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//               ) : (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="h-24 text-center ">
//                   No results.
//                 </TableCell>
//               </TableRow>
//             )
//           }
//           </TableBody>
//         </Table>
//       </div>

//       <div className="flex items-center justify-end space-x-2 py-4">
//         <DataTablePagination table={table} />
//       </div>
//     </div>
//   );
// }
import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./Pagination";
import { Skeleton } from "../ui/skeleton";
import { motion } from "framer-motion";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  pagination: { pageIndex: number; pageSize: number };
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  isLoading = false,
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const skeletonRows = useMemo(
    () => Array(pagination.pageSize).fill(null),
    [pagination.pageSize]
  );

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border  border-gray-300 shadow-md overflow-hidden">
        <Table className=" ">
          <TableHeader className="bg-indigo-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-indigo-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-center border-r border-indigo-100 text-indigo-800 font-semibold py-3"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              skeletonRows.map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-indigo-50">
                  {columns.map((_, colIndex) => (
                    <TableCell
                      key={`skeleton-cell-${index}-${colIndex}`}
                      className="text-center border-r border-indigo-100 py-3"
                    >
                      <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                      >
                        <Skeleton className="h-6 w-full mx-auto rounded" />
                      </motion.div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-indigo-50 border-b border-indigo-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center border-r border-indigo-100 py-3 text-indigo-900"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-indigo-700 py-8"
                >
                  No results found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center pt-4 justify-end "
      >
        <DataTablePagination table={table} />
      </motion.div>
    </div>
  );
}