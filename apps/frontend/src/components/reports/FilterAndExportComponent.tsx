// import React, { useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
// import * as XLSX from "xlsx";
// import autoTable, { RowInput } from "jspdf-autotable";
// import { jsPDF } from "jspdf";
// import { ChevronDown } from "lucide-react";
// import { Stream } from "@/types/academics/stream";
// import { useQuery } from "@tanstack/react-query";
// import { getAllStreams } from "@/services/stream";
// import { useReportStore } from "../globals/useReportStore";

// type Year = "2021" | "2022" | "2023" | "2024" | "2025";
// type Framework = "CCF" | "CBCS";

// const FilterAndExportComponent: React.FC = () => {

//   const { setFilters, filteredData,uiFilters,setUiFilters } = useReportStore();

//   const { data } = useQuery({
//     queryKey: ["streams"],
//     queryFn: getAllStreams,
//   });
//   const streamMemo = useMemo(() => {
//     if (!data) {
//       //console.warn("No data received from API");
//       return [];
//     }

//     const streamMap = new Map();
//     data.forEach((item: Stream) => {
//       if (item.degree) {
//         streamMap.set(item.degree.id, { id: item.degree.id, name: item.degree.name });
//       }
//     });
//     const degreeNames = [...streamMap.values()];
//     //console.log("Distinct Degree Names:", degreeNames);
//     return degreeNames;
//   }, [data]);

//   const handleApplyFilters = () => {
//      //console.log("Applying Filters - Stream:", uiFilters.selectedStream?.name, "Year:", uiFilters.selectedYear, "Framework:", uiFilters.selectedFramework, "Semester:", uiFilters.selectedSemester);
//     setFilters({ 
//       stream: uiFilters.selectedStream?.name || null, 
//       year:uiFilters.selectedYear,
//       framework:uiFilters.selectedFramework, 
//       semester: uiFilters.selectedSemester});
//   };
//   const handleStreamSelect = (option: { name: string }) => {
//     setUiFilters({ selectedStream: option });
//   };
//   const handleYearSelect = (year: Year) => {
//     setUiFilters({ selectedYear: year });
//   };

//   const handleFrameworkSelect = (framework: Framework) => {
//     setUiFilters({ selectedFramework: framework });
//   };

//   const handleSemesterSelect = (semester: number) => {
//     setUiFilters({ selectedSemester: semester });
//   };
//   const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

//   const handleExportPDF = () => {
//     //console.log("Exporting as PDF");
//     const doc = new jsPDF();
//     doc.text("Exported Report", 10, 10);

//     if (filteredData.length > 0) {
//       const headers = [Object.keys(filteredData[0])];
//       const rows = filteredData.map((row) => Object.values(row));
//       autoTable(doc, {
//         head: headers,
//         body: rows as unknown as RowInput[],
//         startY: 30,
//         theme: "grid",
//         styles: { fontSize: 3, cellPadding: 1 },
//         headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
//       });
//     } else {
//       doc.text("No data available", 10, 40);
//     }
//     doc.save("filtered_report.pdf");
//   };

//   const handleExportExcel = () => {
//     //console.log("Exporting as Excel");
//     if (filteredData.length === 0) {
//       alert("No data available to export!");
//       return;
//     }

//     const ws = XLSX.utils.json_to_sheet(filteredData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
//     XLSX.writeFile(wb, "filtered_data.xlsx");
//   };

//   return (
//     <div className="px-5 w-full flex items-center justify-between">
//       <div className="flex flex-row items-center gap-16 p-1">
//         <div className="w-full flex gap-2">
//           {/* Stream Dropdown */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button className="border border-gray-400 " variant="outline">
//                 {uiFilters.selectedStream ? uiFilters.selectedStream .name : "Select Stream"} <ChevronDown />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               {streamMemo.map((option) => (
//                 <DropdownMenuItem
//                   key={option.id}
//                   onClick={() => {
//                     //console.log("Selected Stream:", option.name);
//                     handleStreamSelect(option as unknown as Stream);
//                   }}
//                 >
//                   {option.name}
//                 </DropdownMenuItem>
//               ))}
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* Year Dropdown */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button className="border border-gray-400" variant="outline">
//                 {uiFilters.selectedYear ? uiFilters.selectedYear : "Year"} <ChevronDown />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               {["2021", "2022", "2023", "2024", "2025"].map((option) => (
//                 <DropdownMenuItem
//                   key={option}
//                   onClick={() => {
//                     //console.log("Selected Year:", option);
//                     handleYearSelect(option as Year);
//                   }}
//                 >
//                   {option}
//                 </DropdownMenuItem>
//               ))}
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button className="border border-gray-400" variant="outline">
//                 {uiFilters.selectedFramework ? uiFilters.selectedFramework : "Framework"} <ChevronDown />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               {["CCF", "CBCS"].map((option) => (
//                 <DropdownMenuItem
//                   key={option}
//                   onClick={() => {
//                     //console.log("Selected framework:", option);
//                     handleFrameworkSelect(option as Framework);
//                   }}
//                 >
//                   {option}
//                 </DropdownMenuItem>
//               ))}
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button className="border border-gray-400" variant="outline">
//                 {uiFilters.selectedSemester ? `Semester ${uiFilters.selectedSemester}` : "Semester"} <ChevronDown />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               {semesterOptions.map((option) => (
//                 <DropdownMenuItem
//                   key={option}
//                   onClick={() => {
//                     //console.log("Selected framework:", option);
//                     handleSemesterSelect(option);
//                   }}
//                 >
//                   {option}
//                 </DropdownMenuItem>
//               ))}
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>

//         <Button variant="outline" className="border border-gray-400" onClick={handleApplyFilters}>
//           Apply Filters
//         </Button>
//       </div>

//       {/* Export Buttons */}
//       <div>
//         <Popover>
//           <PopoverTrigger asChild>
//             <Button className="border border-gray-400" variant="outline">
//               Export <ChevronDown />
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent className="flex gap-2">
//             <Button variant="outline" onClick={handleExportPDF}>
//               Export as PDF
//             </Button>
//             <Button variant="outline" onClick={handleExportExcel}>
//               Export as Excel
//             </Button>
//           </PopoverContent>
//         </Popover>
//       </div>
//     </div>
//   );
// };

// export default FilterAndExportComponent;
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

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {
  const { setFilters, filteredData, uiFilters, setUiFilters } = useReportStore();

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
    if (filteredData.length === 0) {
      alert("No data available to export!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
    XLSX.writeFile(wb, "filtered_data.xlsx");
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