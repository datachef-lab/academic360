import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Absolute paths
const filePathOriginal = path.join(__dirname, 'original-subjects.xlsx');
const filePathDb = path.join(__dirname, 'db-subjects.xlsx');

console.log(filePathOriginal);
console.log(filePathDb);

function readExcelFile(filePath) {
    // Read the workbook
    const workbook = xlsx.readFile(filePath);

    // Get the first worksheet name
    const sheetName = workbook.SheetNames[0];

    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Output data
    console.log(data);

    return data;
}

const originalSubjects = readExcelFile(filePathOriginal);
const dbSubjects = readExcelFile(filePathDb);

// for (let i = 0; i < dbSubjects.length; i++) {
//     if (originalSubjects.some(sbj => sbj["Subject Code as per Marksheet"].toUpperCase().trim() == dbSubjects[i]["Code (In Marksheet)"].toUpperCase().trim())) {
//         originalSubjects[i]["is_original"] = true;
//     }
//     else {
//         originalSubjects[i]["is_original"] = false;
//     }
// }

for (let i = 0; i < dbSubjects.length; i++) {
    const code = dbSubjects[i]["Code (In Marksheet)"];
    const match = originalSubjects.some(
        sbj =>
            code &&
            sbj["Subject Code as per Marksheet"] &&
            sbj["Subject Code as per Marksheet"].toUpperCase().trim() === code.toUpperCase().trim()
    );
    dbSubjects[i]["is_original"] = match;
}



// Create a new workbook
const newWorkbook = xlsx.utils.book_new();
// Convert the modified data back to a worksheet
const newWorksheet = xlsx.utils.json_to_sheet(dbSubjects);
// Append the worksheet to the workbook
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Updated Subjects');
// Write the workbook to a new file
const newFilePath = path.join(__dirname, 'updated-subjects.xlsx');
xlsx.writeFile(newWorkbook, newFilePath);
console.log(`Updated subjects saved to ${newFilePath}`);
// Output the updated subjects