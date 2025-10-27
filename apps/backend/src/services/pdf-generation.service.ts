import puppeteer, { Browser, Page } from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { QRCodeService } from "./qr-code.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to find Chromium executable path
async function findChromiumExecutable(): Promise<string | undefined> {
  const possiblePaths = [
    "/usr/bin/chromium-browser", // Ubuntu/Debian
    "/usr/bin/chromium", // Alternative Ubuntu/Debian
    "/usr/bin/google-chrome", // Google Chrome
    "/usr/bin/google-chrome-stable", // Google Chrome stable
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS Chrome
    "/Applications/Chromium.app/Contents/MacOS/Chromium", // macOS Chromium
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows Chrome
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", // Windows Chrome (x86)
  ];

  for (const executablePath of possiblePaths) {
    try {
      await fs.access(executablePath);
      console.log(`[PDF GENERATION] Found Chromium at: ${executablePath}`);
      return executablePath;
    } catch {
      // Path doesn't exist, continue to next
    }
  }

  console.warn(
    "[PDF GENERATION] No Chromium executable found, using default Puppeteer behavior",
  );
  return undefined;
}

export interface CuRegistrationFormData {
  // College Information
  collegeLogoUrl: string;
  collegeName: string;
  collegeAddress: string;
  collegeDetails1: string;
  collegeDetails2: string;

  // Student Basic Information
  studentName: string;
  studentUid: string;
  cuFormNumber: string;
  programCourseName: string;
  shiftName: string;
  studentPhotoUrl: string;

  // Rectification Banner
  showRectificationBanner: boolean;

  // Personal Information
  dateOfBirth: string;
  gender: string;
  parentName: string;
  categoryName: string;
  nationalityName: string;
  aadhaarCardNumber: string;
  religionName: string;
  annualIncome: string;
  pwdStatus: string;
  pwdCode?: string;
  ewsStatus: string;

  // Address Information
  residentialAddress: string;
  countryName: string;
  stateName: string;
  policeStationName: string;
  postOfficeName: string;
  cityName: string;
  pincode: string;

  // Academic Information
  boardName: string;
  yearOfPassing: string;
  apaarId: string;
  cuRegistrationNumber?: string;
  boardRollNumber: string;

  // Subject Details
  subjectDetails?: Array<{
    headers: string[];
    subjects: string[];
  }>;

  // Document filtering flags
  isIndian: boolean;
  isSCSTOBC: boolean;
  isPWD: boolean;
  isEWS: boolean;
  isForeignNational: boolean;
  hasCURegistration: boolean;

  // Form download date
  formDownloadDate: string;

  // Session information
  sessionName: string;

  // QR Code for application number
  qrCodeDataUrl?: string;

  // Debug fields
  photoUrlDebug?: string;
}

export class PdfGenerationService {
  private static instance: PdfGenerationService;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): PdfGenerationService {
    if (!PdfGenerationService.instance) {
      PdfGenerationService.instance = new PdfGenerationService();
    }
    return PdfGenerationService.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const executablePath = await findChromiumExecutable();

      const launchOptions: any = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      };

      // Only set executablePath if we found a valid Chromium installation
      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      this.browser = await puppeteer.launch(launchOptions);
    }
    return this.browser;
  }

  public async generateCuRegistrationPdf(
    formData: CuRegistrationFormData,
    outputPath: string,
  ): Promise<string> {
    try {
      console.info("[PDF GENERATION] Starting CU Registration PDF generation", {
        studentUid: formData.studentUid,
        outputPath,
      });

      // Generate QR code for application number if not provided
      if (!formData.qrCodeDataUrl && formData.cuFormNumber) {
        try {
          formData.qrCodeDataUrl =
            await QRCodeService.generateApplicationQRCode(
              formData.cuFormNumber,
            );
          console.info("[PDF GENERATION] QR code generated successfully", {
            applicationNumber: formData.cuFormNumber,
          });
        } catch (error) {
          console.warn(
            "[PDF GENERATION] Failed to generate QR code, continuing without it:",
            error,
          );
        }
      }

      // Read the EJS template
      const templatePath = path.join(
        __dirname,
        "../templates/cu-registration-form.ejs",
      );
      const templateContent = await fs.readFile(templatePath, "utf-8");

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get browser instance
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set content and wait for resources to load
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Generate PDF with specific settings for A4 format
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.3cm",
          right: "0.3cm",
          bottom: "0.3cm",
          left: "0.3cm",
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write PDF to file
      await fs.writeFile(outputPath, pdfBuffer);

      await page.close();

      console.info("[PDF GENERATION] PDF generated successfully", {
        outputPath,
        fileSize: pdfBuffer.length,
      });

      return outputPath;
    } catch (error) {
      console.error("[PDF GENERATION] Error generating PDF:", error);
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async generateCuRegistrationPdfWithNaming(
    formData: CuRegistrationFormData,
    applicationNumber: string,
    baseOutputDir: string = "./uploads/cu-registration-pdfs",
  ): Promise<string> {
    const fileName = `CU_${applicationNumber}.pdf`;
    const outputPath = path.join(baseOutputDir, fileName);

    return await this.generateCuRegistrationPdf(formData, outputPath);
  }

  public async generateCuRegistrationPdfBuffer(
    formData: CuRegistrationFormData,
  ): Promise<Buffer> {
    try {
      console.info(
        "[PDF GENERATION] Starting CU Registration PDF generation in memory",
        {
          studentUid: formData.studentUid,
        },
      );

      // Generate QR code for application number if not provided
      if (!formData.qrCodeDataUrl && formData.cuFormNumber) {
        try {
          formData.qrCodeDataUrl =
            await QRCodeService.generateApplicationQRCode(
              formData.cuFormNumber,
            );
          console.info("[PDF GENERATION] QR code generated successfully", {
            applicationNumber: formData.cuFormNumber,
          });
        } catch (error) {
          console.warn(
            "[PDF GENERATION] Failed to generate QR code, continuing without it:",
            error,
          );
        }
      }

      // Read the EJS template
      const templatePath = path.join(
        __dirname,
        "../templates/cu-registration-form.ejs",
      );
      const templateContent = await fs.readFile(templatePath, "utf-8");

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get browser instance
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set content and wait for resources to load
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
      });

      // Generate PDF buffer
      const pdfUint8Array = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.3in",
          right: "0.3in",
          bottom: "0.3in",
          left: "0.3in",
        },
      });

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      await page.close();

      console.info("[PDF GENERATION] PDF generated successfully in memory", {
        bufferSize: pdfBuffer.length,
        studentUid: formData.studentUid,
      });

      return pdfBuffer;
    } catch (error) {
      console.error("[PDF GENERATION] PDF generation failed:", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const pdfGenerationService = PdfGenerationService.getInstance();
