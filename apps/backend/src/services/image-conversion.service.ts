/**
 * Image Conversion and Compression Service
 *
 * This service handles:
 * 1. Converting PDFs to JPG images
 * 2. Converting various image formats to JPG
 * 3. Compressing images to meet specific file size requirements
 * 4. Maintaining quality while reducing file size
 */

import puppeteer from "puppeteer";
import { ApiError } from "@/utils/ApiError.js";

export interface ImageConversionOptions {
  targetSizeKB?: number; // Target file size in KB (e.g., 100, 250)
  quality?: number; // JPEG quality 0-100
  maxWidth?: number; // Maximum width in pixels
  maxHeight?: number; // Maximum height in pixels
}

export interface ConversionResult {
  buffer: Buffer;
  mimeType: string;
  sizeKB: number;
  originalSizeKB: number;
}

/**
 * Convert PDF to JPG using Puppeteer
 */
export async function convertPdfToJpg(
  pdfBuffer: Buffer,
  options?: ImageConversionOptions,
): Promise<ConversionResult> {
  let browser;
  try {
    console.info("[IMAGE CONVERSION] Starting PDF to JPG conversion");

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Create a data URL from the PDF buffer
    const pdfDataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    // Navigate to the PDF
    await page.goto(pdfDataUrl, { waitUntil: "networkidle0" });

    // Take screenshot of the first page
    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: options?.quality || 90,
      fullPage: true,
    });

    await browser.close();

    const originalSizeKB = pdfBuffer.length / 1024;
    let resultBuffer = screenshot;
    let currentSizeKB = resultBuffer.length / 1024;

    console.info(
      `[IMAGE CONVERSION] PDF converted to JPG: ${originalSizeKB.toFixed(2)}KB -> ${currentSizeKB.toFixed(2)}KB`,
    );

    // If target size is specified and current size exceeds it, compress further
    if (options?.targetSizeKB && currentSizeKB > options.targetSizeKB) {
      console.info(
        `[IMAGE CONVERSION] Compressing to meet target size: ${options.targetSizeKB}KB`,
      );
      resultBuffer = await compressImageToTarget(
        resultBuffer,
        options.targetSizeKB,
        options.quality || 90,
      );
      currentSizeKB = resultBuffer.length / 1024;
    }

    return {
      buffer: Buffer.from(resultBuffer),
      mimeType: "image/jpeg",
      sizeKB: currentSizeKB,
      originalSizeKB,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error("[IMAGE CONVERSION] PDF to JPG conversion failed:", error);
    throw new ApiError(500, "Failed to convert PDF to JPG");
  }
}

/**
 * Convert any image format to JPG with compression
 * Uses Canvas API since we don't have sharp
 */
export async function convertImageToJpg(
  imageBuffer: Buffer,
  originalMimeType: string,
  options?: ImageConversionOptions,
): Promise<ConversionResult> {
  try {
    console.info(`[IMAGE CONVERSION] Converting ${originalMimeType} to JPG`);

    const originalSizeKB = imageBuffer.length / 1024;

    // If it's already a JPEG and within target size, just return it
    if (originalMimeType === "image/jpeg" || originalMimeType === "image/jpg") {
      if (!options?.targetSizeKB || originalSizeKB <= options.targetSizeKB) {
        console.info(
          `[IMAGE CONVERSION] Image already JPG and within target size`,
        );
        return {
          buffer: imageBuffer,
          mimeType: "image/jpeg",
          sizeKB: originalSizeKB,
          originalSizeKB,
        };
      }
    }

    // Use Puppeteer to convert image
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Create a data URL from the image buffer
      const imageDataUrl = `data:${originalMimeType};base64,${imageBuffer.toString("base64")}`;

      // Create an HTML page with the image
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imageDataUrl}" />
          </body>
        </html>
      `);

      // Wait for image to load
      await page.waitForSelector("img");

      // Take screenshot
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: options?.quality || 90,
        fullPage: true,
      });

      await browser.close();

      let resultBuffer = screenshot;
      let currentSizeKB = resultBuffer.length / 1024;

      console.info(
        `[IMAGE CONVERSION] Image converted: ${originalSizeKB.toFixed(2)}KB -> ${currentSizeKB.toFixed(2)}KB`,
      );

      // If target size is specified and current size exceeds it, compress further
      if (options?.targetSizeKB && currentSizeKB > options.targetSizeKB) {
        console.info(
          `[IMAGE CONVERSION] Compressing to meet target size: ${options.targetSizeKB}KB`,
        );
        resultBuffer = await compressImageToTarget(
          resultBuffer,
          options.targetSizeKB,
          options.quality || 90,
        );
        currentSizeKB = resultBuffer.length / 1024;
      }

      return {
        buffer: Buffer.from(resultBuffer),
        mimeType: "image/jpeg",
        sizeKB: currentSizeKB,
        originalSizeKB,
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error) {
    console.error("[IMAGE CONVERSION] Image conversion failed:", error);
    throw new ApiError(500, "Failed to convert image to JPG");
  }
}

/**
 * Compress image buffer to meet target file size
 * Uses iterative quality reduction
 */
async function compressImageToTarget(
  imageBuffer: Buffer | Uint8Array,
  targetSizeKB: number,
  initialQuality: number,
): Promise<Buffer> {
  let currentBuffer = Buffer.from(imageBuffer);
  let currentSizeKB = imageBuffer.length / 1024;
  let quality = initialQuality;
  let attempts = 0;
  const maxAttempts = 10;

  console.info(
    `[IMAGE COMPRESSION] Starting compression: current=${currentSizeKB.toFixed(2)}KB, target=${targetSizeKB}KB, quality=${quality}`,
  );

  while (
    currentSizeKB > targetSizeKB &&
    attempts < maxAttempts &&
    quality > 10
  ) {
    // Reduce quality based on how far we are from target
    const ratio = targetSizeKB / currentSizeKB;
    const qualityReduction = Math.max(5, Math.floor((1 - ratio) * 20));
    quality = Math.max(10, quality - qualityReduction);

    console.info(
      `[IMAGE COMPRESSION] Attempt ${attempts + 1}: quality=${quality}, ratio=${ratio.toFixed(2)}`,
    );

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      const imageDataUrl = `data:image/jpeg;base64,${currentBuffer.toString("base64")}`;

      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imageDataUrl}" />
          </body>
        </html>
      `);

      await page.waitForSelector("img");

      const screenshot = await page.screenshot({
        type: "jpeg",
        quality,
        fullPage: true,
      });

      await browser.close();

      currentBuffer = Buffer.from(screenshot);
      currentSizeKB = currentBuffer.length / 1024;
      attempts++;

      console.info(
        `[IMAGE COMPRESSION] Result: ${currentSizeKB.toFixed(2)}KB (target: ${targetSizeKB}KB)`,
      );
    } catch (error) {
      console.error(
        `[IMAGE COMPRESSION] Compression attempt ${attempts + 1} failed:`,
        error,
      );
      break;
    }
  }

  if (currentSizeKB > targetSizeKB) {
    console.warn(
      `[IMAGE COMPRESSION] Could not reach target size. Final: ${currentSizeKB.toFixed(2)}KB, Target: ${targetSizeKB}KB`,
    );
  } else {
    console.info(
      `[IMAGE COMPRESSION] Successfully compressed to ${currentSizeKB.toFixed(2)}KB (target: ${targetSizeKB}KB)`,
    );
  }

  return currentBuffer;
}

/**
 * Main conversion function that handles any file type
 */
export async function convertToJpg(
  file: Express.Multer.File,
  options?: ImageConversionOptions,
): Promise<ConversionResult> {
  console.info(
    `[IMAGE CONVERSION] Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${(file.size / 1024).toFixed(2)}KB`,
  );

  try {
    // Handle PDF files
    if (file.mimetype === "application/pdf") {
      return await convertPdfToJpg(file.buffer, options);
    }

    // Handle image files
    if (file.mimetype.startsWith("image/")) {
      return await convertImageToJpg(file.buffer, file.mimetype, options);
    }

    throw new ApiError(400, `Unsupported file type: ${file.mimetype}`);
  } catch (error) {
    console.error("[IMAGE CONVERSION] Conversion failed:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "File conversion failed");
  }
}

/**
 * Document-specific conversion settings based on Annexure 9 requirements
 */
export const DocumentConversionSettings = {
  photo: {
    targetSizeKB: 100,
    quality: 85,
  },
  signature: {
    targetSizeKB: 100,
    quality: 85,
  },
  ageProof: {
    targetSizeKB: 250,
    quality: 80,
  },
  marksheet: {
    targetSizeKB: 250,
    quality: 80,
  },
  admissionForm: {
    targetSizeKB: 250,
    quality: 80,
  },
  admissionReceipt: {
    targetSizeKB: 250,
    quality: 80,
  },
  aadhaarCard: {
    targetSizeKB: 250,
    quality: 80,
  },
  apaarId: {
    targetSizeKB: 250,
    quality: 80,
  },
  parentPhotoId: {
    targetSizeKB: 250,
    quality: 80,
  },
  ewsCertificate: {
    targetSizeKB: 250,
    quality: 80,
  },
  default: {
    targetSizeKB: 250,
    quality: 80,
  },
} as const;

/**
 * Get conversion settings for a specific document type
 */
export function getDocumentConversionSettings(
  documentType: string,
): ImageConversionOptions {
  // Map document names to conversion settings keys
  const documentMapping: Record<
    string,
    keyof typeof DocumentConversionSettings
  > = {
    "class xii marksheet": "marksheet",
    "aadhaar card": "aadhaarCard",
    "apaar id card": "apaarId",
    "father photo id": "parentPhotoId",
    "mother photo id": "parentPhotoId",
    "ews certificate": "ewsCertificate",
    photo: "photo",
    signature: "signature",
    "admission form": "admissionForm",
    "admission receipt": "admissionReceipt",
  };

  const normalizedType = documentType.toLowerCase().trim();
  const key = documentMapping[normalizedType] || "default";

  console.info(
    `[IMAGE CONVERSION] Document type: "${documentType}" -> Key: "${key}"`,
  );

  return DocumentConversionSettings[key] || DocumentConversionSettings.default;
}
