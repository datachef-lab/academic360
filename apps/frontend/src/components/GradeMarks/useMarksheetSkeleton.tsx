
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const TableSkeletonCell = () => (
  <TableCell className="text-center py-5">
    <div className="grid grid-cols-2 gap-3 items-center justify-items-center px-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  </TableCell>
);

const TableSkeletonHeader = ({ semesterCount }: { semesterCount: number }) => (
  <TableRow className="bg-gray-50">
    <TableHead className="border-r text-center font-semibold text-gray-700 py-5">
      <Skeleton className="h-4 w-24 mx-auto" />
    </TableHead>
    {Array.from({ length: semesterCount }, (_, index) => (
      <TableHead 
        key={index}
        className={`border-b text-center font-semibold text-gray-700 py-5 ${
          index === semesterCount - 1 ? '' : 'border-r'
        }`}
      >
        <Skeleton className="h-4 w-8 mx-auto" />
      </TableHead>
    ))}
  </TableRow>
);

const TableSkeletonRow = ({ semesterCount, rowIndex }: { semesterCount: number; rowIndex: number }) => (
  <TableRow className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
    <TableCell className="border-r text-center font-medium text-gray-700 py-5">
      <Skeleton className="h-4 w-16 mx-auto" />
    </TableCell>
    {Array.from({ length: semesterCount }, (_, index) => (
      <TableSkeletonCell key={index} />
    ))}
  </TableRow>
);

export const MarksheetSkeleton = ({ yearCount = 3, semesterCount = 4 }: { yearCount?: number; semesterCount?: number }) => (
  <div className="p-4 md:p-8">
    <Skeleton className="h-8 w-64 mb-8" />
    <div className="px-14 py-4">
      <div className="overflow-x-auto max-w-screen bg-white rounded-xl border border-gray-300 shadow-lg">
        <Table>
          <TableHeader>
            <TableSkeletonHeader semesterCount={semesterCount} />
          </TableHeader>
          <TableBody>
            {Array.from({ length: yearCount }, (_, index) => (
              <TableSkeletonRow 
                key={index} 
                rowIndex={index} 
                semesterCount={semesterCount}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
);

export const useMarksheetSkeleton = () => {
  return {
    MarksheetSkeleton
  };
}; 