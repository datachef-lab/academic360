import puppeteer, { Browser, Page } from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      this.browser = await puppeteer.launch({
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
      });
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
          top: "0.5cm",
          right: "0.5cm",
          bottom: "0.5cm",
          left: "0.5cm",
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

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const pdfGenerationService = PdfGenerationService.getInstance();
