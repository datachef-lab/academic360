import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import * as XLSX from "xlsx";
import autoTable, { RowInput } from "jspdf-autotable";
import { jsPDF } from "jspdf";
import {

  Calendar,
  Code2,
  BookOpen,
  Filter,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  GraduationCap,
} from "lucide-react";

import { Stream } from "@/types/academics/stream";
import { useQuery } from "@tanstack/react-query";
import { getAllStreams } from "@/services/stream";
import { useReportStore } from "../globals/useReportStore";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Student } from "@/types/user/student";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {
  const { setFilters, filteredData, uiFilters, setUiFilters,StudentData } = useReportStore();
  const location = useLocation();
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

  const handleFrameworkSelect = (framework: Framework) => {
    setUiFilters({ selectedFramework: framework });
  };

  const handleSemesterSelect = (semester: number) => {
    setUiFilters({ selectedSemester: semester });
  };

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Exported Report", 10, 10);

    if (filteredData.length > 0) {
      const headers = [Object.keys(filteredData[0])];
      const rows = filteredData.map((row) => Object.values(row));
      autoTable(doc, {
        head: headers,
        body: rows as unknown as RowInput[],
        startY: 30,
        theme: "grid",
        styles: { fontSize: 3, cellPadding: 1 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
      });
    } else {
      doc.text("No data available", 10, 40);
    }
    doc.save("filtered_report.pdf");
  };

  const handleExportExcel = () => {
    // Determine which data to use based on current route
    const exportData = location.pathname === '/home/downloads' ? StudentData : filteredData;
    
    if (exportData.length === 0) {
      alert("No data available to export!");
      return;
    }

    // Transform data to flatten nested objects and format dates
    const formattedData = exportData.map(student => ({
      // Basic Student Info
      'Student ID': (student as Student).id || '',
      'Name': (student as Student).name || '',
      'User ID': (student as Student).userId || '',
      'Community': (student as Student).community || '',
      'Handicapped': (student as Student).handicapped ? 'Yes' : 'No',
      'Level': (student as Student).level || '',
      'Framework': (student as Student).framework || '',
      'Shift': (student as Student).shift || '',
      'Last Passed Year': (student as Student).lastPassedYear || '',
      'Notes': (student as Student).notes || '',
      'Active': (student as Student).active ? 'Yes' : 'No',
      'Alumni': (student as Student).alumni ? 'Yes' : 'No',
      'Leaving Date': (student as Student).leavingDate ? new Date((student as Student).leavingDate).toLocaleDateString() : '',
      'Leaving Reason': (student as Student).leavingReason || '',
      'Created At': (student as Student).createdAt ? new Date((student as Student).createdAt).toLocaleDateString() : '',
      'Updated At': (student as Student).updatedAt ? new Date((student as Student).updatedAt).toLocaleDateString() : '',

      // Specialization
      'Specialization': (student as Student).specialization?.name || '',
      'Specialization Sequence': (student as Student).specialization?.sequence || '',

      // Academic Identifier
      'RFID': (student as Student).academicIdentifier?.rfid || '',
      'Degree Programme': (student as Student).academicIdentifier?.degreeProgramme || '',
      'CU Form Number': (student as Student).academicIdentifier?.cuFormNumber || '',
      'UID': (student as Student).academicIdentifier?.uid || '',
      'Old UID': (student as Student).academicIdentifier?.oldUid || '',
      'Registration Number': (student as Student).academicIdentifier?.registrationNumber || '',
      'Roll Number': (student as Student).academicIdentifier?.rollNumber || '',
      'Section': (student as Student).academicIdentifier?.section || '',
      'Class Roll Number': (student as Student).academicIdentifier?.classRollNumber || '',
      'APAAR ID': (student as Student).academicIdentifier?.apaarId || '',
      'ABC ID': (student as Student).academicIdentifier?.abcId || '',
      'APPR ID': (student as Student).academicIdentifier?.apprid || '',
      'Check Repeat': (student as Student).academicIdentifier?.checkRepeat ? 'Yes' : 'No',

      // Personal Details
      'Aadhaar Card Number': (student as Student).personalDetails?.aadhaarCardNumber || '',
      'Nationality': (student as Student).personalDetails?.nationality?.name || '',
      'Other Nationality': (student as Student).personalDetails?.otherNationality?.name || '',
      'Religion': (student as Student).personalDetails?.religion?.name || '',
      'Category': (student as Student).personalDetails?.category?.name || '',
      'Mother Tongue': (student as Student).personalDetails?.motherTongue?.name || '',
      'Date of Birth': (student as Student).personalDetails?.dateOfBirth ? new Date((student as Student).personalDetails?.dateOfBirth || '').toLocaleDateString() : '',
      'Gender': (student as Student).personalDetails?.gender || '',
      'Email': (student as Student).personalDetails?.email || '',
      'Alternative Email': (student as Student).personalDetails?.alternativeEmail || '',
      'Disability': (student as Student).personalDetails?.disability || '',
      'Disability Code': (student as Student).personalDetails?.disabilityCode?.code || '',

      // Mailing Address
      'Mailing Address - Country': (student as Student).personalDetails?.mailingAddress?.country || '',
      'Mailing Address - State': (student as Student).personalDetails?.mailingAddress?.state || '',
      'Mailing Address - City': (student as Student).personalDetails?.mailingAddress?.city || '',
      'Mailing Address - Address Line': (student as Student).personalDetails?.mailingAddress?.addressLine || '',
      'Mailing Address - Landmark': (student as Student).personalDetails?.mailingAddress?.landmark || '',
      'Mailing Address - Locality Type': (student as Student).personalDetails?.mailingAddress?.localityType || '',
      'Mailing Address - Phone': (student as Student).personalDetails?.mailingAddress?.phone || '',
      'Mailing Address - Pincode': (student as Student).personalDetails?.mailingAddress?.pincode || '',

      // Residential Address
      'Residential Address - Country': (student as Student).personalDetails?.residentialAddress?.country || '',
      'Residential Address - State': (student as Student).personalDetails?.residentialAddress?.state || '',
      'Residential Address - City': (student as Student).personalDetails?.residentialAddress?.city || '',
      'Residential Address - Address Line': (student as Student).personalDetails?.residentialAddress?.addressLine || '',
      'Residential Address - Landmark': (student as Student).personalDetails?.residentialAddress?.landmark || '',
      'Residential Address - Locality Type': (student as Student).personalDetails?.residentialAddress?.localityType || '',
      'Residential Address - Phone': (student as Student).personalDetails?.residentialAddress?.phone || '',
      'Residential Address - Pincode': (student as Student).personalDetails?.residentialAddress?.pincode || '',
    }));

    const Data= location.pathname === '/home/downloads' ? formattedData : filteredData;
    const ws = XLSX.utils.json_to_sheet(Data);
    
    // Auto-size columns
    const colWidths = Object.keys(Data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15) // minimum width of 15 characters
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Data");
    
    // Customize filename based on route
    const fileName = location.pathname === '/home/downloads' 
      ? "student_data.xlsx" 
      : "filtered_data.xlsx";
      
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="flex p-4 sm:p-6 flex-col border rounded-3xl shadow-lg bg-gradient-to-br from-white to-slate-100 gap-6 sm:gap-8">
  {/* Header with title and export */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-0">
    <div className="flex items-center gap-3">
      <div className="bg-teal-100 p-2 rounded-lg shadow-md">
        <Filter className="h-5 w-5 text-teal-600" />
      </div>
      <h2 className="text-xl font-sans font-semibold text-gray-800">
        Filter Options
      </h2>
    </div>

    {/* Export Buttons */}
    <motion.div whileHover={{ scale: 1.05 }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-2 transition-all">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="flex flex-col sm:flex-row justify-center gap-4 p-4 shadow-2xl rounded-3xl border border-teal-300 bg-white/80 backdrop-blur-xl"
        >
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border text-red-600 hover:bg-red-100 hover:border-red-500 hover:text-red-700 transition-all shadow-sm hover:shadow-md"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-500 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-medium">Excel</span>
          </button>
        </PopoverContent>
      </Popover>
    </motion.div>
  </div>

  {/* Filter Body */}
  <div className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between">
    <motion.div className="flex flex-wrap gap-3 w-full">
      {/* Stream Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
            <GraduationCap className="w-4 h-4 text-teal-600" />
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
            <Calendar className="w-4 h-4 text-teal-600" />
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
            <Code2 className="w-4 h-4 text-teal-600" />
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
            <BookOpen className="w-4 h-4 text-teal-600" />
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
        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md flex items-center gap-2 px-5 py-2 mt-4 lg:mt-0"
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