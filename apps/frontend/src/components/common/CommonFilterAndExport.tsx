import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";

import { Calendar, BookOpen, Filter, ChevronDown, GraduationCap, Download } from "lucide-react";

// import { Stream } from "@/types/academics/stream";
import { useQuery } from "@tanstack/react-query";
import { getAllStreams } from "@/services/stream";
import { MarksheetTableType } from "@/types/tableTypes/MarksheetTableType";

import { motion } from "framer-motion";

import { useMarksheetStore } from "@/components/globals/useMarksheetStore";

import { getAllMarksheet } from "@/services/student-apis";
import { toast } from "sonner";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
// type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {
  const { setFilters, filters, uiFilters, setUiFilters } = useMarksheetStore();

  const [isExporting, setIsExporting] = useState(false);

  const { data } = useQuery({
    queryKey: ["streams"],
    queryFn: getAllStreams,
  });

  const { refetch: fetchExportData, isFetching: isFetchingExport } = useQuery({
    queryKey: ["export",filters],
    queryFn: () =>
      getAllMarksheet({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,

        semester: filters.semester ?? undefined,
        export: isExporting ? true : false,
      }),
    enabled: false, // Do not auto-fetch
  });

  const streamMemo = useMemo(() => {
    if (!data) return [];
    const streamMap = new Map();
    data.forEach((item: Stream) => {
      if (item.degree) {
        streamMap.set(item.degree.id, { id: item.degree.id, name: item.degree.name });
      }
    });
    return [...streamMap.values()];
  }, [data]);

  const handleApplyFilters = () => {
    setFilters({
      stream: uiFilters.selectedStream?.name || null,
      year: uiFilters.selectedYear,
      framework: uiFilters.selectedFramework,
      semester: uiFilters.selectedSemester,
      export: isExporting ? true : false,
    });
  };

  const handleStreamSelect = (option: { name: string }) => {
    setUiFilters({ selectedStream: option });
  };

  const handleYearSelect = (year: Year) => {
    setUiFilters({ selectedYear: year });
  };

  // const handleFrameworkSelect = (framework: Framework) => {
  //   setUiFilters({ selectedFramework: framework });
  // };

  const handleSemesterSelect = (semester: number) => {
    setUiFilters({ selectedSemester: semester });
  };

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { data: exportData } = await fetchExportData();

      if (!data || data.length === 0) {
        toast.error("No data available for export.");
        return;
      }
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData.data);

      // Set dynamic column widths with padding and a minimum width
      if (exportData.data.length > 0) {
        const headers = Object.keys(exportData.data[0]);

        worksheet["!cols"] = headers.map((key) => {
          const maxLength = Math.max(
            key.length,
            ...exportData.data.map(
              (row: MarksheetTableType) => String(row[key as keyof MarksheetTableType] ?? "").length,
            ),
          );

          return {
            wch: Math.max(15, maxLength + 2),
          };
        });
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Marksheet");

      XLSX.writeFile(workbook, `Marksheet_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex p-4 sm:p-6 flex-col border rounded-3xl shadow-lg bg-gradient-to-br from-white to-slate-100 gap-6 sm:gap-8">
      {/* Header with title and export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg shadow-md">
            <Filter className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-sans font-semibold text-gray-800">Filter Options</h2>
        </div>

        {/* Export Buttons */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Button
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-2 transition-all"
            onClick={handleExportExcel}
            disabled={isExporting || isFetchingExport}
          >
            <Download className="h-4 w-4" />
            {isExporting || isFetchingExport ? "Exporting..." : "Export"}
          </Button>
        </motion.div>
      </div>

      {/* Filter Body */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between">
        <motion.div className="flex flex-wrap gap-3 w-full">
          {/* Stream Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                {uiFilters.selectedStream ? uiFilters.selectedStream.name : "Stream"}
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto shadow-lg rounded-xl border border-slate-200 bg-white">
              {streamMemo.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => handleStreamSelect(option as Stream)}
                  className="hover:bg-slate-100"
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Year Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                {uiFilters.selectedYear || "Year"}
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="shadow-lg rounded-xl border border-slate-200 bg-white">
              {["2021", "2022", "2023", "2024", "2025"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleYearSelect(option as Year)}
                  className="hover:bg-slate-100"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Framework Dropdown
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
            <Code2 className="w-4 h-4 text-purple-600" />
            {uiFilters.selectedFramework || "Framework"}
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="shadow-lg rounded-xl border border-slate-200 bg-white">
          {["CCF", "CBCS"].map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleFrameworkSelect(option as Framework)}
              className="hover:bg-slate-100"
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu> */}

          {/* Semester Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                {uiFilters.selectedSemester ? `Sem ${uiFilters.selectedSemester}` : "Semester"}
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="shadow-lg rounded-xl border border-slate-200 bg-white">
              {semesterOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleSemesterSelect(option)}
                  className="hover:bg-slate-100"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* Apply Filters Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleApplyFilters}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md flex items-center gap-2 px-5 py-2 mt-4 lg:mt-0"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default FilterAndExportComponent;
