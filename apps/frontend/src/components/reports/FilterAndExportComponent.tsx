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
import { ChevronDown, Filter, Download, FileText, FileSpreadsheet } from "lucide-react";
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
        <motion.div 
         
          className="flex flex-wrap gap-2 w-full"
        >
          {/* Stream Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm">
                {uiFilters.selectedStream ? uiFilters.selectedStream.name : "Stream"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto shadow-lg rounded-md border border-indigo-100">
              {streamMemo.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => handleStreamSelect(option as unknown as Stream)}
                  className="hover:bg-indigo-50 focus:bg-indigo-50"
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Year Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm">
                {uiFilters.selectedYear ? uiFilters.selectedYear : "Year"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="shadow-lg rounded-md border border-indigo-100">
              {["2021", "2022", "2023", "2024", "2025"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleYearSelect(option as Year)}
                  className="hover:bg-indigo-50 focus:bg-indigo-50"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Framework Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm">
                {uiFilters.selectedFramework ? uiFilters.selectedFramework : "Framework"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="shadow-lg rounded-md border border-indigo-100">
              {["CCF", "CBCS"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleFrameworkSelect(option as Framework)}
                  className="hover:bg-indigo-50 focus:bg-indigo-50"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Semester Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-sm">
                {uiFilters.selectedSemester ? `Sem ${uiFilters.selectedSemester}` : "Semester"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="shadow-lg rounded-md border border-indigo-100">
              {semesterOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleSemesterSelect(option)}
                  className="hover:bg-indigo-50 focus:bg-indigo-50"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleApplyFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </motion.div>
      </div>

      {/* Export Buttons */}

      <motion.div whileHover={{ scale: 1.05 }}>
  <Popover>
    <PopoverTrigger asChild>
      <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="center"
      sideOffset={8}
      className="flex justify-center gap-4 p-6 shadow-xl rounded-2xl border border-emerald-300 bg-gradient-to-r from-white/80 via-transparent to-white/80 backdrop-blur-xl w-auto max-w-fit"
    >
      {/* PDF Button */}
      <div className="flex flex-col items-center justify-center text-sm">
        <button
          onClick={handleExportPDF}
          className="group border focus:outline-none flex flex-col gap-0 px-4 py-4 rounded-xl bg-red-100/70 backdrop-blur-md shadow-lg hover:border-red-500 hover:shadow-xl  hover:bg-red-100 transition-all duration-300 cursor-pointer"
        >
          <FileText className="w-8 h-8 text-red-600 transition-all duration-300 transform group-hover:scale-125 group-hover:rotate-6 hover:text-red-700" />
          <span className="mt-2 font-medium text-red-600 group-hover:text-red-700 transition-colors duration-300">
            PDF
          </span>
        </button>
      </div>

      {/* Excel Button */}
      <div className="flex flex-col items-center justify-center text-sm">
        <button
          onClick={handleExportExcel}
          className="group border focus:outline-none flex flex-col gap-0 px-4 py-4 rounded-xl bg-blue-100/70 backdrop-blur-md shadow-lg hover:border-blue-500 hover:shadow-xl hover:bg-blue-100 transition-all duration-300 cursor-pointer"
        >
          <FileSpreadsheet className="w-8 h-8 text-blue-600 transition-all duration-300 transform group-hover:scale-125 group-hover:rotate-6 hover:text-blue-700" />
          <span className="mt-2 font-medium text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
            Excel
          </span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</motion.div>


    </div>
  );
};

export default FilterAndExportComponent;