

import React, { useState } from "react";
import { mockData } from "@/lib/Data";
import FilterAndExportComponent from "@/components/reports/FilterAndExportComponent";
import { columns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";


const Page: React.FC = () => {
  const [filteredData, setFilteredData] = useState(mockData);

  const handleFilter = ({ stream, year }: { stream: string | null; year: string | null }) => {
    let filtered = mockData;

    if (stream && stream !== "All") {
      filtered = filtered.filter((item) => item.stream === stream);
    }
    if (year) {
      filtered = filtered.filter((item) => item.year.toString() === year);
    }

    setFilteredData(filtered);
  };

  return (
    <div>
     <div className="mt-4"> <FilterAndExportComponent onFilter={handleFilter} filteredData={filteredData} /></div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default Page;
