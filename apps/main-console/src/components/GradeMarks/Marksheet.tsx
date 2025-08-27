import  { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { findMarksheetsByStudentId } from '@/services/marksheet-apis';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pencil, Eye } from 'lucide-react';
import { useMarksheetSkeleton } from './useMarksheetSkeleton';

type MarksheetRow = {
  id?: number;
  year: number;
  semester: number;
  [key: string]: unknown;
};

const Marksheet = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { MarksheetSkeleton } = useMarksheetSkeleton();

  const pathParts = location.pathname.split('/');
  const studentIdx = pathParts.findIndex((p) => p === 'search-students');
  const studentId = studentIdx !== -1 ? pathParts[studentIdx + 1] : undefined;

  const marksheetsQuery = useQuery({
    queryKey: ['marksheets', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await findMarksheetsByStudentId(Number(studentId));
      if (Array.isArray(res.payload)) {
        return res.payload;
      }
      return res.payload ? [res.payload] : [];
    },
    enabled: !!studentId,
  });

  // Collect marksheets and determine unique years/semesters
  const marksheets: MarksheetRow[] = useMemo(() =>
    (marksheetsQuery.data || [])
      .filter((m) => m && typeof m === 'object' && m.year && m.semester)
      .map((m) => ({
        id: m.id,
        year: m.year,
        semester: m.semester,
        ...m,
      })),
    [marksheetsQuery.data]
  );

  // Dynamically extract unique years and semesters from the data
  const years = useMemo(() => {
    const set = new Set<number>();
    marksheets.forEach((m) => set.add(m.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [marksheets]);
  const semesters = useMemo(() => {
    const set = new Set<number>();
    marksheets.forEach((m) => set.add(m.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [marksheets]);

  const marksheetMap = useMemo(() => {
    const map: Record<string, MarksheetRow> = {};
    marksheets.forEach((m) => {
      map[`${m.year}-${m.semester}`] = m;
    });
    return map;
  }, [marksheets]);

  const isLoading = marksheetsQuery.isLoading;
  const isError = marksheetsQuery.isError;
  if (isLoading) {
    return <MarksheetSkeleton 
      yearCount={years.length || 3} 
      semesterCount={semesters.length || 3} 
    />;
  }
  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load marksheets.</div>;
  }
  if (marksheets.length === 0) {
    return <div className="p-8 text-center text-gray-500">No marksheets found for this student.</div>;
  }

  const handleEdit = (marksheet: MarksheetRow) => {
    if(marksheet.id){
       navigate(`/home/search-students/${studentId}/${marksheet.id}?semester=${marksheet.semester}`);
    }
  };

  const handleView = (marksheet: MarksheetRow) => {
    if (marksheet.id) {
       navigate(`/home/search-students/${studentId}/${marksheet.id}`);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 bg-white border rounded-xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8 text-gray-800 border-b-2 pb-2 sm:pb-3 border-gray-300">
        Marksheet Overview
      </h2>
      <div className="px-2 sm:px-4 md:px-8 py-2 sm:py-4">
        <div className="overflow-x-auto w-full bg-white rounded-xl border border-gray-300 drop-shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border-r text-center font-semibold text-gray-700 py-3 sm:py-5 min-w-[100px]">
                  Year/Semester
                </TableHead>
                {semesters.map((sem, index) => (
                  <TableHead 
                    key={String(sem)} 
                    className={`border-b text-center font-semibold text-gray-700 py-3 sm:py-5 min-w-[120px] ${
                      index === semesters.length - 1 ? '' : 'border-r'
                    }`}
                  >
                   Sem {sem}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year, rowIdx) => (
                <TableRow 
                  key={String(year)} 
                  className={`${
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <TableCell className="border-r text-center font-medium text-gray-700 py-3 sm:py-5">
                    {year}
                  </TableCell>
                  {semesters.map((sem, index) => {
                    const m = marksheetMap[`${year}-${sem}`];
                    return (
                      <TableCell 
                        key={String(sem)} 
                        className={`text-center bg-white py-3 sm:py-5 ${
                          index === semesters.length - 1 ? '' : 'border-r'
                        }`}
                      >
                        {m ? (
                          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center px-1 sm:px-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-xs sm:text-sm border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap font-medium"
                              onClick={() => handleEdit(m)}
                            >
                              <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-xs sm:text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap font-medium"
                              onClick={() => handleView(m)}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                              View
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs sm:text-sm">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Marksheet;