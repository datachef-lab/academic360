import puppeteer, { Browser } from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { QRCodeService } from "./qr-code.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to find Chromium executable path
async function findChromiumExecutable(): Promise<string | undefined> {
  // Prefer environment-provided executable path for server deployments
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) {
    try {
      await fs.access(envPath);
      console.log(`[PDF GENERATION] Using Chromium from env: ${envPath}`);
      return envPath;
    } catch {
      console.warn(
        `[PDF GENERATION] Env PUPPETEER_EXECUTABLE_PATH set but not accessible: ${envPath}`,
      );
    }
  }
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
  isRectificationDone?: boolean;
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
  boardCode?: string;
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

  // QR Code for physical registration (time and venue)
  physicalRegistrationQrCodeDataUrl?: string;
  physicalRegistrationTime?: string;
  physicalRegistrationVenue?: string;
  physicalRegistrationSubmissionDate?: string;
  noticeBoardQrUrl?: string;

  // Debug fields
  photoUrlDebug?: string;
}

// Cached templates to avoid disk reads per PDF
let cachedAdmitCardTemplate: string | null = null;
let cachedFeeReceiptTemplate: string | null = null;
let cachedCuRegistrationTemplate: string | null = null;
let cachedAttendanceSheetTemplate: string | null = null;

// Image cache (base64 data URLs)
const imageCache = new Map<string, string>();

const PAGE_POOL_SIZE = 2;

export class PdfGenerationService {
  private static instance: PdfGenerationService;
  private browser: Browser | null = null;
  private browserLaunchPromise: Promise<Browser> | null = null;
  private pagePool: any[] = [];
  private pagePoolReady = false;

  private constructor() {}

  public static getInstance(): PdfGenerationService {
    if (!PdfGenerationService.instance) {
      PdfGenerationService.instance = new PdfGenerationService();
    }
    return PdfGenerationService.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    if (this.browserLaunchPromise) return this.browserLaunchPromise;

    this.browserLaunchPromise = (async () => {
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
          "--disable-extensions",
          "--disable-plugins",
          "--disable-default-apps",
          "--disable-preconnect",
          "--disable-component-update",
          "--disable-sync",
        ],
      };

      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.browserLaunchPromise = null;

      // Initialize page pool in background
      this.initializePagePool().catch((err) =>
        console.warn("[PDF GENERATION] Failed to initialize page pool:", err),
      );

      return this.browser;
    })();

    return this.browserLaunchPromise;
  }

  private async initializePagePool(): Promise<void> {
    if (this.pagePoolReady || !this.browser) return;

    try {
      for (let i = 0; i < PAGE_POOL_SIZE; i++) {
        const page = await this.browser.newPage();

        // Enable request interception to block resources
        await page.setRequestInterception(true);

        // Block heavy external resources, but allow internal images
        page.on("request", (request) => {
          const resourceType = request.resourceType();
          const url = request.url();

          // Block external trackers and heavy CDNs
          if (
            resourceType === "stylesheet" ||
            resourceType === "font" ||
            url.includes("google-analytics") ||
            url.includes("analytics") ||
            url.includes("gtag") ||
            url.includes("doubleclick")
          ) {
            request.abort();
          } else {
            // Allow images from internal domains and other resources
            request.continue();
          }
        });

        this.pagePool.push(page);
      }
      this.pagePoolReady = true;
      console.info(
        "[PDF GENERATION] Page pool initialized with",
        PAGE_POOL_SIZE,
        "pages",
      );
    } catch (err) {
      console.error("[PDF GENERATION] Failed to initialize page pool:", err);
    }
  }

  private async getPageFromPool(): Promise<any> {
    if (!this.pagePoolReady) {
      // If pool not ready, create page on demand
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Enable request interception
      await page.setRequestInterception(true);

      page.on("request", (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        if (
          resourceType === "stylesheet" ||
          resourceType === "font" ||
          url.includes("google-analytics") ||
          url.includes("analytics") ||
          url.includes("gtag") ||
          url.includes("doubleclick")
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      return page;
    }

    // Return page from pool
    if (this.pagePool.length > 0) {
      return this.pagePool.pop();
    }

    // If pool empty, create new page
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      if (
        resourceType === "stylesheet" ||
        resourceType === "font" ||
        url.includes("google-analytics") ||
        url.includes("analytics") ||
        url.includes("gtag") ||
        url.includes("doubleclick")
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    return page;
  }

  private async loadImageAsBase64(url: string): Promise<string> {
    // Return cached image if available
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    try {
      // Fetch image with short timeout (internal domain should be fast)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Determine MIME type from response header
      const contentType = response.headers.get("content-type") || "image/png";
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Cache it
      imageCache.set(url, dataUrl);
      console.info(
        "[PDF GENERATION] Image cached:",
        url.substring(0, 50) + "...",
      );

      return dataUrl;
    } catch (error) {
      console.warn(
        "[PDF GENERATION] Failed to load image, using placeholder:",
        url,
        error,
      );
      // Return a small placeholder if image fails to load
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=";
    }
  }

  private returnPageToPool(page: any): void {
    if (this.pagePool.length < PAGE_POOL_SIZE) {
      this.pagePool.push(page);
    } else {
      page.close().catch(() => {});
    }
  }

  private async fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[PDF GENERATION] Failed to fetch image (${response.status}): ${url}`,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.warn(
        `[PDF GENERATION] Failed to fetch image, will use URL directly: ${url}`,
        error,
      );
      return null;
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    // Return cached template if available
    if (templateName === "admit-card" && cachedAdmitCardTemplate) {
      return cachedAdmitCardTemplate;
    }
    if (templateName === "fee-receipt" && cachedFeeReceiptTemplate) {
      return cachedFeeReceiptTemplate;
    }
    if (
      templateName === "cu-registration-form" &&
      cachedCuRegistrationTemplate
    ) {
      return cachedCuRegistrationTemplate;
    }
    if (
      templateName === "exam-attendance-dr-sheet" &&
      cachedAttendanceSheetTemplate
    ) {
      return cachedAttendanceSheetTemplate;
    }

    // Load from disk
    const templatePath = path.join(
      __dirname,
      `../templates/${templateName}.ejs`,
    );
    const content = await fs.readFile(templatePath, "utf-8");

    // Cache it
    if (templateName === "admit-card") {
      cachedAdmitCardTemplate = content;
    } else if (templateName === "fee-receipt") {
      cachedFeeReceiptTemplate = content;
    } else if (templateName === "cu-registration-form") {
      cachedCuRegistrationTemplate = content;
    } else if (templateName === "exam-attendance-dr-sheet") {
      cachedAttendanceSheetTemplate = content;
    }

    return content;
  }

  public async generateCuRegistrationPdf(
    formData: CuRegistrationFormData,
    outputPath: string,
  ): Promise<string> {
    const startTime = Date.now();
    let page: any = null;

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

      // Load template (cached)
      const templateContent = await this.loadTemplate("cu-registration-form");

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get page from pool
      page = await this.getPageFromPool();

      // Set content with short timeout
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 3000,
      });

      // Generate PDF with timeout
      const pdfBuffer = (await Promise.race([
        page.pdf({
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
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 5000),
        ),
      ])) as any;

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write PDF to file
      await fs.writeFile(outputPath, Buffer.from(pdfBuffer));

      const elapsedTime = Date.now() - startTime;
      console.info("[PDF GENERATION] PDF generated successfully", {
        outputPath,
        fileSize: Buffer.byteLength(pdfBuffer),
        elapsedMs: elapsedTime,
      });

      return outputPath;
    } catch (error) {
      console.error("[PDF GENERATION] Error generating PDF:", error);
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      if (page) {
        this.returnPageToPool(page);
      }
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
    const startTime = Date.now();
    let page: any = null;

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

      // Load template (cached)
      const templateContent = await this.loadTemplate("cu-registration-form");

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get page from pool
      page = await this.getPageFromPool();

      // Set content and wait for resources to load with timeout
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 3000,
      });

      // Generate PDF buffer with timeout to prevent hangs
      const pdfUint8Array = (await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.3in",
            right: "0.3in",
            bottom: "0.3in",
            left: "0.3in",
          },
          preferCSSPageSize: true,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 5000),
        ),
      ])) as any;

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      const elapsedTime = Date.now() - startTime;
      console.info("[PDF GENERATION] PDF generated successfully in memory", {
        bufferSize: pdfBuffer.length,
        studentUid: formData.studentUid,
        elapsedMs: elapsedTime,
      });

      return pdfBuffer;
    } catch (error) {
      console.error("[PDF GENERATION] PDF generation failed:", error);
      throw error;
    } finally {
      if (page) {
        this.returnPageToPool(page);
      }
    }
  }

  public async generateExamAdmitCardPdfBuffer(formData: {
    semester: string;
    examType: string;
    session: string;
    name: string;
    cuRollNumber: string | null;
    cuRegistrationNumber: string | null;
    uid: string;
    phone: string;
    programCourseName: string;
    shiftName: string;
    qrCodeDataUrl: string | null;
    examRows: Array<{
      date: string;
      time: string;
      room: string;
      seatNo: string;
      subjectName: string;
      subjectCode: string;
      componentNames?: string;
    }>;
    studentImage?: string;
  }): Promise<Buffer> {
    const startTime = Date.now();
    let page: any = null;

    try {
      console.info(
        "[PDF GENERATION] Starting Exam Form PDF generation in memory",
        {
          studentUid: formData.uid,
        },
      );

      // Pre-fetch external images as base64 data URLs to avoid network requests during rendering
      const studentImageUrl = `https://besc.academic360.app/id-card-generate/api/images?uid=${formData.uid}&crop=true`;
      const collegeLogoUrl = `https://besc.academic360.app/api/api/v1/settings/file/4`;

      const [studentImageDataUrl, collegeLogoDataUrl, qrCodeDataUrl] =
        await Promise.all([
          this.fetchImageAsDataUrl(studentImageUrl),
          this.fetchImageAsDataUrl(collegeLogoUrl),
          QRCodeService.generateApplicationQRCode(formData.uid).catch(
            (error) => {
              console.warn(
                "[PDF GENERATION] Failed to generate QR code, continuing without it:",
                error,
              );
              return formData.qrCodeDataUrl ?? "";
            },
          ),
        ]);

      formData.studentImage = studentImageDataUrl || studentImageUrl;
      (formData as any).collegeLogo = collegeLogoDataUrl || collegeLogoUrl;
      formData.qrCodeDataUrl = qrCodeDataUrl;

      console.info("[PDF GENERATION] Images pre-fetched", {
        studentImageEmbedded: !!studentImageDataUrl,
        collegeLogoEmbedded: !!collegeLogoDataUrl,
        qrCodeGenerated: !!qrCodeDataUrl,
      });

      // Load template (cached)
      const templateContent = await this.loadTemplate("admit-card");

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get page from pool
      page = await this.getPageFromPool();

      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 3000,
      });

      // Generate PDF buffer with timeout to prevent hangs
      const pdfUint8Array = (await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.3in",
            right: "0.3in",
            bottom: "0.3in",
            left: "0.3in",
          },
          preferCSSPageSize: true,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 5000),
        ),
      ])) as any;

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      const elapsedTime = Date.now() - startTime;
      console.info("[PDF GENERATION] PDF generated successfully in memory", {
        bufferSize: pdfBuffer.length,
        studentUid: formData.uid,
        elapsedMs: elapsedTime,
      });

      return pdfBuffer;
    } catch (error) {
      console.error("[PDF GENERATION] PDF generation failed:", error);
      throw error;
    } finally {
      if (page) {
        this.returnPageToPool(page);
      }
    }
  }

  public async generateExamAttendanceSheetPdfBuffer(formData: {
    semester: string;
    examType: string;
    session: string;
    roomNumber: string;
    examDates: string[];
    examTimings: string[];
    examPapersCodes: string[];
    examCandidates: Array<{
      name: string;
      identifier: string;
      seatNumber: string;
    }>;
    collegeLogo?: string;
  }): Promise<Buffer> {
    const startTime = Date.now();
    let page: any = null;

    try {
      console.info(
        "[PDF GENERATION] Starting Exam Attendance Sheet PDF generation in memory",
        formData.roomNumber,
      );

      // Embed logo as data URL to avoid missing image during puppeteer rendering
      const collegeLogoUrl = `https://besc.academic360.app/api/api/v1/settings/file/4`;
      const collegeLogoDataUrl = await this.fetchImageAsDataUrl(collegeLogoUrl);
      (formData as any).collegeLogo = collegeLogoDataUrl || collegeLogoUrl;

      // Load template (cached)
      const templateContent = await this.loadTemplate(
        "exam-attendance-dr-sheet",
      );

      // Render the template with data
      const htmlContent = ejs.render(templateContent, formData);

      // Get page from pool
      page = await this.getPageFromPool();

      // Set content and wait for resources to load with timeout
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 3000,
      });

      // Generate PDF buffer with timeout to prevent hangs
      const pdfUint8Array = (await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          landscape: true,
          preferCSSPageSize: true,
          margin: {},
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 5000),
        ),
      ])) as any;

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      const elapsedTime = Date.now() - startTime;
      console.info(
        "[PDF GENERATION] Attendance DR PDF generated successfully in memory",
        {
          bufferSize: pdfBuffer.length,
          elapsedMs: elapsedTime,
        },
      );

      return pdfBuffer;
    } catch (error) {
      console.error("[PDF GENERATION] PDF generation failed:", error);
      throw error;
    } finally {
      if (page) {
        this.returnPageToPool(page);
      }
    }
  }

  public async generateFeeReceiptPdfBuffer(formData: {
    session: string;
    pageTitle: string;
    name: string;
    uid: string;
    dob: string; // dd/mm/yyyy
    phone: string;
    semester: string;
    programCourse: string;
    shift: string;
    challanNumber: string;
    paidDate: string; // dd/mm/yyyy
    isPaid: boolean;
    mode: "online" | "offline";
    challanDate: string; // dd/mm/yyyy — immutable generation date
    ePaid?: null | {
      orderId: string;
      transactionDate: string; // dd/mm/yyyy
    };
    feeComponents: Array<{
      name: string;
      amount: string;
    }>;
    totalPayableAmount: string;
    totalPayableAmountInWords: string;
  }): Promise<Buffer> {
    const startTime = Date.now();
    let page: any = null;

    try {
      console.info(
        "[PDF GENERATION] Starting Fee Receipt PDF generation in memory",
        formData.uid,
      );

      // Load template (cached)
      const templateContent = await this.loadTemplate("fee-receipt");

      // Pre-load college logo as base64 to avoid network delays during PDF generation
      // This MUST be done before EJS rendering
      const collegeLogoUrl =
        "https://besc.academic360.app/api/api/v1/settings/file/4";
      const collegeLogoBase64 = await this.loadImageAsBase64(collegeLogoUrl);

      // Create a modified template that uses the injected base64 image
      const modifiedTemplateData = {
        ...formData,
        collegeLogoDataUrl: collegeLogoBase64,
        showSpecimenWatermark:
          process.env.NODE_ENV === "development" ||
          process.env.NODE_ENV === "staging",
      };

      // Render the template with data
      const htmlContent = ejs.render(templateContent, modifiedTemplateData);

      // Get page from pool (much faster than creating new)
      page = await this.getPageFromPool();

      // Set content - skip waiting for external resources
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
        timeout: 2000,
      });

      // Render PDF immediately without waiting for anything
      const pdfUint8Array = (await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          landscape: true,
          preferCSSPageSize: true,
          margin: {
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 4000),
        ),
      ])) as any;

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      const elapsedTime = Date.now() - startTime;
      console.info("[PDF GENERATION] Fee Receipt PDF generated in memory", {
        bufferSize: pdfBuffer.length,
        elapsedMs: elapsedTime,
      });

      return pdfBuffer;
    } catch (error) {
      console.error("[PDF GENERATION] PDF generation failed:", error);
      throw error;
    } finally {
      // Return page to pool for reuse
      if (page) {
        this.returnPageToPool(page);
      }
    }
  }

  public async close(): Promise<void> {
    // Close all pooled pages
    for (const page of this.pagePool) {
      try {
        await page.close();
      } catch (err) {
        console.warn("[PDF GENERATION] Error closing pooled page:", err);
      }
    }
    this.pagePool = [];
    this.pagePoolReady = false;

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// function chunkArray<T>(array: T[], size: number): T[][] {
//   const chunks: T[][] = [];
//   for (let i = 0; i < array.length; i += size) {
//     chunks.push(array.slice(i, i + size));
//   }
//   return chunks;
// }

// Export singleton instance
export const pdfGenerationService = PdfGenerationService.getInstance();
