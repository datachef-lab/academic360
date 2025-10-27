export class AdmRegFormService {
  /**
   * Encodes a string parameter and returns an alphanumeric encoded string
   * @param input - The string to encode
   * @returns An alphanumeric encoded string
   */
  encodeString(input: string): string {
    if (!input || typeof input !== "string") {
      throw new Error("Input must be a non-empty string");
    }

    // Convert string to base64 first
    const base64 = Buffer.from(input, "utf8").toString("base64");

    // Replace non-alphanumeric characters with alphanumeric equivalents
    // Use different characters to avoid conflicts with existing base64 characters
    const alphanumeric = base64
      .replace(/\+/g, "X") // Replace + with X
      .replace(/\//g, "Y") // Replace / with Y
      .replace(/=/g, "Z"); // Replace = with Z

    return alphanumeric;
  }

  /**
   * Decodes an alphanumeric encoded string back to original string
   * @param encoded - The alphanumeric encoded string
   * @returns The original decoded string
   */
  decodeString(encoded: string): string {
    if (!encoded || typeof encoded !== "string") {
      throw new Error("Encoded input must be a non-empty string");
    }

    // Convert back from alphanumeric to base64
    const base64 = encoded
      .replace(/X/g, "+") // Replace X with +
      .replace(/Y/g, "/") // Replace Y with /
      .replace(/Z/g, "="); // Replace Z with =

    // Decode from base64
    return Buffer.from(base64, "base64").toString("utf8");
  }

  /**
   * Encodes CU application number for secure transmission
   * @param applicationNumber - The CU application number to encode
   * @returns Encoded application number
   */
  encodeApplicationNumber(applicationNumber: string): string {
    return this.encodeString(applicationNumber);
  }

  /**
   * Decodes CU application number from encoded string
   * @param encodedApplicationNumber - The encoded application number
   * @returns Original application number
   */
  decodeApplicationNumber(encodedApplicationNumber: string): string {
    return this.decodeString(encodedApplicationNumber);
  }

  /**
   * Generates PDF access URL with encoded application number
   * @param applicationNumber - The CU application number
   * @param baseUrl - Base URL for the API (e.g., https://api.yourdomain.com)
   * @returns Complete URL for PDF access
   */
  generatePdfAccessUrl(applicationNumber: string, baseUrl: string): string {
    const encodedAppNumber = this.encodeApplicationNumber(applicationNumber);
    return `${baseUrl}/api/admissions/cu-registration-correction-requests/pdf/${encodedAppNumber}`;
  }
}
