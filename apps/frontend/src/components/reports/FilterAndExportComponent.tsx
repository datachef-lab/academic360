import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";

import {

  Calendar,
  Code2,
  BookOpen,
  Filter,
  Download,

  ChevronDown,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "../globals/useReportStore";
import { motion } from "framer-motion";
// import { useLocation } from "react-router-dom";
// import { Student } from "@/types/user/student";
import { getAllReports } from "@/services/student-apis";
import { toast } from "sonner";
import { Report } from "./types";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { setFilters,filters, uiFilters, setUiFilters} = useReportStore();

  


  const { data, isFetching } = useQuery({
    queryKey: ["exportReport"],
    queryFn: () =>
      getAllReports({
        stream: filters.stream ?? undefined,
        year: filters.year ?? undefined,
        framework: filters.framework ?? undefined,
        semester: filters.semester ?? undefined,
        export:true,
     
      }),
    enabled: false, // Do not auto-fetch
  });
  

  const handleApplyFilters = () => {
    setFilters({
      stream: null,
      year: uiFilters.selectedYear,
      framework: uiFilters.selectedFramework,
      semester: uiFilters.selectedSemester,
    });
  };

  const handleYearSelect = (year: Year) => {
    setUiFilters({ selectedYear: year });
  };

  const handleFrameworkSelect = (framework: Framework) => {
    setUiFilters({ selectedFramework: framework });
  };

  const handleSemesterSelect = (semester: number) => {
    setUiFilters({ selectedSemester: semester });
  };

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];


  const handleExportExcel = async () => {
    setIsExporting(true);
    const { data: reportData } = await data();
    const exportingData = reportData.payload.content;
    
    try {
      if (!reportData?.payload?.content || reportData.payload.content.length === 0) {
        toast.error("No data available for export.");
        return;
      }
  
      // Remove subjects from each student record
      const dataWithoutSubjects = exportingData.map((student: Report) => {
        // Explicitly select only the properties we want to keep
        const {
          id,
          rollNumber,
          registrationNumber,
          uid,
          name,
          semester,
          stream,
          framework,
          year,
          sgpa,
          cgpa,
          letterGrade,
          remarks,
          percentage,
          totalFullMarks,
          totalObtainedMarks,
          totalCredit
        } = student;
        
        return {
          id,
          rollNumber,
          registrationNumber,
          uid,
          name,
          semester,
          stream,
          framework,
          year,
          sgpa,
          cgpa,
          letterGrade,
          remarks,
          percentage,
          totalFullMarks,
          totalObtainedMarks,
          totalCredit
        };
      });
   
     
  
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataWithoutSubjects);
  
      // Set dynamic column widths with padding and a minimum width
      if (dataWithoutSubjects.length > 0) {
        const headers = Object.keys(dataWithoutSubjects[0]);
  
        worksheet["!cols"] = headers.map((key) => {
          const maxLength = Math.max(
            key.length,
            ...dataWithoutSubjects.map(
              (row: Report) => String(row[key as keyof typeof row] ?? "").length,
            ),
          );
  
          return {
            wch: Math.max(15, maxLength + 2),
          };
        });
      }
  
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `Report_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export report. Please try again.");
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
      <h2 className="text-xl font-sans font-semibold text-gray-800">
        Filter Options
      </h2>
    </div>

    {/* Export Buttons */}
    <motion.div whileHover={{ scale: 1.05 }}>
             <Button
               className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-2 transition-all"
               onClick={handleExportExcel}
               disabled={isExporting || isFetching}
             >
               <Download className="h-4 w-4" />
               {isExporting || isFetching ? "Exporting..." : "Export"}
             </Button>
           </motion.div>
  </div>

  {/* Filter Body */}
  <div className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between">
    <motion.div className="flex flex-wrap gap-3 w-full">
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

      {/* Framework Dropdown */}
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
      </DropdownMenu>

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