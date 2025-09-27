import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import { Calendar, BookOpen, Filter, ChevronDown, GraduationCap, Download, FileCode2 } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { motion } from "framer-motion";

import { toast } from "sonner";
import { useStudentDownloadStore } from "../globals/useStudentDownloadStore";
import { getFilteredStudents } from "@/services/student";
import { PersonalDetails } from "@/types/user/personal-details";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import { Specialization } from "@/types/resources/specialization";
import { Community, Level, Shift } from "@/types/enums";
import { findAllDegrees } from "@/services/degree.service";
import { StudentDto } from "@repo/db/dtos/user";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
type Framework = "CCF" | "CBCS";

type FlattenedStudentData = {
  "Student ID": number | undefined;
  Name: string;
  Stream: string;
  Framework: Framework | null;
  Semester: number | undefined | null;
  Year: number | undefined | null;
  Community: Community | null | undefined;
  Handicapped: string;
  RFID: string;
  "CU Form Number": string;
  UID: string;
  "Old UID": string;
  "Registration Number": string;
  "Roll Number": string;
  "Class Roll Number": string;
  "APAAR ID": string;
  "ABC ID": string;
  "APPR ID": string;
  "Aadhaar Number": string;
  "Date of Birth": string;
  Gender: string;
  Email: string;
  "Alternative Email": string;
  Disability: string;
  Category: string;
  "Category Code": string;
  "Mailing Address": string;
  "Mailing Pincode": string;
  "Mailing Locality": string;
  "Residential Address": string;
  "Residential Pincode": string;
  "Residential Locality": string;
  Nationality: string;
  Religion: string;
  "Created At": string;
  "Updated At": string;
};

export interface StudentExport {
  readonly id?: number;
  name: string;
  userId: number;
  community: Community | null;
  semester?: number;
  year?: number;
  handicapped: boolean;
  level: Level | null;
  framework: Framework | null;
  specializationId: number;
  shift: Shift | null;
  lastPassedYear: number;
  notes: string;
  active: boolean;
  alumni: boolean;
  leavingDate: Date;
  leavingReason: string;
  specialization?: Specialization | null;
  academicIdentifier?: AcademicIdentifier | null;
  personalDetails?: PersonalDetails | null;
  createdAt: Date;
  updatedAt: Date;
}

const StudentDownloadFilterAndExport: React.FC = () => {
  const { setFilters, filters, uiFilters, setUiFilters } = useStudentDownloadStore();

  const [isExporting, setIsExporting] = useState(false);

  const { data } = useQuery({
    queryKey: ["degrees"],
    queryFn: findAllDegrees,
  });

  const streamMemo = useMemo(() => data ?? [], [data]);

  const { refetch: fetchStudentExportData, isFetching: isFetchingExport } = useQuery({
    queryKey: ["exportStudent", filters],
    queryFn: () =>
      getFilteredStudents({
        stream: filters.stream ?? "",
        year: filters.year?.toString() ?? "",
        framework: filters.framework ?? "",
        semester: filters.semester?.toString() ?? "",
        export: "true",
      }),
    enabled: false, // Do not auto-fetch
  });

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

  const handleFrameworkSelect = (framework: Framework) => {
    setUiFilters({ selectedFramework: framework });
  };

  const handleSemesterSelect = (semester: number) => {
    setUiFilters({ selectedSemester: semester });
  };

  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { data: exportData } = await fetchStudentExportData();

      const StudentExportData = exportData?.content ?? [];
      console.log("exportingData", StudentExportData);
      if (!StudentExportData || StudentExportData.length === 0) {
        toast.error("No data available for export.");
        return;
      }

      const flattenedData: FlattenedStudentData[] = StudentExportData.map((student: StudentDto) => ({
        "Student ID": student.id,
        Name: student.personalDetails?.firstName || "",
        Stream: student.programCourse?.name || "",
        Framework: null, // Not available in StudentDto
        Semester: null, // Not available in StudentDto
        Year: null, // Not available in StudentDto
        Community: student.community,
        Handicapped: student.handicapped ? "Yes" : "No",

        RFID: student.rfidNumber || "",
        "CU Form Number": student.cuFormNumber || "",
        UID: student.uid || "",
        "Old UID": "", // Not available in StudentDto
        "Registration Number": student.registrationNumber || "",
        "Roll Number": student.rollNumber || "",
        "Class Roll Number": student.classRollNumber || "",
        "APAAR ID": student.apaarId || "",
        "ABC ID": student.abcId || "",
        "APPR ID": student.apprid || "",

        "Aadhaar Number": student.personalDetails?.aadhaarCardNumber || "",
        "Date of Birth": student.personalDetails?.dateOfBirth
          ? new Date(student.personalDetails.dateOfBirth).toLocaleDateString()
          : "",
        Gender: student.personalDetails?.gender || "",
        Email: student.personalEmail || "",
        "Alternative Email": "", // Not available in StudentDto
        Disability: student.personalDetails?.disability || "None",
        Category: student.personalDetails?.category?.name || "",
        "Category Code": student.personalDetails?.category?.code || "",

        "Mailing Address": (student.personalDetails as any)?.mailingAddress?.addressLine || "",
        "Mailing Pincode": (student.personalDetails as any)?.mailingAddress?.pincode || "",
        "Mailing Locality": (student.personalDetails as any)?.mailingAddress?.localityType || "",

        "Residential Address": (student.personalDetails as any)?.residentialAddress?.addressLine || "",
        "Residential Pincode": (student.personalDetails as any)?.residentialAddress?.pincode || "",
        "Residential Locality": (student.personalDetails as any)?.residentialAddress?.localityType || "",

        Nationality: student.personalDetails?.nationality?.name || "",
        Religion: student.personalDetails?.religion?.name || "",

        "Created At": student.createdAt ? new Date(student.createdAt).toLocaleString() : "",
        "Updated At": student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);

      if (flattenedData.length > 0) {
        const headers = Object.keys(flattenedData[0] || {});
        worksheet["!cols"] = headers.map((key) => {
          const maxLength = Math.max(
            key.length,
            ...flattenedData.map(
              (row: FlattenedStudentData) => (row[key as keyof FlattenedStudentData] ?? "").toString().length,
            ),
          );
          return { wch: Math.max(15, maxLength + 2) };
        });
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, `Students_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex p-4 sm:p-6 flex-col border rounded-3xl shadow-lg bg-gradient-to-br from-white to-slate-100 gap-6 sm:gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg shadow-md">
            <Filter className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-sans font-semibold text-gray-800">Filter Options</h2>
        </div>

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
              {Array.isArray(streamMemo)
                ? streamMemo.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleStreamSelect(option)}
                      className="hover:bg-slate-100"
                    >
                      {option.name}
                    </DropdownMenuItem>
                  ))
                : null}
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

          {/* Framework Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-sm px-4 py-2">
                <FileCode2 className="w-4 h-4 text-purple-600" />
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

export default StudentDownloadFilterAndExport;
