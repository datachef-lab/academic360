
import React, { useState } from "react";
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
import { Payment } from "./types";

type Stream = "BCOM" | "BA" | "BSC" ;
type Year = "2021" | "2022" | "2023" | "2024" | "2025" ;

interface FilterAndExportProps {
  onFilter: (filters: { stream: Stream | null; year: Year | null }) => void;
  filteredData: Payment[]; // Accept filtered data for exporting
}

const FilterAndExportComponent: React.FC<FilterAndExportProps> = ({ onFilter, filteredData }) => {
  const [stream, setStream] = useState<Stream | null>(null);
  const [year, setYear] = useState<Year | null>(null);

  const handleApplyFilters = () => {
    onFilter({ stream, year });
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
  
    // Title
    doc.text("Exported Report", 10, 10);
    // doc.text(`Stream: ${stream || "All"}`, 10, 20);
    // doc.text(`Year: ${year || "All"}`, 10, 30);
  
    if (filteredData.length > 0) {
      // Table headers
  
      const headers = [Object.keys(filteredData[0])];
  
      // Extract table data
      const rows = filteredData.map((row) => Object.values(row));
  
      // Generate the table
      autoTable(doc, {
        head: headers,
        body: rows as unknown as RowInput[],
        startY: 30, // Positioning the table below the text
        theme: "grid",
        styles: { fontSize: 6, cellPadding: 3 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
      });
    } else {
      doc.text("No data available", 10, 40);
    }
  
    // Save the PDF
    doc.save("filtered_report.pdf");
  };
  // Export to Excel
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
    <div className="px-6 w-full flex items-center justify-between">
      <div className="flex flex-row items-center gap-16 p-1">
        <div className="w-full flex gap-2">
          {/* Stream Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400" variant="outline">
                {stream ? stream : "Stream"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[ "BCOM", "BA", "BSC"].map((option) => (
                <DropdownMenuItem key={option} onClick={() => setStream(option as Stream)}>
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Year Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="border border-gray-400"  variant="outline">
                {year ? year : "Year"} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["2021", "2022", "2023", "2024", "2025"].map((option) => (
                <DropdownMenuItem key={option} onClick={() => setYear(option as Year)}>
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="outline" className="border border-gray-400"  onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>

      {/* Export Buttons */}
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="border border-gray-400"  variant="outline">
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
