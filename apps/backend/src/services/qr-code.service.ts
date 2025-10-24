import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

export interface QRCodeOptions {
  text: string;
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRCodeService {
  /**
   * Generate QR code as data URL (base64)
   */
  public static async generateQRCodeDataURL(
    text: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<string> {
    try {
      const qrOptions = {
        width: options?.size || 200,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || "#000000",
          light: options?.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: "M" as const,
      };

      const dataURL = await QRCode.toDataURL(text, qrOptions);
      return dataURL;
    } catch (error) {
      console.error(
        "[QR CODE SERVICE] Error generating QR code data URL:",
        error,
      );
      throw new Error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate QR code as PNG buffer
   */
  public static async generateQRCodeBuffer(
    text: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<Buffer> {
    try {
      const qrOptions = {
        width: options?.size || 200,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || "#000000",
          light: options?.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: "M" as const,
      };

      const buffer = await QRCode.toBuffer(text, qrOptions);
      return buffer;
    } catch (error) {
      console.error(
        "[QR CODE SERVICE] Error generating QR code buffer:",
        error,
      );
      throw new Error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate QR code and save to file
   */
  public static async generateQRCodeFile(
    text: string,
    outputPath: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<string> {
    try {
      const buffer = await this.generateQRCodeBuffer(text, options);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write QR code to file
      await fs.writeFile(outputPath, buffer);

      console.info("[QR CODE SERVICE] QR code saved successfully", {
        outputPath,
        text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
      });

      return outputPath;
    } catch (error) {
      console.error("[QR CODE SERVICE] Error saving QR code to file:", error);
      throw new Error(
        `Failed to save QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate QR code for application number (optimized for PDF embedding)
   */
  public static async generateApplicationQRCode(
    applicationNumber: string,
    size: number = 120,
  ): Promise<string> {
    try {
      const qrOptions: Partial<QRCodeOptions> = {
        size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      const dataURL = await this.generateQRCodeDataURL(
        applicationNumber,
        qrOptions,
      );
      return dataURL;
    } catch (error) {
      console.error(
        "[QR CODE SERVICE] Error generating application QR code:",
        error,
      );
      throw new Error(
        `Failed to generate application QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
