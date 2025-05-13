import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";

import { Calendar, BookOpen, Filter, Download, ChevronDown, GraduationCap } from "lucide-react";

import { Stream } from "@/types/academics/stream";
import { useQuery } from "@tanstack/react-query";
import { getAllStreams } from "@/services/stream";

import { motion } from "framer-motion";

import { useMarksheetStore } from "@/stores/useTableStore";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
// type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {
  const { setFilters, filteredData, uiFilters, setUiFilters } = useMarksheetStore();

  const { data } = useQuery({
    queryKey: ["streams"],
    queryFn: getAllStreams,
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

  // const handleExportPDF = () => {
  //   const doc = new jsPDF();
  //   doc.text("Exported Report", 10, 10);

  //   if (filteredData.length > 0) {
  //     const headers = [Object.keys(filteredData[0])];
  //     const rows = filteredData.map((row) => Object.values(row));
  //     autoTable(doc, {
  //       head: headers,
  //       body: rows as unknown as RowInput[],
  //       startY: 30,
  //       theme: "grid",
  //       styles: { fontSize: 3, cellPadding: 1 },
  //       headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
  //     });
  //   } else {
  //     doc.text("No data available", 10, 40);
  //   }
  //   doc.save("filtered_report.pdf");
  // };
  const handleExportExcel = () => {
    const data = filteredData;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-calculate column widths based on content
    if (data.length > 0) {
      const header = Object.keys(data[0]);
      const widths = header.map((key) => ({
        wch: Math.max(
          key.length, // Header width
          ...data.map((row) => String(row[key as keyof typeof row]).length), // Content width
        ),
      }));
      worksheet["!cols"] = widths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Marksheet");
    XLSX.writeFile(workbook, `Marksheet_${new Date().toISOString().split("T")[0]}.xlsx`);
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
          >
            <Download className="h-4 w-4" />
            Export
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
