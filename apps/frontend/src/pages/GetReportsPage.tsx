import { mockData } from "@/lib/Data";
import { columns } from "@/components/reports/columns";
import { DataTable } from "@/components/reports/DataTable";

export default function GetReports() {
  return <DataTable columns={columns} data={mockData} />;
}
