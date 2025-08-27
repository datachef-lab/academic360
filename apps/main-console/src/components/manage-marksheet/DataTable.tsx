import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps {
  data: { date: string; activity: string }[];
}

export default function DataTable({ data }: DataTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow">
      {data.length === 0 ? (
        <p className="p-4 text-center text-gray-600">No records found</p>
      ) : (
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className="hover:bg-gray-50 transition">
                <TableCell className="py-3 px-4">{item.date}</TableCell>
                <TableCell className="py-3 px-4">{item.activity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
