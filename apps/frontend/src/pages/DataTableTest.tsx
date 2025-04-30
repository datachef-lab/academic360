
// import { 
//   Table as ShadcnTable,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow 
// } from "@/components/ui/table";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";

// interface User {
//   id: number;
//   name: string;
//   position: 'Teacher' | 'Student';
//   email: string;
//   contact: string;
//   avatarColor: string;
// }

// const Table = () => {
//   const users: User[] = [
//     {
//       id: 1,
//       name: "Rithu Bhawanaj",
//       position: "Teacher",
//       email: "manager@edu.in",
//       contact: "Theory of Computation",
//       avatarColor: "#FFB74D"
//     },
//     {
//       id: 2,
//       name: "K Krishna shankar",
//       position: "Teacher",
//       email: "krish@ak.edu.in",
//       contact: "Design of Digital Systems",
//       avatarColor: "#4CAF50"
//     },
//     {
//       id: 3,
//       name: "Aparna Rajendran",
//       position: "Student",
//       email: "ritcha.23cs@students.edu.in",
//       contact: "23CS103",
//       avatarColor: "#00BCD4"
//     },
//     {
//       id: 4,
//       name: "Prabha SH",
//       position: "Student",
//       email: "prabha.23cs@students.edu.in",
//       contact: "23CS102",
//       avatarColor: "#E040FB"
//     },
//     {
//       id: 5,
//       name: "Vinod Noyal",
//       position: "Student",
//       email: "vinod@example.23cs@students.edu.in",
//       contact: "23CS112",
//       avatarColor: "#FFD700"
//     },
//     {
//       id: 6,
//       name: "Shashwath Raja",
//       position: "Student",
//       email: "shashwath.raja.23cs@students.edu.in",
//       contact: "23CS119",
//       avatarColor: "#7B68EE"
//     },
//     {
//       id: 7,
//       name: "Aarav",
//       position: "Student",
//       email: "aarav.23cs@students.edu.in",
//       contact: "Mtech(Networked[1])",
//       avatarColor: "#FF4444"
//     }
//   ];

//   return (
//     <div className="w-full mx-auto px-4 py-8">
//       <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
//         <div className="overflow-x-auto">
//           <ShadcnTable className="border-separate border-spacing-y-3">
//             <TableHeader className="bg-gray-50">
//               <TableRow className="border hover:bg-gray-100 rounded-full ">
//                 <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">S.No</TableHead>
//                 <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
//                 <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Position</TableHead>
//                 <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableHead>
//                 <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Mail Contact/Phone</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody className="space-y-4">
//               {users.map((user) => (
//                 <TableRow 
//                   key={user.id} 
//                   className=" my-24 shadow-md bg-gray-50   rounded-full hover:bg-gray-50 transition-all duration-300 ease-in-out"
//                 >
//                   <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
//                     <div className="text-sm text-gray-900">{user.id}</div>
//                   </TableCell>
//                   <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
//                     <div className="flex items-center">
//                       <Avatar className="h-8 w-8">
//                         <AvatarFallback style={{ backgroundColor: user.avatarColor }}>
//                           {user.name.charAt(0)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="ml-4">
//                         <div className="text-sm font-medium text-gray-900">{user.name}</div>
//                       </div>
//                     </div>
//                   </TableCell>
//                   <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
//                     <Badge 
//                       variant={user.position === 'Teacher' ? 'default' : 'secondary'}
//                       className={`${
//                         user.position === 'Teacher' 
//                           ? 'bg-green-100 text-green-800 hover:bg-green-100' 
//                           : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
//                       } rounded-full px-3 py-1 text-xs`}
//                     >
//                       {user.position}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full text-sm text-gray-500">
//                     {user.email}
//                   </TableCell>
//                   <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full text-sm text-gray-500">
//                     {user.contact}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </ShadcnTable>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Table;

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { CustomPaginationState } from "@/components/settings/SettingsContent";
import { DataTablePagination } from "@/components/globals/DataTablePagination";
import { DataTableToolbar } from "@/components/tables/components/DataTableToolBar";

export interface User {
  id: number;
  name: string;
  position: string;
  email: string;
  contact: string;
  avatarColor: string;
}

export interface DataTableProps<TData, TValue> extends Omit<PaginationState, "pageIndex" | "pageSize"> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: CustomPaginationState;
  isLoading: boolean;
  setPagination: React.Dispatch<React.SetStateAction<CustomPaginationState>>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  setDataLength: React.Dispatch<React.SetStateAction<number>>;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData[] | undefined, Error>>;
}


export function UserDataTable<TData, TValue>({
  columns,
  data,
  pagination,
  isLoading,
  setPagination,
  searchText,
  setSearchText,

 
  refetch,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: pagination.totalElements,
    pageCount: pagination.totalPages,
    onPaginationChange: (updaterOrValue) => {
      setPagination((prev) => {
        const newState = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        return {
          ...prev,
          pageIndex: newState.pageIndex,
          pageSize: newState.pageSize,
        };
      });
    },
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize },
    },
  });

  return (
    <div className="space-y-3 p-4  rounded-2xl my-3">
    <div className="px-6 py-1   rounded-lg ">
    <DataTableToolbar  table={table} searchText={searchText} setSearchText={setSearchText} refetch={refetch} />
    </div>
      <div className="  overflow-hidden">
        <Table className="border-separate border-spacing-y-3 w-full">
          <TableHeader >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-white  ">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="py-3 px-5  text-center font-semibold text-base"
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
              Array(pagination.pageSize).fill(null).map((_, index) => (
                <TableRow key={index} className="bg-gray-50 rounded-lg">
                  {columns.map((_, colIndex) => (
                    <TableCell 
                      key={colIndex} 
                      className="py-3 px-5 first:rounded-l-lg last:rounded-r-lg"
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
                   className="  my-24 shadow-md bg-gray-100 hover:scale-95 rounded-full hover:bg-gray-50 transition-all duration-300 ease-in-out"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="py-4 px-5  first:rounded-l-full last:rounded-r-full"
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
      <div className="my-3">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}