import fs from 'fs';
import path from 'path';

interface DocumentInfo {
  framework: string;
  stream: string;
  semester: string;
  doc_type: string;
}

// Helper function to recursively find all PDF files
const findPdfFiles = (dir: string): string[] => {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively search in subdirectories
      files.push(...findPdfFiles(fullPath));
    } else if (item.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Helper function to extract document info from path
const extractDocumentInfo = (filePath: string): DocumentInfo | null => {
  try {
    // Split the path into parts and filter out empty strings
    const parts = filePath.split(path.sep).filter(part => part.trim() !== '');
    
    // Get the relevant directory names
    // Path structure: .../CBCS/BA/2017/DEGREE-CERTIFICATES/12345.pdf
    const framework = parts[parts.length - 5]; // CBCS
    const stream = parts[parts.length - 4];    // BA
    const year = parts[parts.length - 3];      // 2017
    const docType = parts[parts.length - 2];   // DEGREE-CERTIFICATES
    
    // Convert docType to lowercase and replace hyphens with underscores
    const formattedDocType = docType.toLowerCase().replace(/-/g, '_');
    
    return {
      framework,
      stream,
      semester: year, // Using year as semester
      doc_type: formattedDocType
    };
  } catch (error) {
    console.error('Error extracting document info from path:', filePath, error);
    return null;
  }
};

export const scanDocumentsByRollNo = async (rollNo: string): Promise<DocumentInfo[]> => {
  const documents: DocumentInfo[] = [];
  const basePath = process.env.DOCUMENT_BASE_PATH;
  
  console.log("Starting document scan for roll number:", rollNo);
  console.log("Using document base path:", basePath);

  if (!basePath) {
    throw new Error('DOCUMENT_BASE_PATH environment variable is not set');
  }

  try {
    // Check if directory exists
    if (!fs.existsSync(basePath)) {
      throw new Error(`Document directory does not exist: ${basePath}`);
    }

    // Find all PDF files recursively
    const allPdfFiles = findPdfFiles(basePath);
    console.log(`Found ${allPdfFiles.length} PDF files in directory and subdirectories`);

    // Filter files that match the roll number pattern (case-insensitive)
    const matchingFiles = allPdfFiles.filter(filePath => {
      const fileName = path.basename(filePath);
      const matchesRollNo = fileName.toLowerCase().startsWith(rollNo.toLowerCase());
      
      if (matchesRollNo) {
        console.log("Found matching file:", filePath);
      }
      return matchesRollNo;
    });

    console.log(`Found ${matchingFiles.length} matching files for roll number ${rollNo}`);

    if (matchingFiles.length === 0) {
      console.warn("No PDF files found matching the roll number");
      return documents;
    }

    // Process each matching file
    for (const filePath of matchingFiles) {
      const documentInfo = extractDocumentInfo(filePath);
      
      if (documentInfo) {
        console.log(`Processing file ${filePath}:`, documentInfo);
        documents.push(documentInfo);
      } else {
        console.warn(`Skipping file with invalid path structure: ${filePath}`);
      }
    }

    console.log(`Successfully processed ${documents.length} documents`);
    return documents;
  } catch (error) {
    console.error('Error scanning documents:', error);
    throw new Error('Failed to scan documents');
  }
}; 