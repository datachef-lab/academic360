import xlsx from "xlsx";

export const readExcelFile = (filePath: string): Array<Record<string, any>> => {
    // Read the file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet) as Array<Record<string, any>>;

    return jsonData; // Returns an array of objects
};
