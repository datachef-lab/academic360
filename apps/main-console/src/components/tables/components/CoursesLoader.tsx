import React from 'react';

interface CoursesLoaderProps {
  rowCount: number;
  columnCount: number;
}

const CoursesLoader: React.FC<CoursesLoaderProps> = ({ rowCount, columnCount }) => {
  return (
    <>
      {Array(rowCount)
        .fill(null)
        .map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className="border-b border-purple-200 transition-colors hover:bg-purple-50/50"
          >
            {Array(columnCount)
              .fill(null)
              .map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="p-4 align-middle"
                >
                  <div className={`h-4 ${colIndex === 0 ? "w-40" : "w-24"} bg-purple-200 rounded animate-pulse`}></div>
                </td>
              ))}
          </tr>
        ))}
    </>
  );
};

export default CoursesLoader; 