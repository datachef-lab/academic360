# CU Registration Application Number System

This document describes the CU Registration Application Number system that generates and manages unique application numbers in the format `017XXXX`.

## Overview

The CU Registration Application Number system automatically generates sequential application numbers for CU registration correction requests. Each number follows the format `017XXXX` where `XXXX` is a 4-digit sequential number.

## Format Specification

- **Format**: `017XXXX`
- **Length**: 7 characters
- **Prefix**: `017` (fixed)
- **Suffix**: 4-digit sequential number (0001-9999)
- **Examples**: `0170001`, `0170002`, `0170042`, `0171234`, `0179999`

## Features

### 1. Automatic Number Generation

- Generates the next available sequential number
- Starts from `0170001` if no existing numbers
- Automatically increments based on the highest existing number

### 2. Format Validation

- Validates the exact format `017XXXX`
- Ensures the number part is between 0001 and 9999
- Rejects invalid formats like `0170000` or `01710000`

### 3. Availability Checking

- Checks if a specific number is already in use
- Prevents duplicate number assignment
- Ensures uniqueness across all requests

### 4. Statistics and Reporting

- Tracks total numbers issued
- Shows next available number
- Displays range of issued numbers
- Provides comprehensive statistics

## API Endpoints

### Get Next Available Number

```http
GET /api/admissions/cu-registration-correction-requests/next-application-number
```

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "nextApplicationNumber": "0170001"
  },
  "message": "Next CU Registration Application Number retrieved successfully!"
}
```

### Validate Application Number

```http
POST /api/admissions/cu-registration-correction-requests/validate-application-number
```

**Request Body:**

```json
{
  "applicationNumber": "0170001"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "applicationNumber": "0170001",
    "isValid": true,
    "isAvailable": true,
    "message": "Number is available"
  },
  "message": "CU Registration Application Number validation completed!"
}
```

### Get Statistics

```http
GET /api/admissions/cu-registration-correction-requests/application-number-stats
```

**Response:**

```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": {
    "totalIssued": 150,
    "nextAvailable": "0170151",
    "lastIssued": "0170150",
    "range": {
      "min": "0170001",
      "max": "0170150"
    }
  },
  "message": "CU Registration Application Number statistics retrieved successfully!"
}
```

## Usage Examples

### 1. Creating a New Request (Automatic Number Generation)

```typescript
import { createCuRegistrationCorrectionRequest } from "@/features/admissions/services/cu-registration-correction-request.service.js";

// Create request without providing application number
const requestData = {
  studentId: 123,
  remarks: "Need to correct personal information",
  genderCorrectionRequest: true,
  // cuRegistrationApplicationNumber is not provided - will be auto-generated
};

const newRequest = await createCuRegistrationCorrectionRequest(requestData);
// newRequest.cuRegistrationApplicationNumber will be "0170001" (or next available)
```

### 2. Creating a Request with Specific Number

```typescript
import { createCuRegistrationCorrectionRequest } from "@/features/admissions/services/cu-registration-correction-request.service.js";

// Create request with specific application number
const requestData = {
  studentId: 123,
  cuRegistrationApplicationNumber: "0170042", // Must be valid and available
  remarks: "Need to correct personal information",
  genderCorrectionRequest: true,
};

const newRequest = await createCuRegistrationCorrectionRequest(requestData);
```

### 3. Using the Number Service Directly

```typescript
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";

// Generate next number
const nextNumber =
  await CuRegistrationNumberService.generateNextApplicationNumber();
console.log(nextNumber); // "0170001"

// Validate format
const isValid = CuRegistrationNumberService.isValidFormat("0170001");
console.log(isValid); // true

// Check availability
const isAvailable =
  await CuRegistrationNumberService.isApplicationNumberAvailable("0170001");
console.log(isAvailable); // true

// Get statistics
const stats = await CuRegistrationNumberService.getApplicationNumberStats();
console.log(stats);
// {
//   totalIssued: 150,
//   nextAvailable: "0170151",
//   lastIssued: "0170150",
//   range: { min: "0170001", max: "0170150" }
// }
```

### 4. Format and Extract Numbers

```typescript
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";

// Format a number
const formatted = CuRegistrationNumberService.formatApplicationNumber(42);
console.log(formatted); // "0170042"

// Extract numeric part
const numeric = CuRegistrationNumberService.extractNumericPart("0170042");
console.log(numeric); // 42

// Validate various formats
const examples = [
  "0170001",
  "0170042",
  "0179999",
  "0170000",
  "0160001",
  "01710000",
];
examples.forEach((num) => {
  const isValid = CuRegistrationNumberService.isValidFormat(num);
  console.log(`${num}: ${isValid}`);
});
// 0170001: true
// 0170042: true
// 0179999: true
// 0170000: false (cannot be 0000)
// 0160001: false (wrong prefix)
// 01710000: false (too long)
```

## Database Schema

### CU Registration Correction Request Model

```typescript
export const cuRegistrationCorrectionRequestModel = pgTable(
  "cu_registration_correction_requests",
  {
    id: serial().primaryKey(),
    cuRegistrationApplicationNumber: varchar(
      "cu_registration_application_number",
      { length: 7 },
    ).notNull(), // Format: 017XXXX
    studentId: integer("student_id_fk")
      .references(() => studentModel.id)
      .notNull(),
    // ... other fields
  },
);
```

### Validation Schema

```typescript
export const cuRegistrationCorrectionRequestInsertSchema = createInsertSchema(
  cuRegistrationCorrectionRequestModel,
  {
    cuRegistrationApplicationNumber: z
      .string()
      .length(
        7,
        "CU Registration Application Number must be exactly 7 characters",
      )
      .regex(
        /^017\d{4}$/,
        "CU Registration Application Number must be in format 017XXXX (4 digits after 017)",
      ),
  },
);
```

## Service Architecture

### CuRegistrationNumberService

The main service class that handles all number generation and validation logic:

- **`generateNextApplicationNumber()`**: Generates the next available number
- **`formatApplicationNumber(number)`**: Formats a number into the correct format
- **`extractNumericPart(applicationNumber)`**: Extracts the numeric part from a formatted number
- **`isValidFormat(applicationNumber)`**: Validates the format
- **`isApplicationNumberAvailable(applicationNumber)`**: Checks availability
- **`getApplicationNumberStats()`**: Gets comprehensive statistics

### Integration with CU Registration Service

The CU registration correction request service automatically:

1. **Auto-generates numbers**: If no number is provided, generates the next available
2. **Validates provided numbers**: If a number is provided, validates format and availability
3. **Prevents duplicates**: Ensures no duplicate numbers are assigned
4. **Handles errors**: Provides clear error messages for invalid numbers

## Error Handling

### Common Error Scenarios

1. **Invalid Format**

   ```json
   {
     "error": "Invalid CU Registration Application Number format. Must be in format 017XXXX"
   }
   ```

2. **Number Already in Use**

   ```json
   {
     "error": "CU Registration Application Number is already in use"
   }
   ```

3. **Maximum Numbers Reached**

   ```json
   {
     "error": "Maximum CU Registration Application Numbers reached (0179999)"
   }
   ```

4. **Database Errors**
   ```json
   {
     "error": "Failed to generate CU Registration Application Number"
   }
   ```

## Performance Considerations

1. **Sequential Generation**: Numbers are generated sequentially for optimal performance
2. **Database Indexing**: The application number field should be indexed for fast lookups
3. **Caching**: Consider caching the next available number for high-traffic scenarios
4. **Batch Operations**: The service supports getting multiple available numbers at once

## Security Considerations

1. **Format Validation**: Strict format validation prevents injection attacks
2. **Uniqueness**: Database constraints ensure number uniqueness
3. **Audit Trail**: All number assignments are logged in the database
4. **Access Control**: API endpoints should be properly secured

## Migration and Setup

### Database Migration

If you need to update existing data to the new format:

```sql
-- Update existing records to new format (if needed)
UPDATE cu_registration_correction_requests
SET cu_registration_application_number = '017' || LPAD(CAST(SUBSTRING(cu_registration_application_number FROM 4) AS INTEGER), 4, '0')
WHERE cu_registration_application_number NOT LIKE '017%';
```

### Environment Setup

No additional environment variables are required. The system uses the existing database connection.

## Testing

### Unit Tests

```typescript
import { CuRegistrationNumberService } from "@/services/cu-registration-number.service.js";

describe("CuRegistrationNumberService", () => {
  test("should format numbers correctly", () => {
    expect(CuRegistrationNumberService.formatApplicationNumber(1)).toBe(
      "0170001",
    );
    expect(CuRegistrationNumberService.formatApplicationNumber(42)).toBe(
      "0170042",
    );
    expect(CuRegistrationNumberService.formatApplicationNumber(9999)).toBe(
      "0179999",
    );
  });

  test("should validate format correctly", () => {
    expect(CuRegistrationNumberService.isValidFormat("0170001")).toBe(true);
    expect(CuRegistrationNumberService.isValidFormat("0170000")).toBe(false);
    expect(CuRegistrationNumberService.isValidFormat("0160001")).toBe(false);
    expect(CuRegistrationNumberService.isValidFormat("01710000")).toBe(false);
  });

  test("should extract numeric part correctly", () => {
    expect(CuRegistrationNumberService.extractNumericPart("0170001")).toBe(1);
    expect(CuRegistrationNumberService.extractNumericPart("0170042")).toBe(42);
    expect(CuRegistrationNumberService.extractNumericPart("0179999")).toBe(
      9999,
    );
  });
});
```

## Future Enhancements

1. **Number Ranges**: Support for different number ranges for different types of requests
2. **Custom Prefixes**: Allow different prefixes for different institutions
3. **Number Recycling**: Option to recycle numbers from deleted requests
4. **Bulk Generation**: Generate multiple numbers at once for batch operations
5. **Number History**: Track the history of number assignments and changes
