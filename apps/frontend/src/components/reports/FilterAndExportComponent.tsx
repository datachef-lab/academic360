
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { ChevronDown } from 'lucide-react';

type Stream = 'BCOM' | 'BA' | 'BSC'|'All';
type Year = '2021' | '2022' | '2023' | '2024' | '2025';

const FilterAndExportComponent: React.FC = () => {
  const [stream, setStream] = useState<Stream | null>(null);
  const [year, setYear] = useState<Year | null>(null);

  const handleApplyFilters = () => {
    console.log('Applying Filters:', { stream, year });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.text('Exported Report', 10, 10);
    doc.text(`Stream: ${stream}`, 10, 20);
    doc.text(`Year: ${year}`, 10, 30);

   doc.save('report.pdf');
  };

  const handleExportExcel = () => {
    const data = [
     
      { stream: 'BCOM', year: '2021', otherData: 'Sample Data' },
      { stream: 'BA', year: '2022', otherData: 'Sample Data' },
      { stream: 'BSC', year: '2023', otherData: 'Sample Data' }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    XLSX.writeFile(wb, 'exported_data.xlsx');
  };

  return (
    <div className="px-6 w-full flex item-center justify-between ">
      <div className="flex flex-row items-center justify-between gap-10  p-1  ">
      <div className="w-full flex  gap-1 ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>{stream? stream: "Stream" }
            <ChevronDown></ChevronDown>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setStream('All')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStream('BCOM')}>BCOM</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStream('BA')}>BA</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStream('BSC')}>BSC</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu >
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>{year? year: "Year" } <ChevronDown></ChevronDown></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setYear('2021')}>2021</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYear('2022')}>2022</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYear('2023')}>2023</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYear('2024')}>2024</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYear('2025')}>2025</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        <Button variant='outline' onClick={handleApplyFilters}>Apply Filters</Button>
      </div>

      <div >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline'>Export  <ChevronDown></ChevronDown></Button>
          </PopoverTrigger>
          <PopoverContent className='flex gap-2'>

            <Button variant='outline' onClick={handleExportPDF}>Export as PDF</Button>
            <Button variant='outline' onClick={handleExportExcel}>Export as Excel</Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default FilterAndExportComponent;
