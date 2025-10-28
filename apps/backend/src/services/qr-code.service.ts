import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import { Jimp } from "jimp";

export interface QRCodeOptions {
  text: string;
  size?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
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

  /**
   * Generate QR code for physical registration with time and venue information
   */
  public static async generatePhysicalRegistrationQRCode(
    qrContent: string,
    size: number = 200, // Increased size for better visibility
  ): Promise<string> {
    try {
      const qrOptions: Partial<QRCodeOptions> = {
        size,
        margin: 1, // Same margin as application QR code
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      const dataURL = await this.generateQRCodeDataURL(qrContent, qrOptions);

      console.info(
        "[QR CODE SERVICE] Physical registration QR code generated successfully",
        {
          contentLength: qrContent.length,
          size,
        },
      );

      return dataURL;
    } catch (error) {
      console.error(
        "[QR CODE SERVICE] Error generating physical registration QR code:",
        error,
      );
      throw new Error(
        `Failed to generate physical registration QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate QR code with college logo overlay using Jimp
   */
  public static async generateQRCodeWithLogo(
    qrContent: string,
    logoUrl: string,
    size: number = 200,
    logoSize: number = 40, // Size of the logo overlay
  ): Promise<string> {
    try {
      // Try Jimp approach first
      if (Jimp) {
        try {
          console.info(
            "[QR CODE SERVICE] Using Jimp for QR code with logo generation",
          );

          // Generate QR code as buffer
          const qrOptions: Partial<QRCodeOptions> = {
            size,
            margin: 1,
            errorCorrectionLevel: "H", // High error correction for logo overlay
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          };

          const qrBuffer = await QRCode.toBuffer(qrContent, qrOptions);

          // Load QR code image with Jimp
          const qrImage = await Jimp.read(qrBuffer);

          // Try to overlay logo
          try {
            // Fetch logo image
            const logoResponse = await fetch(logoUrl);
            if (logoResponse.ok) {
              const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

              // Load logo with Jimp
              const logo = await Jimp.read(logoBuffer);

              // Resize logo to be smaller for better QR code readability (30% of QR code size)
              const logoWidth = Math.floor(size * 0.3);
              logo.resize({ w: logoWidth, h: logoWidth });

              // Calculate position to center the logo on QR code
              const x = Math.floor((size - logoWidth) / 2);
              const y = Math.floor((size - logoWidth) / 2);

              // Composite logo directly onto QR code (centered)
              qrImage.composite(logo, x, y);

              console.info(
                "[QR CODE SERVICE] QR code with logo generated successfully using Jimp",
                {
                  logoUrl,
                  size,
                  logoSize: logoWidth,
                },
              );
            } else {
              console.warn(
                "[QR CODE SERVICE] Could not fetch logo, generating QR code without logo",
              );
            }
          } catch (logoError) {
            console.warn(
              "[QR CODE SERVICE] Could not process logo, generating QR code without logo:",
              logoError,
            );
          }

          // Convert to data URL
          const finalBuffer = await qrImage.getBuffer("image/png");
          return `data:image/png;base64,${finalBuffer.toString("base64")}`;
        } catch (jimpError) {
          console.warn(
            "[QR CODE SERVICE] Jimp approach failed, falling back to simple QR code:",
            jimpError,
          );
        }
      }

      // Fallback: Generate simple QR code without logo
      console.info("[QR CODE SERVICE] Generating simple QR code without logo");
      const qrOptions: Partial<QRCodeOptions> = {
        size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      return await this.generateQRCodeDataURL(qrContent, qrOptions);
    } catch (error) {
      console.error(
        "[QR CODE SERVICE] Error generating QR code with logo:",
        error,
      );
      throw new Error(
        `Failed to generate QR code with logo: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
