import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface ExcelRow {
    error?: string;
    [key: string]: unknown;
}

export function writeExcelFile(directoryPath: string, fileName: string, data: ExcelRow[]) {
    if (!data || data.length === 0) {
        console.error("No data to write.");
        return;
    }

    // Ensure the directory exists
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Split data into invalid (with error) and valid rows
    const invalidRows = data.filter(row => row.error);
    const validRows = data.filter(row => !row.error);
    const orderedData = [...invalidRows, ...validRows];

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(orderedData);

    // Apply red font to invalid rows
    invalidRows.forEach((row, idx) => {
        const excelRowIdx = idx + 2; // 1-based, +1 for header
        Object.keys(row).forEach((col, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: excelRowIdx - 1, c: colIdx });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = {
                    font: { color: { rgb: "FF0000" } }
                };
            }
        });
    });

    // Create a new workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write workbook to file (with cell styles)
    const filePath = path.join(directoryPath, `${fileName}.xlsx`);
    XLSX.writeFile(workbook, filePath, { cellStyles: true });

    console.log(`Excel file written successfully at: ${filePath}`);
}
