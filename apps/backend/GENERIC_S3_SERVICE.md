# Generic S3 Service Documentation

This document describes the generic AWS S3 service that can be used across different features in the application.

## Overview

The S3 service provides a flexible, configurable interface for file operations with AWS S3. It supports multiple buckets, custom configurations, and predefined configurations for common use cases.

## Features

- **Multi-bucket support**: Use different S3 buckets for different features
- **Configurable upload options**: Customize file validation, folder structure, and permissions
- **Predefined configurations**: Ready-to-use configs for common scenarios
- **File validation**: Type and size validation with custom rules
- **Signed URLs**: Generate temporary access URLs for private files
- **Bulk operations**: Upload, delete, and list multiple files
- **Error handling**: Comprehensive error handling with cleanup

## Configuration

### Environment Variables

```bash
# Default S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_default_bucket_name
```

### S3Config Interface

```typescript
interface S3Config {
  region?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}
```

### UploadConfig Interface

```typescript
interface UploadConfig {
  folder?: string;
  customFileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
  maxFileSizeMB?: number;
  allowedMimeTypes?: string[];
}
```

## Predefined Configurations

### File Type Configurations

```typescript
import { FileTypeConfigs } from "@/services/s3.service.js";

// Available configurations:
FileTypeConfigs.DOCUMENTS; // All document types
FileTypeConfigs.IMAGES; // Image files only
FileTypeConfigs.PDF_ONLY; // PDF files only
FileTypeConfigs.SPREADSHEETS; // Excel/CSV files
FileTypeConfigs.WORD_DOCS; // Word documents
```

### Upload Configurations

```typescript
import { UploadConfigs } from "@/services/s3.service.js";

// Available configurations:
UploadConfigs.CU_REGISTRATION_DOCUMENTS; // For CU registration
UploadConfigs.PROFILE_IMAGES; // For user profiles
UploadConfigs.GENERAL_DOCUMENTS; // General document uploads
UploadConfigs.PUBLIC_ASSETS; // Public assets
```

## Usage Examples

### Basic Upload

```typescript
import { uploadToS3, UploadConfigs } from "@/services/s3.service.js";

// Using predefined configuration
const result = await uploadToS3(file, UploadConfigs.CU_REGISTRATION_DOCUMENTS);

// Using custom configuration
const customConfig = {
  folder: "custom-folder",
  maxFileSizeMB: 5,
  allowedMimeTypes: ["image/jpeg", "image/png"],
  makePublic: true,
};
const result = await uploadToS3(file, customConfig);
```

### Upload with Custom S3 Configuration

```typescript
import { uploadToS3, UploadConfigs } from "@/services/s3.service.js";

const s3Config = {
  bucket: "different-bucket",
  region: "us-east-1",
};

const result = await uploadToS3(file, UploadConfigs.PROFILE_IMAGES, s3Config);
```

### File Deletion

```typescript
import { deleteFromS3, deleteMultipleFiles } from "@/services/s3.service.js";

// Delete single file
await deleteFromS3("folder/file.jpg");

// Delete multiple files
const result = await deleteMultipleFiles(["file1.jpg", "file2.pdf"]);
console.log(
  `Deleted: ${result.deleted.length}, Failed: ${result.failed.length}`,
);
```

### Signed URLs

```typescript
import { getSignedUrlForFile } from "@/services/s3.service.js";

// Generate signed URL (expires in 1 hour by default)
const signedUrl = await getSignedUrlForFile("folder/file.pdf");

// Generate signed URL with custom expiration
const signedUrl = await getSignedUrlForFile("folder/file.pdf", 7200); // 2 hours
```

### File Listing

```typescript
import { listFilesInFolder } from "@/services/s3.service.js";

// List all files in a folder
const files = await listFilesInFolder("cu-registration-documents");
```

## Creating Custom Configurations

### For a New Feature

```typescript
// Define custom file types
const CUSTOM_FILE_TYPES = [
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

// Define custom upload configuration
const CUSTOM_UPLOAD_CONFIG = {
  folder: "archive-uploads",
  maxFileSizeMB: 50,
  allowedMimeTypes: CUSTOM_FILE_TYPES,
  makePublic: false,
  metadata: {
    feature: "archive-upload",
    version: "1.0",
  },
};

// Use in your controller
const result = await uploadToS3(file, CUSTOM_UPLOAD_CONFIG);
```

## Multer Integration

### Basic Setup

```typescript
import multer from "multer";
import {
  validateFileType,
  validateFileSize,
  UploadConfigs,
} from "@/services/s3.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:
      UploadConfigs.CU_REGISTRATION_DOCUMENTS.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      !validateFileType(
        file,
        UploadConfigs.CU_REGISTRATION_DOCUMENTS.allowedMimeTypes,
      )
    ) {
      return cb(new Error("Invalid file type"));
    }
    if (
      !validateFileSize(
        file,
        UploadConfigs.CU_REGISTRATION_DOCUMENTS.maxFileSizeMB,
      )
    ) {
      return cb(new Error("File too large"));
    }
    cb(null, true);
  },
});
```

## Error Handling

The service provides comprehensive error handling:

```typescript
try {
  const result = await uploadToS3(file, config);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle application-specific errors
    console.error(error.message);
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
  }
}
```

## Best Practices

1. **Use Predefined Configurations**: Start with predefined configs and customize as needed
2. **Validate Early**: Use multer fileFilter for early validation
3. **Handle Errors Gracefully**: Always wrap S3 operations in try-catch
4. **Clean Up on Failure**: Delete uploaded files if database operations fail
5. **Use Appropriate Folders**: Organize files in logical folder structures
6. **Set Proper Permissions**: Use makePublic only when necessary
7. **Monitor File Sizes**: Set appropriate size limits for your use case

## Security Considerations

- Files are private by default (makePublic: false)
- Use signed URLs for temporary access to private files
- Validate file types to prevent malicious uploads
- Set appropriate file size limits
- Use different buckets for different security levels
- Regularly audit file access and cleanup unused files

## Performance Tips

- Use memory storage for multer when uploading to S3
- Implement file compression for large files
- Use CDN for public assets
- Batch delete operations when possible
- Monitor S3 costs and implement lifecycle policies
