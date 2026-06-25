import "dotenv/config";
import path from "path";
import type { StringValue } from "ms";
import cors from "cors";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import express, { Request, Response } from "express";
import { Strategy } from "passport-google-oauth20";
import passport from "passport";
import { db } from "./db/index.js";
import { eq, ilike } from "drizzle-orm";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { corsOptions } from "@/config/corsOptions.js";
import {
  getRedisPubSubClients,
  getSessionStore,
  isRedisEnabled,
} from "@/config/redis.js";
import { socketService } from "./services/socketService.js";
import settingsRouter from "@/features/apps/routes/settings.route.js";
import { errorHandler, logger } from "@/middlewares/index.js";
import { districtModel } from "@repo/db/schemas/models/resources/district.model.js";
import { cityModel } from "@repo/db/schemas/models/resources/city.model.js";
import { stateModel } from "@repo/db/schemas/models/resources/state.model.js";
import { policeStationModel } from "@repo/db/schemas/models/user/police-station.model.js";
import { postOfficeModel } from "@repo/db/schemas/models/user/post-office.model.js";

import { generateToken } from "./utils/index.js";
import userStatusOverviewRouter from "@/features/user/routes/user-status-overview.routes.js";
// import studyMaterialRouter from "@/features/academics/routes/study-material.route.js";
import {
  academicYearRouter,
  batchStudentMappingRouter,
  classRouter,
  marksheetPaperComponentMappingRouter,
  marksheetPaperMappingRouter,
  promotionRouter,
  sectionRoutes,
  sessionRouter,
  shiftRouter,
  careerProgressionFormFieldRouter,
  careerProgressionFormRouter,
  certificateFieldMasterRouter,
  certificateFieldOptionMasterRouter,
  certificateMasterRouter,
  academicActivityRouter,
  academicActivityMasterRouter,
} from "@/features/academics/routes/index.js";
import { User, userModel } from "@repo/db/schemas/models/user";
import boardResultStatusRouter from "./features/resources/routes/boardResultStatus.routes.js";
import {
  accommodationRouter,
  addonRouter,
  addressRouter,
  authRouter,
  batchRouter,
  bloodGroupRouter,
  boardUniversityRouter,
  categoryRouter,
  cityRouter,
  countryRouter,
  degreeRouter,
  // departmentRouter,
  // designationRouter,
  documentRouter,
  emergencyContactRouter,
  examScheduleRouter,
  examTypeRouter,
  familyRouter,
  feeCategoryRouter,
  feeGroupPromotionMappingRouter,
  feeHeadRouter,
  feeSlabRouter,
  feeStructureComponentRouter,
  floorRouter,
  healthRouter,
  institutionRouter,
  languageMediumRouter,
  marksheetRouter,
  nationalityRouter,
  occupationRouter,
  personalDetailsRouter,
  personRouter,
  qualificationRouter,
  religionRouter,
  reportRouter,
  roomRouter,
  specializationRouter,
  stateRouter,
  studentApaarUpdateRouter,
  studentRouter,
  // subDepartmentRouter,
  transportRouter,
  designationRouter,
  sessionStatusRouter,
  userStatusMasterRouter,
  accessGroupRouter,
  accessGroupApplicationRouter,
  accessGroupDesignationRouter,
  accessGroupModulePermissionRouter,
  accessGroupModuleProgramCourseRouter,
  accessGroupModuleRouter,
  accessGroupUserTypeRouter,
  appModuleRouter,
  departmentRouter,
  identityMasterRouter,
  institutionalRoleRouter,
  userTypeRouter,
  userRouter,
  // userStatusMasterDomainRouter,
  // userStatusMasterFrequencyRouter,
  // userStatusMasterLevelRouter,
  // userStatusMasterRouter
} from "@/features/index.js";
import instalmentRouter from "@/features/fees/routes/instalment.route.js";
import receiptTypeRouter from "@/features/fees/routes/receipt-type.route.js";
import feeStudentMappingRouter from "@/features/fees/routes/fee-student-mapping.route.js";
import feeReceiptRouter from "@/features/fees/routes/fee-receipt.route.js";
import feesDashboardRouter from "@/features/fees/routes/fees-dashboard.route.js";
import realtimeTrackerRouter from "@/features/realtime-tracker/routes/realtime-tracker.routes.js";
import idCardRouter from "@/features/idcard/routes/id-card.routes.js";
import feesStructureRouter from "@/features/fees/routes/fees-structure.route.js";
import {
  promotionBuilderRouter,
  promotionClauseRouter,
  promotionRosterRouter,
  promotionStatusRouter,
} from "@/features/batches/routes/index.js";

import { annualIncomeRouter } from "./features/resources/routes/index.js";
import {
  districtRouter,
  policeStationRouter,
  postOfficeRouter,
  pickupPointRouter,
} from "./features/resources/routes/index.js";
import disabilityCodeRouter from "./features/user/routes/disabilityCode.route.js";
import courseRouter from "@/features/course-design/routes/course.routes.js";

// import feesStructureRouter from "./features/fees/routes/fees-structure.route.js";
// import studentFeesMappingRouter from "./features/fees/routes/student-fees-mapping.route.js";
import feesRouter from "./features/fees/routes/index.js";
import paymentRouter from "@/features/payments/routes/payment.route.js";
import {
  academicSubjectRouter,
  admissionAcademicInfoRouter,
  admissionAdditionalInfoRouter,
  admissionCourseApplicationRouter,
  admissionCourseRouter,
  admissionGeneralInfoRouter,
  admissionRouter,
  applicationFormRouter,
  boardRouter,
  boardSubjectNameRouter,
  boardSubjectRouter,
  boardSubjectUnivSubjectMappingRouter,
  cuRegistrationCorrectionRequestRouter,
  cuRegistrationDocumentUploadRouter,
  cuRegistrationPdfRouter,
  sportsCategoryRouter,
  sportsInfoRouter,
  studentAcademicSubjectRouter,
} from "@/features/admissions/index.js";
import bulkUploadRouter from "@/features/common/routes/bulkUpload.routes.js";
import bulkDataUploadsRouter from "@/features/bulk-data-uploads/routes/bulk-data-upload.route.js";
import {
  affiliationRouter,
  cascadingDropdownsRouter,
  courseLevelRouter,
  courseTypeRouter,
  examComponentRouter,
  paperRouter,
  programCourseRouter,
  regulationTypeRouter,
  streamRouter,
  subjectGroupingMainRouter,
  subjectGroupingProgramCourseRouter,
  subjectGroupingSubRouter,
  subjectRouter,
  subjectTypeRouter,
  topicRouter,
} from "@/features/course-design/routes/index.js";
import {
  dynamicSubjectsRoutes,
  relatedSubjectMainRoutes,
  relatedSubjectSubRoutes,
  restrictedGroupingClassRoutes,
  restrictedGroupingMainRoutes,
  restrictedGroupingProgramCourseRoutes,
  restrictedGroupingSubjectRoutes,
  studentSubjectSelectionRoutes,
  studentSubjectsRoutes,
  subjectSelectionMetaClassRoutes,
  subjectSelectionMetaRoutes,
  subjectSelectionMetaStreamRoutes,
  subjectSpecificPassingRoutes,
} from "@/features/subject-selection/routes/index.js";
// import { userStatusMappingRouter } from "./features/user/routes/index.js";
import {
  admitCardRouter,
  examGroupRouter,
} from "./features/exams/routes/index.js";
import libraryEntryExitRouter from "@/features/library/routes/library-entry-exit.route.js";
import bookCirculationRouter from "@/features/library/routes/book-circulation.route.js";
import journalRouter from "@/features/library/routes/journal.route.js";
import copyDetailsRouter from "@/features/library/routes/copy-details.route.js";
import bookRouter from "@/features/library/routes/book.route.js";
import shelfRouter from "@/features/library/routes/shelf.route.js";
import rackRouter from "@/features/library/routes/rack.route.js";
import statusRouter from "@/features/library/routes/status.route.js";
import journalTypeRouter from "@/features/library/routes/journal-type.route.js";
import libraryArticleRouter from "@/features/library/routes/library-article.route.js";
import libraryDocumentTypeRouter from "@/features/library/routes/library-document-type.route.js";
import bindingRouter from "@/features/library/routes/binding.route.js";
import borrowingTypeRouter from "@/features/library/routes/borrowing-type.route.js";
import enclosureRouter from "@/features/library/routes/enclosure.route.js";
import entryModeRouter from "@/features/library/routes/entry-mode.route.js";
import libraryPeriodRouter from "@/features/library/routes/library-period.route.js";
import seriesRouter from "@/features/library/routes/series.route.js";
import publisherRouter from "@/features/library/routes/publisher.route.js";
import authorTypeRouter from "@/features/library/routes/author-type.route.js";
import authorRouter from "@/features/library/routes/author.route.js";
import vendorRouter from "@/features/library/routes/vendor.route.js";
import holidayRouter from "@/features/library/routes/holiday.route.js";
import classHolidayRouter from "@/features/library/routes/class-holiday.route.js";
import authorDetailRouter from "@/features/library/routes/author-detail.route.js";
import branchRouter from "@/features/library/routes/branch.route.js";
import patronCategoryRouter from "@/features/library/routes/patron-category.route.js";
import itemCategoryRouter from "@/features/library/routes/item-category.route.js";
import circulationPolicyRouter from "@/features/library/routes/circulation-policy.route.js";
import journalSubscriptionRouter from "@/features/library/routes/journal-subscription.route.js";
import libraryZoneRouter from "@/features/library/routes/library-zone.route.js";
import readingListRouter from "@/features/library/routes/reading-list.route.js";
import libraryDashboardRouter from "@/features/library/routes/library-dashboard.route.js";
import libraryClearanceRouter from "@/features/library/routes/library-clearance.route.js";
import libraryFinePaymentRouter from "@/features/library/routes/library-fine-payment.route.js";
import libraryFloorPlanRouter from "@/features/library/routes/library-floor-plan.route.js";
import librarySearchRouter from "@/features/library/routes/library-search.route.js";
import academicArchiveRouter from "@/features/library/routes/academic-archive.route.js";
import cdlRouter from "@/features/library/routes/cdl.route.js";
import evidenceDocRouter from "@/features/library/routes/evidence-doc.route.js";
import studentLibraryAnalyticsRouter from "@/features/library/routes/student-library-analytics.route.js";
import libraryReportsRouter from "@/features/library/routes/library-reports.route.js";
import libraryNotificationSeedRouter from "@/features/library/routes/library-notification-seed.route.js";

// import { courseRouter } from "@/features/academics/routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);

// Enable trust proxy for production (behind reverse proxy like nginx)
// Only enable in production environment to avoid issues in staging
if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "staging"
) {
  // Trust first proxy (nginx) in production
  app.set("trust proxy", 1);
} else {
  // In development, don't trust proxy to avoid rate limiting bypass
  app.set("trust proxy", false);
}

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: "1gb" }));

app.use(express.urlencoded({ extended: true, limit: "1gb" }));

app.use(cookieParser());

// Liveness probe for the ALB target group (no auth; /api/health is the
// student health-records feature, not a status endpoint).
app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

// Setup Socket.IO with CORS - allow both main console and student console
const allowedSocketOrigins = [
  "http://localhost:5173", // Main console
  "http://localhost:3000", // Student console
  "http://localhost:3008", // Student console (production port)
  "https://stage.academic360.app", // Staging main console
  "https://academic360.app", // Production main console
  "https://besc.academic360.app", // Production main console (alternative)
  // CORS_ORIGIN supports a comma-separated list of origins
  ...(process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

export const io = new Server(httpServer, {
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedSocketOrigins.some((allowed) => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const redisPubSub = getRedisPubSubClients();
if (redisPubSub) {
  io.adapter(createAdapter(redisPubSub.pubClient, redisPubSub.subClient));
  console.info("[backend] Socket.IO Redis adapter enabled");
} else if (isRedisEnabled()) {
  console.warn(
    "[backend] REDIS_URL is set but Redis clients are unavailable — Socket.IO running single-node",
  );
}

// Initialize the socket service with our io instance
socketService.initialize(io);

const isProductionLike =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";

app.use(
  expressSession({
    secret:
      process.env.SESSION_SECRET?.trim() ||
      process.env.ACCESS_TOKEN_SECRET ||
      "secret",
    resave: false,
    saveUninitialized: false,
    store: getSessionStore() ?? undefined,
    cookie: {
      secure: isProductionLike,
      sameSite: isProductionLike ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// Internal proxy to notification-system (minimal without extra deps)
const NOTIFICATION_SYSTEM_URL =
  process.env.NOTIFICATION_SYSTEM_URL ||
  `http://localhost:${process.env.NOTIFICATION_SYSTEM_PORT || 8080}`;
console.log("[backend] proxy target:", NOTIFICATION_SYSTEM_URL);
app.use("/internal/notifications", async (req: Request, res: Response) => {
  try {
    const upstreamPath = req.originalUrl.replace(
      /^\/internal\/notifications/,
      "",
    );
    const url = `${NOTIFICATION_SYSTEM_URL}${upstreamPath}`;
    console.log("[backend] proxy ->", { method: req.method, url });
    const method = req.method.toUpperCase();
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers[k] = v;
    }
    delete headers["host"];
    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody ? JSON.stringify(req.body ?? {}) : undefined;
    const upstream = await fetch(url, {
      method,
      headers: {
        ...headers,
        "content-type": headers["content-type"] || "application/json",
      },
      body,
    } as any);
    console.log("[backend] proxy <-", upstream.status);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e: any) {
    res.status(502).json({ ok: false, error: String(e).slice(0, 500) });
  }
});

app.use(passport.initialize());

app.use(passport.session());

app.use("/", express.static(path.join(__dirname, "..", "public")));

// Explicitly serve app-module images (same path as saveAppModuleImage uses)
const appModuleImageBase = path.resolve(
  process.env.APP_MODULE_IMAGE_BASE_PATH ?? "./public/app-module-images",
);
app.use("/app-module-images", express.static(appModuleImageBase));

// Serve CU registration documents from the configured path
const cuRegAppPath = process.env.CU_REGISTRATION_APP_PATH;
if (cuRegAppPath) {
  app.use("/uploads", express.static(cuRegAppPath));
  console.info(
    `[STATIC FILES] Serving CU registration documents from: ${cuRegAppPath}`,
  );
} else {
  // Fallback to default uploads directory
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  console.warn(
    "[STATIC FILES] CU_REGISTRATION_APP_PATH not set, using default uploads directory",
  );
}

app.get("^/$|/index(.html)?", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL!}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("in passport.use, req.url", profile);
      try {
        // Here, check if the user exists in the database using the email from the profile
        if (!profile.emails || profile.emails.length === 0) {
          return done(null, false, { message: "No email found in profile!" });
        }
        console.log(profile);
        const [foundUser] = await db
          .select()
          .from(userModel)
          .where(eq(userModel.email, profile.emails[0].value as string));
        if (!foundUser) {
          // If user doesn't exist, return failure
          return done(null, false, { message: "User not found!" });
        }
        const savedUser = await db
          .update(userModel)
          .set({
            image: profile.photos ? profile.photos[0].value : "",
          })
          .where(eq(userModel.id, foundUser.id))
          .returning();

        // console.log("Saved user: ", savedUser);

        const accessToken = generateToken(
          { id: foundUser.id, type: foundUser.type as User["type"] },
          process.env.ACCESS_TOKEN_SECRET!,
          process.env.ACCESS_TOKEN_EXPIRY! as StringValue,
        );

        const refreshToken = generateToken(
          { id: foundUser.id, type: foundUser.type as User["type"] },
          process.env.REFRESH_TOKEN_SECRET!,
          process.env.REFRESH_TOKEN_EXPIRY! as StringValue,
        );

        // Redirect to the success URL with tokens
        return done(null, foundUser, { accessToken, refreshToken });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// Serialize and deserialize user for session handling
passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((user: Express.User, done) => done(null, user));

app.use("/auth", authRouter);

app.use("/api/batches", batchRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/academics/batch-student-mappings", batchStudentMappingRouter);
app.use("/api/academics/marksheet-paper-mappings", marksheetPaperMappingRouter);
app.use(
  "/api/academics/marksheet-paper-component-mappings",
  marksheetPaperComponentMappingRouter,
);

// app.use("/api/batch-papers/old-data", batchPaperRouter);

app.use("/api/users", userRouter);

app.use("/api/user-statuses", userStatusOverviewRouter);

// User status master endpoints
app.use("/api/administration/user-status-masters", userStatusMasterRouter);
app.use("/api/administration/app-modules", appModuleRouter);
// // User status master level endpoints
// app.use("/api/user-status-master-levels", userStatusMasterLevelRouter);
// // User status master domain endpoints
// app.use("/api/user-status-master-domains", userStatusMasterDomainRouter);
// // User status master frequency endpoints
// app.use("/api/user-status-master-frequencies", userStatusMasterFrequencyRouter);
app.use("/api/sessions", sessionRouter);

app.use(
  "/api/academics/career-progression-form-fields",
  careerProgressionFormFieldRouter,
);

app.use("/api/academics/career-progression-forms", careerProgressionFormRouter);
app.use("/api/academics/academic-activities", academicActivityRouter);
app.use(
  "/api/academics/academic-activity-masters",
  academicActivityMasterRouter,
);

app.use("/api/academics/certificate-masters", certificateMasterRouter);

app.use(
  "/api/academics/certificate-field-masters",
  certificateFieldMasterRouter,
);

app.use(
  "/api/academics/certificate-field-option-masters",
  certificateFieldOptionMasterRouter,
);

app.use("/api/personal-details", personalDetailsRouter);

app.use("/api/persons", personRouter);

app.use("/api/students", studentRouter);

// app.use("/api/subject-metadatas", subjectMetadataRouter);

app.use("/api/marksheets", marksheetRouter);

// app.use("/api/student-papers/", studentPaperRouter);

// app.use("/api/subjects", subjectRouter);

app.use("/api/nationality", nationalityRouter);

app.use("/api/religions", religionRouter);

app.use("/api/state", stateRouter);

app.use("/api/family", familyRouter);

app.use("/api/nationalities", nationalityRouter);

app.use("/api/countries", countryRouter);

app.use("/api/states", stateRouter);

app.use("/api/cities", cityRouter);

app.use("/api/documents", documentRouter);

app.use("/api/blood-groups", bloodGroupRouter);

app.use("/api/categories", categoryRouter);

app.use("/api/specializations", specializationRouter);

app.use("/api/languages", languageMediumRouter);

// app.use("/api/disability-codes", disabilityRouter);

app.use("/api/board-result-statuses", boardResultStatusRouter);

app.use("/api/board-universities", boardUniversityRouter);

app.use("/api/institutions", institutionRouter);

app.use("/api/qualifications", qualificationRouter);

app.use("/api/administration/departments", departmentRouter);
app.use("/api/administration/identity-masters", identityMasterRouter);
app.use("/api/administration/institutional-roles", institutionalRoleRouter);
app.use("/api/administration/designations", designationRouter);
app.use("/api/administration/session-statuses", sessionStatusRouter);

// app.use("/api/administration/sub-departments", subDepartmentRouter);
app.use("/api/administration/user-types", userTypeRouter);
app.use("/api/administration/access-groups", accessGroupRouter);
app.use(
  "/api/administration/access-group-applications",
  accessGroupApplicationRouter,
);
app.use(
  "/api/administration/access-group-designations",
  accessGroupDesignationRouter,
);
app.use("/api/administration/access-group-modules", accessGroupModuleRouter);
app.use(
  "/api/administration/access-group-module-permissions",
  accessGroupModulePermissionRouter,
);
app.use(
  "/api/administration/access-group-module-program-courses",
  accessGroupModuleProgramCourseRouter,
);
app.use(
  "/api/administration/access-group-user-types",
  accessGroupUserTypeRouter,
);

app.use("/api/address", addressRouter);

app.use("/api/transports", transportRouter);

app.use("/api/degree", degreeRouter);
//kjh
app.use("/api/emergency-contact", emergencyContactRouter);

app.use("/api/occupations", occupationRouter);

app.use("/api/annual-incomes", annualIncomeRouter);
app.use("/api/districts", districtRouter);
app.use("/api/police-stations", policeStationRouter);
app.use("/api/post-offices", postOfficeRouter);
app.use("/api/pickup-points", pickupPointRouter);
app.use("/api/disability-codes", disabilityCodeRouter);

app.use("/api/accommodations", accommodationRouter);

app.use("/api/health", healthRouter);

app.use("/api/reports", reportRouter);
app.use("/api/classes", classRouter);

// app.use("/api/fees/student-fees-mappings", studentFeesMappingRouter);
app.use("/api/v1/shifts", shiftRouter);
app.use("/api/v1/academics", academicYearRouter);
// Register specific routes BEFORE generic routes to avoid route conflicts
app.use("/api/v1/fees/dashboard", feesDashboardRouter);
app.use("/api/v1/realtime-tracker", realtimeTrackerRouter);
app.use("/api/v1/fees/structure", feesStructureRouter);

app.use("/api/v1/fees/structure-instalments", instalmentRouter);
app.use("/api/v1/fees/student-mappings", feeStudentMappingRouter);
app.use("/api/v1/fees/receipts", feeReceiptRouter);
app.use("/api/v1/batches/promotion-clauses", promotionClauseRouter);
app.use("/api/v1/batches/promotion-builders", promotionBuilderRouter);
app.use("/api/v1/batches/promotion-roster", promotionRosterRouter);
app.use("/api/v1/batches/promotion-statuses", promotionStatusRouter);
app.use("/api/v1/fees/receipt-types", receiptTypeRouter);
app.use("/api/v1/fees/addons", addonRouter);
app.use("/api/v1/fees/slabs", feeSlabRouter);
app.use("/api/v1/fees/heads", feeHeadRouter);
app.use("/api/v1/fees/components", feeStructureComponentRouter);
app.use("/api/v1/fees/categories", feeCategoryRouter);
app.use(
  "/api/v1/fees/group-promotion-mappings",
  feeGroupPromotionMappingRouter,
);
// app.use("/api/v1/fees/slab-year-mappings", feesSlabYearMappingRouter);
app.use("/api/v1/fees", feesRouter);
app.use("/api/v1/bulk-data-uploads", bulkDataUploadsRouter);
app.use("/api/v1/courses", courseRouter);
// app.use("/api/v1/fees/receipt-types", feesReceiptTypeRouter);
app.use("/api/exams/floors", floorRouter);
app.use("/api/exams/rooms", roomRouter);
app.use("/api/exams/exam-types", examTypeRouter);
app.use("/api/exams/schedule", examScheduleRouter);
app.use("/api/exam-groups", examGroupRouter);
app.use("/api/admit-card", admitCardRouter);

// Admissions routes - Mount specific routes before generic routes to avoid conflicts
app.use("/api/admissions/application-forms", applicationFormRouter);
app.use("/api/admissions/general-info", admissionGeneralInfoRouter);
app.use("/api/admissions/academic-info", admissionAcademicInfoRouter);
app.use("/api/admissions/additional-info", admissionAdditionalInfoRouter);
app.use("/api/admissions/courses", admissionCourseRouter);
app.use(
  "/api/admissions/course-applications",
  admissionCourseApplicationRouter,
);
app.use("/api/admissions/sports-category", sportsCategoryRouter);
app.use("/api/admissions/sports-info", sportsInfoRouter);
app.use(
  "/api/admissions/student-academic-subject",
  studentAcademicSubjectRouter,
);
app.use("/api/admissions/academic-subject", academicSubjectRouter);
app.use("/api/admissions/boards", boardRouter);
app.use("/api/admissions/board-subject-names", boardSubjectNameRouter);
app.use("/api/admissions/board-subjects", boardSubjectRouter);
app.use(
  "/api/admissions/board-subject-univ-subject-mappings",
  boardSubjectUnivSubjectMappingRouter,
);
app.use(
  "/api/admissions/cu-registration-correction-requests",
  cuRegistrationCorrectionRequestRouter,
);
app.use(
  "/api/admissions/cu-registration-document-uploads",
  cuRegistrationDocumentUploadRouter,
);
app.use("/api/admissions/cu-registration-pdf", cuRegistrationPdfRouter);
// Mount the generic admission router last to avoid conflicts with specific routes
app.use("/api/admissions", admissionRouter);

app.use("/api/payments", paymentRouter);
app.use("/api/library/entry-exit", libraryEntryExitRouter);
app.use("/api/library/book-circulation", bookCirculationRouter);
app.use("/api/library/journals", journalRouter);
app.use("/api/library/copy-details", copyDetailsRouter);
app.use("/api/library/books", bookRouter);
app.use("/api/library/shelves", shelfRouter);
app.use("/api/library/racks", rackRouter);
app.use("/api/library/statuses", statusRouter);
app.use("/api/library/journal-types", journalTypeRouter);
app.use("/api/library/articles", libraryArticleRouter);
app.use("/api/library/document-types", libraryDocumentTypeRouter);
app.use("/api/library/bindings", bindingRouter);
app.use("/api/library/borrowing-types", borrowingTypeRouter);
app.use("/api/library/enclosures", enclosureRouter);
app.use("/api/library/entry-modes", entryModeRouter);
app.use("/api/library/periods", libraryPeriodRouter);
app.use("/api/library/series", seriesRouter);
app.use("/api/library/publishers", publisherRouter);
app.use("/api/library/author-types", authorTypeRouter);
app.use("/api/library/authors", authorRouter);
app.use("/api/library/vendors", vendorRouter);
app.use("/api/library/holidays", holidayRouter);
app.use("/api/library/class-holidays", classHolidayRouter);
app.use("/api/library/branches", branchRouter);
app.use("/api/library/patron-categories", patronCategoryRouter);
app.use("/api/library/item-categories", itemCategoryRouter);
app.use("/api/library/circulation-policies", circulationPolicyRouter);
app.use("/api/library/journal-subscriptions", journalSubscriptionRouter);
app.use("/api/library/zones", libraryZoneRouter);
app.use("/api/library/reading-lists", readingListRouter);
app.use("/api/library/dashboard", libraryDashboardRouter);
app.use("/api/library/clearance", libraryClearanceRouter);
app.use("/api/library/fines", libraryFinePaymentRouter);
app.use("/api/library/floor-plans", libraryFloorPlanRouter);
app.use("/api/library/search", librarySearchRouter);
app.use("/api/library/academic-archives", academicArchiveRouter);
app.use("/api/library/cdl", cdlRouter);
app.use("/api/library/evidence-docs", evidenceDocRouter);
app.use("/api/library/student-analytics", studentLibraryAnalyticsRouter);
app.use("/api/library/reports", libraryReportsRouter);
app.use("/api/library/notifications", libraryNotificationSeedRouter);
app.use("/api/library", authorDetailRouter);

// app.use("/api/study-materials", studyMaterialRouter);

app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/settings", settingsRouter);

// Course Design routes
app.use("/api/v1/course-design/streams", streamRouter);
app.use("/api/v1/course-design/course-types", courseTypeRouter);
app.use("/api/v1/course-design/course-levels", courseLevelRouter);
// app.use("/api/v1/course-design/affiliation-types", affiliationTypeRouter);
app.use("/api/v1/course-design/regulation-types", regulationTypeRouter);
app.use("/api/v1/course-design/program-courses", programCourseRouter);

app.use(errorHandler);

// Register course-design routes
app.use("/api/course-design/courses", courseRouter);
app.use("/api/course-design/subjects", subjectRouter);
// app.use("/api/course-design/subject-papers", subjectPaperRouter);
app.use("/api/course-design/subject-types", subjectTypeRouter);
app.use("/api/course-design/papers", paperRouter);
app.use("/api/course-design/topics", topicRouter);
app.use("/api/course-design/streams", streamRouter);
app.use("/api/course-design/affiliations", affiliationRouter);
app.use("/api/course-design/regulation-types", regulationTypeRouter);
app.use("/api/course-design/program-courses", programCourseRouter);
app.use("/api/course-design/course-types", courseTypeRouter);
app.use("/api/course-design/course-levels", courseLevelRouter);
app.use("/api/course-design/exam-components", examComponentRouter);
app.use("/api/course-design/specializations", specializationRouter);
app.use("/api/course-design/cascading-dropdowns", cascadingDropdownsRouter);
app.use("/api/course-design/subject-grouping-mains", subjectGroupingMainRouter);
app.use(
  "/api/course-design/subject-grouping-program-courses",
  subjectGroupingProgramCourseRouter,
);
app.use(
  "/api/course-design/subject-grouping-subjects",
  subjectGroupingSubRouter,
);

// Subject Selection routes
app.use(
  "/api/subject-selection/related-subject-mains",
  relatedSubjectMainRoutes,
);
app.use("/api/subject-selection/related-subject-subs", relatedSubjectSubRoutes);
app.use(
  "/api/subject-selection/restricted-grouping-mains",
  restrictedGroupingMainRoutes,
);
app.use(
  "/api/subject-selection/restricted-grouping-classes",
  restrictedGroupingClassRoutes,
);
app.use(
  "/api/subject-selection/restricted-grouping-subjects",
  restrictedGroupingSubjectRoutes,
);
app.use(
  "/api/subject-selection/restricted-grouping-program-courses",
  restrictedGroupingProgramCourseRoutes,
);
app.use(
  "/api/subject-selection/subject-specific-passings",
  subjectSpecificPassingRoutes,
);
app.use("/api/subject-selection/metas", subjectSelectionMetaRoutes);
app.use("/api/subject-selection/meta-classes", subjectSelectionMetaClassRoutes);
app.use(
  "/api/subject-selection/meta-streams",
  subjectSelectionMetaStreamRoutes,
);
app.use("/api/subject-selection", studentSubjectsRoutes);
app.use(
  "/api/subject-selection/student-subject-selection",
  studentSubjectSelectionRoutes,
);
app.use("/api/subject-selection/dynamic-subjects", dynamicSubjectsRoutes);

app.use("/api/bulk-upload", bulkUploadRouter);

app.use("/api/idcard", idCardRouter);

// Lightweight districts endpoint to support frontend dropdowns
app.get("/api/districts", async (req: Request, res: Response) => {
  try {
    const stateIdParam = req.query.stateId as string | undefined;
    const cityIdParam = req.query.cityId as string | undefined;

    const baseSelect = db
      .select({ id: districtModel.id, name: districtModel.name })
      .from(districtModel);

    let rows;
    if (stateIdParam) {
      rows = await db
        .select({ id: districtModel.id, name: districtModel.name })
        .from(districtModel)
        .innerJoin(cityModel, eq(districtModel.cityId, cityModel.id))
        .where(eq(cityModel.stateId, Number(stateIdParam)));
    } else if (cityIdParam) {
      rows = await baseSelect.where(
        eq(districtModel.cityId, Number(cityIdParam)),
      );
    } else {
      rows = await baseSelect;
    }
    res.json({ payload: rows });
  } catch (e) {
    console.error("Failed to fetch districts:", e);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

// Lightweight police stations endpoint
app.get("/api/police-stations", async (req: Request, res: Response) => {
  try {
    const stateIdParam = req.query.stateId as string | undefined;
    const stateNameParam = req.query.stateName as string | undefined;

    let rows: { id: number; name: string }[] = [];

    if (stateIdParam) {
      rows = await db
        .select({ id: policeStationModel.id, name: policeStationModel.name })
        .from(policeStationModel)
        .where(eq(policeStationModel.stateId, Number(stateIdParam)));
    } else if (stateNameParam) {
      const [state] = await db
        .select({ id: stateModel.id })
        .from(stateModel)
        .where(ilike(stateModel.name, stateNameParam));
      if (state?.id) {
        rows = await db
          .select({ id: policeStationModel.id, name: policeStationModel.name })
          .from(policeStationModel)
          .where(eq(policeStationModel.stateId, state.id));
      }
    } else {
      rows = await db
        .select({ id: policeStationModel.id, name: policeStationModel.name })
        .from(policeStationModel);
    }

    res.json({ payload: rows });
  } catch (e) {
    console.error("Failed to fetch police stations:", e);
    res.status(500).json({ message: "Failed to fetch police stations" });
  }
});

// Lightweight post offices endpoint
app.get("/api/post-offices", async (req: Request, res: Response) => {
  try {
    const stateIdParam = req.query.stateId as string | undefined;
    const stateNameParam = req.query.stateName as string | undefined;

    let rows: { id: number; name: string }[] = [];

    if (stateIdParam) {
      rows = await db
        .select({ id: postOfficeModel.id, name: postOfficeModel.name })
        .from(postOfficeModel)
        .where(eq(postOfficeModel.stateId, Number(stateIdParam)));
    } else if (stateNameParam) {
      const [state] = await db
        .select({ id: stateModel.id })
        .from(stateModel)
        .where(ilike(stateModel.name, stateNameParam));
      if (state?.id) {
        rows = await db
          .select({ id: postOfficeModel.id, name: postOfficeModel.name })
          .from(postOfficeModel)
          .where(eq(postOfficeModel.stateId, state.id));
      }
    } else {
      rows = await db
        .select({ id: postOfficeModel.id, name: postOfficeModel.name })
        .from(postOfficeModel);
    }

    res.json({ payload: rows });
  } catch (e) {
    console.error("Failed to fetch post offices:", e);
    res.status(500).json({ message: "Failed to fetch post offices" });
  }
});

app.all("*", (req: Request, res: Response) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "..", "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

export { app, httpServer };

app.use("/auth", authRouter);

app.use("/api/batches", batchRouter);

app.use("/api/academics/batch-student-mappings", batchStudentMappingRouter);

app.use("/api/academics/marksheet-paper-mappings", marksheetPaperMappingRouter);

app.use(
  "/api/academics/marksheet-paper-component-mappings",

  marksheetPaperComponentMappingRouter,
);

// app.use("/api/batch-papers/old-data", batchPaperRouter);

app.use("/api/users", userRouter);

app.use("/api/sessions", sessionRouter);

app.use("/api/personal-details", personalDetailsRouter);

app.use("/api/persons", personRouter);

app.use("/api/students", studentRouter);

app.use("/api/students", studentApaarUpdateRouter);

// app.use("/api/subject-metadatas", subjectMetadataRouter);

app.use("/api/marksheets", marksheetRouter);

// app.use("/api/student-papers/", studentPaperRouter);

// app.use("/api/subjects", subjectRouter);

app.use("/api/nationality", nationalityRouter);

app.use("/api/religions", religionRouter);

app.use("/api/state", stateRouter);

app.use("/api/family", familyRouter);

app.use("/api/nationalities", nationalityRouter);

app.use("/api/countries", countryRouter);

app.use("/api/states", stateRouter);

app.use("/api/cities", cityRouter);

app.use("/api/documents", documentRouter);

app.use("/api/blood-groups", bloodGroupRouter);

app.use("/api/categories", categoryRouter);

app.use("/api/specializations", specializationRouter);

app.use("/api/languages", languageMediumRouter);

// app.use("/api/disability-codes", disabilityRouter);

app.use("/api/board-result-statuses", boardResultStatusRouter);

app.use("/api/board-universities", boardUniversityRouter);

app.use("/api/institutions", institutionRouter);

app.use("/api/qualifications", qualificationRouter);

app.use("/api/address", addressRouter);

app.use("/api/transports", transportRouter);

app.use("/api/degree", degreeRouter);

//kjh

app.use("/api/emergency-contact", emergencyContactRouter);

app.use("/api/occupations", occupationRouter);

app.use("/api/annual-incomes", annualIncomeRouter);
app.use("/api/districts", districtRouter);
app.use("/api/police-stations", policeStationRouter);
app.use("/api/post-offices", postOfficeRouter);
app.use("/api/pickup-points", pickupPointRouter);
app.use("/api/disability-codes", disabilityCodeRouter);

app.use("/api/accommodations", accommodationRouter);

app.use("/api/health", healthRouter);

app.use("/api/reports", reportRouter);

app.use("/api/classes", classRouter);

// app.use("/api/fees/student-fees-mappings", studentFeesMappingRouter);

app.use("/api/v1/shifts", shiftRouter);

app.use("/api/v1/academics", academicYearRouter);

// app.use("/api/v1/fees/structure", feesStructureRouter);

// app.use("/api/v1/fees/slab-year-mappings", feesSlabYearMappingRouter);

// Register specific routes BEFORE generic routes to avoid route conflicts
app.use("/api/v1/fees/structure-instalments", instalmentRouter);
app.use("/api/v1/fees/student-mappings", feeStudentMappingRouter);
app.use("/api/v1/fees/receipts", feeReceiptRouter);
app.use("/api/v1/batches/promotion-clauses", promotionClauseRouter);
app.use("/api/v1/batches/promotion-builders", promotionBuilderRouter);
app.use("/api/v1/batches/promotion-statuses", promotionStatusRouter);
app.use("/api/v1/fees/heads", feeHeadRouter);
app.use("/api/v1/fees", feesRouter);

app.use("/api/v1/courses", courseRouter);

// app.use("/api/v1/fees/components", feesComponentRouter);

// app.use("/api/v1/fees/addons", addonRouter);

// app.use("/api/v1/fees/heads", feesHeadRouter);

// app.use("/api/v1/fees/receipt-types", feesReceiptTypeRouter);

// Admissions routes - Mount specific routes before generic routes to avoid conflicts

app.use("/api/admissions/application-forms", applicationFormRouter);

app.use("/api/admissions/general-info", admissionGeneralInfoRouter);

app.use("/api/admissions/academic-info", admissionAcademicInfoRouter);

app.use("/api/admissions/additional-info", admissionAdditionalInfoRouter);

app.use("/api/admissions/courses", admissionCourseRouter);

app.use(
  "/api/admissions/course-applications",

  admissionCourseApplicationRouter,
);

app.use("/api/admissions/sports-category", sportsCategoryRouter);

app.use("/api/admissions/sports-info", sportsInfoRouter);

app.use(
  "/api/admissions/student-academic-subject",

  studentAcademicSubjectRouter,
);

app.use("/api/admissions/academic-subject", academicSubjectRouter);

app.use("/api/admissions/boards", boardRouter);

app.use("/api/admissions/board-subject-names", boardSubjectNameRouter);

app.use("/api/admissions/board-subjects", boardSubjectRouter);

app.use(
  "/api/admissions/board-subject-univ-subject-mappings",

  boardSubjectUnivSubjectMappingRouter,
);
app.use(
  "/api/admissions/cu-registration-correction-requests",
  cuRegistrationCorrectionRequestRouter,
);
app.use(
  "/api/admissions/cu-registration-document-uploads",
  cuRegistrationDocumentUploadRouter,
);

// Mount the generic admission router last to avoid conflicts with specific routes

app.use("/api/admissions", admissionRouter);

// app.use("/api/study-materials", studyMaterialRouter);

app.use("/api/v1/sections", sectionRoutes);

app.use("/api/v1/settings", settingsRouter);

// Course Design routes

app.use("/api/v1/course-design/streams", streamRouter);

app.use("/api/v1/course-design/course-types", courseTypeRouter);

app.use("/api/v1/course-design/course-levels", courseLevelRouter);

// app.use("/api/v1/course-design/affiliation-types", affiliationTypeRouter);

app.use("/api/v1/course-design/regulation-types", regulationTypeRouter);

app.use("/api/v1/course-design/program-courses", programCourseRouter);

app.use(errorHandler);

// Register course-design routes

app.use("/api/course-design/courses", courseRouter);

app.use("/api/course-design/subjects", subjectRouter);

// app.use("/api/course-design/subject-papers", subjectPaperRouter);

app.use("/api/course-design/subject-types", subjectTypeRouter);

app.use("/api/course-design/papers", paperRouter);

app.use("/api/course-design/topics", topicRouter);

app.use("/api/course-design/streams", streamRouter);

app.use("/api/course-design/affiliations", affiliationRouter);

app.use("/api/course-design/regulation-types", regulationTypeRouter);

app.use("/api/course-design/program-courses", programCourseRouter);

app.use("/api/course-design/course-types", courseTypeRouter);

app.use("/api/course-design/course-levels", courseLevelRouter);

app.use("/api/course-design/exam-components", examComponentRouter);

app.use("/api/course-design/specializations", specializationRouter);

app.use("/api/course-design/cascading-dropdowns", cascadingDropdownsRouter);

// Subject Selection routes

app.use(
  "/api/subject-selection/related-subject-mains",

  relatedSubjectMainRoutes,
);

app.use("/api/subject-selection/related-subject-subs", relatedSubjectSubRoutes);

app.use(
  "/api/subject-selection/restricted-grouping-mains",

  restrictedGroupingMainRoutes,
);

app.use(
  "/api/subject-selection/restricted-grouping-classes",

  restrictedGroupingClassRoutes,
);

app.use(
  "/api/subject-selection/restricted-grouping-subjects",

  restrictedGroupingSubjectRoutes,
);

app.use(
  "/api/subject-selection/restricted-grouping-program-courses",

  restrictedGroupingProgramCourseRoutes,
);

app.use(
  "/api/subject-selection/subject-specific-passings",

  subjectSpecificPassingRoutes,
);

app.use("/api/subject-selection", studentSubjectsRoutes);

app.use("/api/bulk-upload", bulkUploadRouter);

// Lightweight districts endpoint to support frontend dropdowns

app.get("/api/districts", async (req: Request, res: Response) => {
  try {
    const stateIdParam = req.query.stateId as string | undefined;

    const cityIdParam = req.query.cityId as string | undefined;

    const baseSelect = db

      .select({ id: districtModel.id, name: districtModel.name })

      .from(districtModel);

    let rows;

    if (stateIdParam) {
      rows = await db

        .select({ id: districtModel.id, name: districtModel.name })

        .from(districtModel)

        .innerJoin(cityModel, eq(districtModel.cityId, cityModel.id))

        .where(eq(cityModel.stateId, Number(stateIdParam)));
    } else if (cityIdParam) {
      rows = await baseSelect.where(
        eq(districtModel.cityId, Number(cityIdParam)),
      );
    } else {
      rows = await baseSelect;
    }

    res.json({ payload: rows });
  } catch (e) {
    console.error("Failed to fetch districts:", e);

    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

app.all("*", (req: Request, res: Response) => {
  res.status(404);

  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "..", "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// duplicate export removed
