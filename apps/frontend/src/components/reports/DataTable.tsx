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
// import { motion } from "framer-motion";
// import { ArrowUpDown, FileText, ChevronUp, ChevronDown } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface DataTableProps<TData, TValue> {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
//   pageCount: number;
//   onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
//   pagination: { pageIndex: number; pageSize: number };
//   isLoading?: boolean;
// }

// export function DataTable<TData, TValue>({
//   isLoading = false,
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

//   const skeletonRows = useMemo(() => Array(pagination.pageSize).fill(null), [pagination.pageSize]);

//   return (
//     <div className="space-y-4">
//       <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
//         <Table>
//           <TableHeader className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50">
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id} className="hover:bg-slate-100/50">
//                 {headerGroup.headers.map((header) => (
//                   <TableHead
//                     key={header.id}
//                     className="text-center border-r border-slate-200 text-slate-800 font-semibold py-4"
//                   >
//                     <div className="flex items-center justify-center gap-2">
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                       {header.column.getCanSort() && (
//                         <motion.button
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.95 }}
//                           onClick={header.column.getToggleSortingHandler()}
//                           className="text-slate-600 hover:text-slate-800"
//                         >
//                           {header.column.getIsSorted() === "asc" ? (
//                             <ChevronUp className="h-4 w-4" />
//                           ) : header.column.getIsSorted() === "desc" ? (
//                             <ChevronDown className="h-4 w-4" />
//                           ) : (
//                             <ArrowUpDown className="h-4 w-4" />
//                           )}
//                         </motion.button>
//                       )}
//                     </div>
//                   </TableHead>
//                 ))}
//               </TableRow>
//             ))}
//           </TableHeader>

//           <TableBody>
//             {isLoading ? (
//               skeletonRows.map((_, index) => (
//                 <TableRow key={`skeleton-${index}`} className="hover:bg-slate-50/50">
//                   {columns.map((_, colIndex) => (
//                     <TableCell
//                       key={`skeleton-cell-${index}-${colIndex}`}
//                       className="text-center border-r border-slate-200 py-4"
//                     >
//                       <motion.div
//                         initial={{ opacity: 0.5 }}
//                         animate={{ opacity: 0.8 }}
//                         transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
//                       >
//                         <Skeleton className="h-6 w-full mx-auto rounded bg-gradient-to-r from-slate-100 to-slate-200" />
//                       </motion.div>
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row, index) => (
//                 <motion.tr
//                   key={row.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.2, delay: index * 0.02 }}
//                   className={cn(
//                     " hover:bg-slate-50/50 border-b border-slate-100",
//                     index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
//                   )}
//                 >
//                   {row.getVisibleCells().map((cell) => {
//                     const value = cell.getValue();
//                     const isStatus = typeof value === "string" && ["PASS", "FAIL", "Pending"].includes(value);


//                     return (
//                       <TableCell
//                         key={cell.id}
//                         className={cn(
//                           "text-center border-r border-slate-200 border text-slate-600 ",
//                           isStatus && "font-medium",
//                           isStatus && value === "PASS" && "text-emerald-600",
//                           isStatus && value === "FAIL (Overall <30%)" && "text-rose-600",
//                           isStatus && value === "Pending" && "text-amber-600",

//                         )}
//                       >
//                         {isStatus ? (
//                           <span
//                             className={cn(
//                               "px-3 py-1 rounded-full text-sm inline-block",
//                               value === "PASS" && "bg-emerald-50",
//                               value === "FAIL (Overall <30%)" && "bg-rose-50",
//                               value === "Pending" && "bg-amber-50"
//                             )}
//                           >
//                             {value}
//                           </span>
//                         ) : (
//                           flexRender(cell.column.columnDef.cell, cell.getContext())
//                         )}
//                       </TableCell>
//                     );
//                   })}
//                 </motion.tr>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="h-24 text-center text-slate-600">
//                   <div className="flex flex-col items-center justify-center gap-2">
//                     <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
//                       <FileText className="h-8 w-8 text-slate-400" />
//                     </motion.div>
//                     <p className="text-lg font-medium">No results found</p>
//                     <p className="text-sm text-slate-500">Try adjusting your filters</p>
//                   </div>
//                 </TableCell>
//               </TableRow>
//             )}
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
    <div className=" p-4 space-y-4">


      <div className="rounded-md border shadow-md  border-gray-400 ">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-center whitespace-nowrap border-r border-b" // Added whitespace-nowrap
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
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell
                      key={`skeleton-cell-${index}-${colIndex}`}
                      className="px-4 py-3 text-center whitespace-nowrap border-r"
                    >
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 text-center whitespace-nowrap border-r" // Added whitespace-nowrap
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4 py-3 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}