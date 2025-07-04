import * as XLSX from "xlsx";
import { toast } from "sonner";

export const exportToExcel = async <T extends Record<string, unknown>>(data: T[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      toast.error("No data available for export.");
      return;
    }
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set dynamic column widths with padding and a minimum width
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet["!cols"] = headers.map((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => String(row[key] ?? "").length)
        );
        return {
          wch: Math.max(15, maxLength + 2),
        };
      });
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exported successfully!");
  } catch (error) {
    console.error("Failed to export:", error);
    toast.error("Failed to export. Please try again.");
  }
}; 