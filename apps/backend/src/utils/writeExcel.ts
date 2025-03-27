import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

export function writeExcelFile(directoryPath: string, fileName: string, data: any[]) {
    if (!data || data.length === 0) {
        console.error("No data to write.");
        return;
    }

    // Ensure the directory exists
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Define file path
    const filePath = path.join(directoryPath, `${fileName}.xlsx`);

    // Write workbook to file
    XLSX.writeFile(workbook, filePath);

    console.log(`Excel file written successfully at: ${filePath}`);
}
