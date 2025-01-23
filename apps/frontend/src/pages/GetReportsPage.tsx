import { mockData } from "@/lib/Data";
import { columns } from "@/components/ReportPage/columns";
import { DataTable } from "@/components/ReportPage/DataTable";

export default function GetReports() {
  return <DataTable columns={columns} data={mockData} />;
}
