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
import { ChevronDown } from "lucide-react";
import { Stream } from "@/types/academics/stream";
import { useQuery } from "@tanstack/react-query";
import { getAllStreams } from "@/services/stream";
import { useReportStore } from "../globals/useReportStore";

type Year = "2021" | "2022" | "2023" | "2024" | "2025";
type Framework = "CCF" | "CBCS";

const FilterAndExportComponent: React.FC = () => {

  const { setFilters, filteredData,uiFilters,setUiFilters } = useReportStore();

  const { data } = useQuery({
    queryKey: ["streams"],
    queryFn: getAllStreams,
  });
  const streamMemo = useMemo(() => {
    if (!data) {
      //console.warn("No data received from API");
      return [];
    }

    const streamMap = new Map();
    data.forEach((item: Stream) => {
      if (item.degree) {
        streamMap.set(item.degree.id, { id: item.degree.id, name: item.degree.name });
      }
    });
    const degreeNames = [...streamMap.values()];
    //console.log("Distinct Degree Names:", degreeNames);
    return degreeNames;
  }, [data]);

  const handleApplyFilters = () => {
     //console.log("Applying Filters - Stream:", uiFilters.selectedStream?.name, "Year:", uiFilters.selectedYear, "Framework:", uiFilters.selectedFramework, "Semester:", uiFilters.selectedSemester);
    setFilters({ 
      stream: uiFilters.selectedStream?.name || null, 
      year:uiFilters.selectedYear,
      framework:uiFilters.selectedFramework, 
      semester: uiFilters.selectedSemester});
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
    //console.log("Exporting as PDF");
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
    //console.log("Exporting as Excel");
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
    <div className="px-5 w-full flex items-center justify-between">
      <div className="flex flex-row items-center gap-16 p-1">
        <div className="w-full flex gap-2">
          {/* Stream Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400 " variant="outline">
                {uiFilters.selectedStream ? uiFilters.selectedStream .name : "Select Stream"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {streamMemo.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => {
                    //console.log("Selected Stream:", option.name);
                    handleStreamSelect(option as unknown as Stream);
                  }}
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Year Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400" variant="outline">
                {uiFilters.selectedYear ? uiFilters.selectedYear : "Year"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["2021", "2022", "2023", "2024", "2025"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    //console.log("Selected Year:", option);
                    handleYearSelect(option as Year);
                  }}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400" variant="outline">
                {uiFilters.selectedFramework ? uiFilters.selectedFramework : "Framework"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["CCF", "CBCS"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    //console.log("Selected framework:", option);
                    handleFrameworkSelect(option as Framework);
                  }}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400" variant="outline">
                {uiFilters.selectedSemester ? `Semester ${uiFilters.selectedSemester}` : "Semester"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {semesterOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    //console.log("Selected framework:", option);
                    handleSemesterSelect(option);
                  }}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="outline" className="border border-gray-400" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>

      {/* Export Buttons */}
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="border border-gray-400" variant="outline">
              Export <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              Export as PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              Export as Excel
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default FilterAndExportComponent;
