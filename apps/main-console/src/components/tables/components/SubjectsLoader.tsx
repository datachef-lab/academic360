import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

interface SubjectsLoaderProps {
  rowCount: number;
  columnCount: number;
}

const SubjectsLoader: React.FC<SubjectsLoaderProps> = ({ rowCount, columnCount }) => {
  return (
    <>
      {Array(rowCount)
        .fill(null)
        .map((_, rowIndex) => (
          <TableRow key={`loading-row-${rowIndex}`}>
            {Array(columnCount)
              .fill(null)
              .map((_, colIndex) => (
                <TableCell key={`loading-cell-${rowIndex}-${colIndex}`}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  );
};

export default SubjectsLoader; 