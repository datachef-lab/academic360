/**
 * CU Registration Number Generation Service
 *
 * This service handles the generation and validation of CU Registration Application Numbers
 * Format: 017XXXX (where XXXX is a 4-digit sequential number)
 */

import { db } from "@/db/index.js";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model.js";
import { max, sql } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";

export class CuRegistrationNumberService {
  private static readonly PREFIX = "017";
  private static readonly NUMBER_LENGTH = 4;
  private static readonly TOTAL_LENGTH = 7; // 017 + 4 digits

  /**
   * Generate the next available CU Registration Application Number
   */
  static async generateNextApplicationNumber(): Promise<string> {
    try {
      // Get the highest existing number
      const result = await db
        .select({
          maxNumber: max(
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          ),
        })
        .from(cuRegistrationCorrectionRequestModel);

      const maxExistingNumber = result[0]?.maxNumber;

      if (!maxExistingNumber) {
        // No existing numbers, start with 0170001
        return this.formatApplicationNumber(1);
      }

      // Extract the numeric part from the existing number
      const numericPart = this.extractNumericPart(maxExistingNumber);

      if (numericPart === null) {
        throw new ApiError(
          500,
          "Invalid existing CU Registration Application Number format",
        );
      }

      // Generate next number
      const nextNumber = numericPart + 1;

      // Check if we've reached the maximum (0179999)
      if (nextNumber > 9999) {
        throw new ApiError(
          500,
          "Maximum CU Registration Application Numbers reached (0179999)",
        );
      }

      return this.formatApplicationNumber(nextNumber);
    } catch (error) {
      console.error(
        "Error generating CU Registration Application Number:",
        error,
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "Failed to generate CU Registration Application Number",
      );
    }
  }

  /**
   * Format a number into the CU Registration Application Number format
   */
  static formatApplicationNumber(number: number): string {
    if (number < 1 || number > 9999) {
      throw new ApiError(400, "Number must be between 1 and 9999");
    }

    const paddedNumber = number.toString().padStart(this.NUMBER_LENGTH, "0");
    return `${this.PREFIX}${paddedNumber}`;
  }

  /**
   * Extract the numeric part from a CU Registration Application Number
   */
  static extractNumericPart(applicationNumber: string): number | null {
    if (!this.isValidFormat(applicationNumber)) {
      return null;
    }

    const numericPart = applicationNumber.substring(this.PREFIX.length);
    return parseInt(numericPart, 10);
  }

  /**
   * Validate CU Registration Application Number format
   */
  static isValidFormat(applicationNumber: string): boolean {
    if (!applicationNumber || typeof applicationNumber !== "string") {
      return false;
    }

    // Check length
    if (applicationNumber.length !== this.TOTAL_LENGTH) {
      return false;
    }

    // Check prefix
    if (!applicationNumber.startsWith(this.PREFIX)) {
      return false;
    }

    // Check if the remaining part is numeric
    const numericPart = applicationNumber.substring(this.PREFIX.length);
    if (!/^\d{4}$/.test(numericPart)) {
      return false;
    }

    // Check if the number is not 0000
    const number = parseInt(numericPart, 10);
    if (number === 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if a CU Registration Application Number is available (not already used)
   */
  static async isApplicationNumberAvailable(
    applicationNumber: string,
  ): Promise<boolean> {
    try {
      if (!this.isValidFormat(applicationNumber)) {
        return false;
      }

      const result = await db
        .select({ id: cuRegistrationCorrectionRequestModel.id })
        .from(cuRegistrationCorrectionRequestModel)
        .where(
          sql`${cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber} = ${applicationNumber}`,
        )
        .limit(1);

      return result.length === 0;
    } catch (error) {
      console.error(
        "Error checking CU Registration Application Number availability:",
        error,
      );
      throw new ApiError(
        500,
        "Failed to check CU Registration Application Number availability",
      );
    }
  }

  /**
   * Get all CU Registration Application Numbers in a range
   */
  static async getApplicationNumbersInRange(
    startNumber: number,
    endNumber: number,
  ): Promise<(string | null)[]> {
    try {
      if (startNumber < 1 || endNumber > 9999 || startNumber > endNumber) {
        throw new ApiError(
          400,
          "Invalid range. Numbers must be between 1 and 9999, and start must be <= end",
        );
      }

      const startFormatted = this.formatApplicationNumber(startNumber);
      const endFormatted = this.formatApplicationNumber(endNumber);

      const result = await db
        .select({
          cuRegistrationApplicationNumber:
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        })
        .from(cuRegistrationCorrectionRequestModel)
        .where(
          sql`${cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber} BETWEEN ${startFormatted} AND ${endFormatted}`,
        )
        .orderBy(
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        );

      return result.map((row) => row.cuRegistrationApplicationNumber);
    } catch (error) {
      console.error(
        "Error getting CU Registration Application Numbers in range:",
        error,
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "Failed to get CU Registration Application Numbers in range",
      );
    }
  }

  /**
   * Get statistics about CU Registration Application Numbers
   */
  static async getApplicationNumberStats(): Promise<{
    totalIssued: number;
    nextAvailable: string;
    lastIssued: string | null;
    range: { min: string; max: string };
  }> {
    try {
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(cuRegistrationCorrectionRequestModel);

      // Get min and max numbers
      const rangeResult = await db
        .select({
          minNumber: sql<string>`min(${cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber})`,
          maxNumber: sql<string>`max(${cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber})`,
        })
        .from(cuRegistrationCorrectionRequestModel);

      const totalIssued = countResult[0]?.count || 0;
      const minNumber = rangeResult[0]?.minNumber;
      const maxNumber = rangeResult[0]?.maxNumber;

      // Generate next available number
      const nextAvailable = await this.generateNextApplicationNumber();

      return {
        totalIssued,
        nextAvailable,
        lastIssued: maxNumber || null,
        range: {
          min: minNumber || this.formatApplicationNumber(1),
          max: maxNumber || this.formatApplicationNumber(1),
        },
      };
    } catch (error) {
      console.error(
        "Error getting CU Registration Application Number stats:",
        error,
      );
      throw new ApiError(
        500,
        "Failed to get CU Registration Application Number statistics",
      );
    }
  }

  /**
   * Reserve a specific CU Registration Application Number (if available)
   */
  static async reserveApplicationNumber(
    applicationNumber: string,
  ): Promise<boolean> {
    try {
      if (!this.isValidFormat(applicationNumber)) {
        throw new ApiError(
          400,
          "Invalid CU Registration Application Number format",
        );
      }

      const isAvailable =
        await this.isApplicationNumberAvailable(applicationNumber);
      if (!isAvailable) {
        throw new ApiError(
          409,
          "CU Registration Application Number is already in use",
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Error reserving CU Registration Application Number:",
        error,
      );
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "Failed to reserve CU Registration Application Number",
      );
    }
  }

  /**
   * Get the next N available application numbers
   */
  static async getNextNAvailableNumbers(count: number): Promise<string[]> {
    try {
      if (count < 1 || count > 100) {
        throw new ApiError(400, "Count must be between 1 and 100");
      }

      const numbers: string[] = [];
      let currentNumber = 1;

      while (numbers.length < count && currentNumber <= 9999) {
        const formattedNumber = this.formatApplicationNumber(currentNumber);
        const isAvailable =
          await this.isApplicationNumberAvailable(formattedNumber);

        if (isAvailable) {
          numbers.push(formattedNumber);
        }

        currentNumber++;
      }

      if (numbers.length < count) {
        throw new ApiError(
          500,
          `Only ${numbers.length} numbers available out of ${count} requested`,
        );
      }

      return numbers;
    } catch (error) {
      console.error("Error getting next N available numbers:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to get next N available numbers");
    }
  }
}

// Example usage and testing functions
export class CuRegistrationNumberExamples {
  /**
   * Example: Generate and validate a CU Registration Application Number
   */
  static async exampleUsage() {
    try {
      // Generate next number
      const nextNumber =
        await CuRegistrationNumberService.generateNextApplicationNumber();
      console.log(`Next available number: ${nextNumber}`);

      // Validate format
      const isValid = CuRegistrationNumberService.isValidFormat(nextNumber);
      console.log(`Is valid format: ${isValid}`);

      // Check availability
      const isAvailable =
        await CuRegistrationNumberService.isApplicationNumberAvailable(
          nextNumber,
        );
      console.log(`Is available: ${isAvailable}`);

      // Get statistics
      const stats =
        await CuRegistrationNumberService.getApplicationNumberStats();
      console.log("Statistics:", stats);

      return {
        nextNumber,
        isValid,
        isAvailable,
        stats,
      };
    } catch (error) {
      console.error("Example usage error:", error);
      throw error;
    }
  }

  /**
   * Example: Format and extract numbers
   */
  static formatExamples() {
    const examples = [
      { input: 1, expected: "0170001" },
      { input: 42, expected: "0170042" },
      { input: 123, expected: "0170123" },
      { input: 9999, expected: "0179999" },
    ];

    examples.forEach(({ input, expected }) => {
      const formatted =
        CuRegistrationNumberService.formatApplicationNumber(input);
      const extracted =
        CuRegistrationNumberService.extractNumericPart(formatted);
      const isValid = CuRegistrationNumberService.isValidFormat(formatted);

      console.log(
        `Input: ${input} -> Formatted: ${formatted} -> Extracted: ${extracted} -> Valid: ${isValid}`,
      );
      console.log(`Expected: ${expected}, Match: ${formatted === expected}`);
    });
  }
}
