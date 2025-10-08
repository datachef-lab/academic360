# Student Folder Structure Documentation

This document describes the student-specific folder structure implemented in the S3 service for organizing files by student UID.

## Overview

The system now organizes files in a hierarchical structure based on student UID, making it easy to manage and organize documents for each student separately.

## Folder Structure

```
S3 Bucket/
├── students/
│   ├── {student-uid-1}/
│   │   ├── cu-registration-documents/
│   │   │   ├── document1.pdf
│   │   │   ├── document2.jpg
│   │   │   └── ...
│   │   ├── application-form-docs/
│   │   │   ├── application.pdf
│   │   │   ├── photo.jpg
│   │   │   └── ...
│   │   ├── marksheets/
│   │   │   ├── semester1.pdf
│   │   │   ├── semester2.pdf
│   │   │   └── ...
│   │   └── others/
│   │       ├── miscellaneous1.pdf
│   │       └── ...
│   ├── {student-uid-2}/
│   │   └── ...
│   └── ...
```

## Document Types

The system supports the following document types for each student:

1. **`cu-registration-documents`** - CU registration related documents
2. **`application-form-docs`** - Application form documents
3. **`marksheets`** - Academic marksheets and transcripts
4. **`others`** - Miscellaneous documents

## API Endpoints

### Student File Management

#### Get Student Files

```http
GET /api/admissions/cu-registration-document-uploads/student/{studentUid}/files?documentType={type}
```

**Parameters:**

- `studentUid` (path): Student UID
- `documentType` (query, optional): Filter by document type

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "studentUid": "STU001",
    "documentType": "cu-registration-documents",
    "files": [
      "students/STU001/cu-registration-documents/1234567890-123456789.pdf",
      "students/STU001/cu-registration-documents/1234567891-123456790.jpg"
    ],
    "count": 2
  },
  "message": "Student files retrieved successfully!"
}
```

#### Get Student Folder Statistics

```http
GET /api/admissions/cu-registration-document-uploads/student/{studentUid}/stats
```

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "studentUid": "STU001",
    "totalFiles": 5,
    "totalSize": 15728640,
    "documentTypes": {
      "cu-registration-documents": {
        "count": 3,
        "size": 10485760
      },
      "marksheets": {
        "count": 2,
        "size": 5242880
      }
    },
    "folderStructure": {
      "basePath": "students/STU001",
      "documentTypes": [
        "cu-registration-documents",
        "application-form-docs",
        "marksheets",
        "others"
      ],
      "folders": [
        "students/STU001/cu-registration-documents",
        "students/STU001/application-form-docs",
        "students/STU001/marksheets",
        "students/STU001/others"
      ]
    }
  },
  "message": "Student folder statistics retrieved successfully!"
}
```

#### Delete All Student Files

```http
DELETE /api/admissions/cu-registration-document-uploads/student/{studentUid}/files?documentType={type}
```

**Parameters:**

- `studentUid` (path): Student UID
- `documentType` (query, optional): Delete only specific document type

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "studentUid": "STU001",
    "documentType": "cu-registration-documents",
    "deleted": [
      "students/STU001/cu-registration-documents/file1.pdf",
      "students/STU001/cu-registration-documents/file2.jpg"
    ],
    "failed": [],
    "deletedCount": 2,
    "failedCount": 0
  },
  "message": "Student files deleted successfully!"
}
```

## Usage Examples

### Upload Document for Student

```typescript
import {
  createStudentUploadConfig,
  uploadToS3,
} from "@/services/s3.service.js";

// Create student-specific upload configuration
const uploadConfig = createStudentUploadConfig(
  "STU001", // Student UID
  "cu-registration-documents", // Document type
  {
    maxFileSizeMB: 10,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    makePublic: false,
    metadata: {
      correctionRequestId: "123",
      documentId: "456",
      remarks: "Identity proof document",
    },
  },
);

// Upload file
const result = await uploadToS3(file, uploadConfig);
// Result: { key: "students/STU001/cu-registration-documents/1234567890-123456789.pdf", url: "...", bucket: "..." }
```

### List Student Files

```typescript
import { listStudentFiles } from "@/services/s3.service.js";

// List all files for a student
const allFiles = await listStudentFiles("STU001");

// List files for specific document type
const cuRegistrationFiles = await listStudentFiles(
  "STU001",
  "cu-registration-documents",
);
```

### Get Student Folder Statistics

```typescript
import { getStudentFolderStats } from "@/services/s3.service.js";

const stats = await getStudentFolderStats("STU001");
console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Document types:`, stats.documentTypes);
```

### Delete Student Files

```typescript
import { deleteAllStudentFiles } from "@/services/s3.service.js";

// Delete all files for a student
const result = await deleteAllStudentFiles("STU001");

// Delete files for specific document type
const result = await deleteAllStudentFiles(
  "STU001",
  "cu-registration-documents",
);
```

## Integration with CU Registration

The CU registration document upload system now automatically uses the student folder structure:

1. **Automatic Student Detection**: When uploading a document, the system fetches the student UID from the correction request
2. **Organized Storage**: Files are automatically stored in `students/{studentUid}/cu-registration-documents/`
3. **Metadata Tracking**: Each file includes metadata about the correction request and document type
4. **Easy Retrieval**: Files can be easily retrieved by student UID and document type

## Benefits

1. **Organization**: Files are logically organized by student and document type
2. **Scalability**: Easy to manage thousands of students and their documents
3. **Security**: Each student's files are isolated in their own folder
4. **Maintenance**: Easy to clean up or archive files for specific students
5. **Analytics**: Easy to generate statistics and reports per student
6. **Backup**: Can backup or restore files for specific students

## Migration from Legacy Structure

The system maintains backward compatibility with the legacy folder structure while providing the new student-specific organization. Existing files continue to work, and new uploads use the student folder structure.

## Security Considerations

1. **Access Control**: Implement proper IAM policies to control access to student folders
2. **Data Privacy**: Ensure student data is properly protected and compliant with regulations
3. **Audit Trail**: Log all file operations for security and compliance
4. **Encryption**: Use S3 server-side encryption for sensitive student documents

## Performance Considerations

1. **Folder Depth**: The 3-level folder structure (students/{uid}/{type}) is optimal for S3 performance
2. **File Naming**: Use timestamp-based naming to avoid conflicts and improve performance
3. **Batch Operations**: Use bulk operations for managing multiple files
4. **Caching**: Consider caching folder statistics for frequently accessed data

## Future Enhancements

1. **Folder Permissions**: Implement fine-grained permissions per student folder
2. **File Versioning**: Add support for file versioning within student folders
3. **Automated Cleanup**: Implement automated cleanup of old or unused files
4. **Compression**: Add support for file compression to save storage space
5. **Search**: Implement full-text search across student documents
