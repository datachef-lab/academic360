# AWS S3 Integration for CU Registration Document Uploads

This document describes the AWS S3 integration for storing CU registration correction request documents.

## Environment Variables Required

Add the following environment variables to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_s3_bucket_name
```

## AWS S3 Setup

1. **Create an S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Choose the region (ap-south-1 for Mumbai)
   - Configure bucket permissions as needed

2. **Create IAM User:**
   - Go to AWS IAM Console
   - Create a new user for the application
   - Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. **Generate Access Keys:**
   - Go to the IAM user
   - Create access keys
   - Copy the Access Key ID and Secret Access Key

## File Storage Structure

Files are stored in S3 with the following structure:

```
your-bucket-name/
└── cu-registration-documents/
    ├── 1703123456789-123456789.pdf
    ├── 1703123456790-987654321.jpg
    └── ...
```

## API Endpoints

### Upload Document

```bash
POST /api/admissions/cu-registration-document-uploads
Content-Type: multipart/form-data

FormData:
- file: [document file]
- cuRegistrationCorrectionRequestId: 1
- documentId: 5
- remarks: "Supporting document"
```

### Get Document Info

```bash
GET /api/admissions/cu-registration-document-uploads/:id
```

### Get Signed URL for File Access

```bash
GET /api/admissions/cu-registration-document-uploads/:id/signed-url?expiresIn=3600
```

### Delete Document

```bash
DELETE /api/admissions/cu-registration-document-uploads/:id
```

## Features

- **File Upload**: Direct upload to S3 with validation
- **File Validation**: Type and size validation before upload
- **Signed URLs**: Generate temporary access URLs for private files
- **Automatic Cleanup**: Files are deleted from S3 when records are removed
- **Error Handling**: Proper error handling with S3 cleanup on failures

## File Types Supported

- Images: jpeg, jpg, png, gif
- Documents: pdf, doc, docx, xls, xlsx, txt
- Maximum file size: 10MB

## Security

- Files are stored in a dedicated S3 folder
- Signed URLs provide temporary access
- File validation prevents malicious uploads
- Automatic cleanup prevents orphaned files

## Error Handling

- Upload failures are handled gracefully
- S3 cleanup on validation errors
- Proper error messages for debugging
- Logging for troubleshooting
