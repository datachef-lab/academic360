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
import { corsOptions } from "@/config/corsOptions.js";
import { socketService } from "./services/socketService.js";
import settingsRouter from "@/features/apps/routes/settings.route.js";
import { logger, errorHandler } from "@/middlewares/index.js";
import { districtModel } from "@repo/db/schemas/models/resources/district.model.js";
import { cityModel } from "@repo/db/schemas/models/resources/city.model.js";
import { stateModel } from "@repo/db/schemas/models/resources/state.model.js";
import { policeStationModel } from "@repo/db/schemas/models/user/police-station.model.js";
import { postOfficeModel } from "@repo/db/schemas/models/user/post-office.model.js";

import { generateToken } from "./utils/index.js";
import {
  academicYearRouter,
  classRouter,
  batchStudentMappingRouter,
  marksheetPaperMappingRouter,
  marksheetPaperComponentMappingRouter,
  sessionRouter,
} from "@/features/academics/routes/index.js";
import { userModel, User } from "@repo/db/schemas/models/user";
import boardResultStatusRouter from "./features/resources/routes/boardResultStatus.routes.js";
import {
  documentRouter,
  marksheetRouter,
  countryRouter,
  userRouter,
  authRouter,
  bloodGroupRouter,
  categoryRouter,
  cityRouter,
  languageMediumRouter,
  boardUniversityRouter,
  institutionRouter,
  qualificationRouter,
  transportRouter,
  studentRouter,
  studentApaarUpdateRouter,
  nationalityRouter,
  religionRouter,
  // academicHistoryRouter,
  // academicIdentifierRouter,
  accommodationRouter,
  stateRouter,
  degreeRouter,
  occupationRouter,
  batchRouter,
  emergencyContactRouter,
  addressRouter,
  reportRouter,
  specializationRouter,
  familyRouter,
  healthRouter,
  personalDetailsRouter,
  feesComponentRouter,
  addonRouter,
  feesHeadRouter,
  feesReceiptTypeRouter,
  feesSlabYearMappingRouter,
  personRouter,
} from "@/features/index.js";
import { annualIncomeRouter } from "./features/resources/routes/index.js";
import courseRouter from "@/features/course-design/routes/course.routes.js";
import { shiftRouter } from "@/features/academics/routes/index.js";
import feesSlabRouter from "@/features/fees/routes/index.js";
import feesStructureRouter from "./features/fees/routes/fees-structure.route.js";
import studentFeesMappingRouter from "./features/fees/routes/student-fees-mapping.route.js";
import feesRouter from "./features/fees/routes/index.js";
import {
  admissionRouter,
  applicationFormRouter,
  admissionGeneralInfoRouter,
  admissionAcademicInfoRouter,
  admissionAdditionalInfoRouter,
  admissionCourseRouter,
  admissionCourseApplicationRouter,
  sportsCategoryRouter,
  sportsInfoRouter,
  studentAcademicSubjectRouter,
  academicSubjectRouter,
  boardRouter,
  boardSubjectNameRouter,
  boardSubjectRouter,
  boardSubjectUnivSubjectMappingRouter,
  cuRegistrationCorrectionRequestRouter,
  cuRegistrationDocumentUploadRouter,
  cuRegistrationPdfRouter,
} from "@/features/admissions/index.js";
// import studyMaterialRouter from "@/features/academics/routes/study-material.route.js";
import { sectionRoutes } from "@/features/academics/routes/index.js";
import bulkUploadRouter from "@/features/common/routes/bulkUpload.routes.js";
import {
  streamRouter,
  courseTypeRouter,
  subjectRouter,
  paperRouter,
  topicRouter,
  affiliationRouter,
  courseLevelRouter,
  subjectTypeRouter,
  regulationTypeRouter,
  programCourseRouter,
  examComponentRouter,
  cascadingDropdownsRouter,
} from "@/features/course-design/routes/index.js";
import {
  relatedSubjectMainRoutes,
  relatedSubjectSubRoutes,
  restrictedGroupingMainRoutes,
  restrictedGroupingClassRoutes,
  restrictedGroupingSubjectRoutes,
  restrictedGroupingProgramCourseRoutes,
  subjectSpecificPassingRoutes,
  studentSubjectsRoutes,
  subjectSelectionMetaRoutes,
  subjectSelectionMetaClassRoutes,
  subjectSelectionMetaStreamRoutes,
  studentSubjectSelectionRoutes,
  dynamicSubjectsRoutes,
} from "@/features/subject-selection/routes/index.js";

// import { courseRouter } from "@/features/academics/routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);

// Enable trust proxy for production (behind reverse proxy like nginx)
// Only enable in production environment to avoid issues in staging

app.set("trust proxy", true);

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: "1gb" }));

app.use(express.urlencoded({ extended: true, limit: "1gb" }));

app.use(cookieParser());

// Setup Socket.IO with CORS
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN! || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize the socket service with our io instance
socketService.initialize(io);

app.use(
  expressSession({
    secret: process.env.ACCESS_TOKEN_SECRET || "secret", // Add a secret key here
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
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

app.use("/api/accommodations", accommodationRouter);

app.use("/api/health", healthRouter);

app.use("/api/reports", reportRouter);
app.use("/api/classes", classRouter);

app.use("/api/fees/student-fees-mappings", studentFeesMappingRouter);
app.use("/api/v1/shifts", shiftRouter);
app.use("/api/v1/academics", academicYearRouter);
app.use("/api/v1/fees/structure", feesStructureRouter);
app.use("/api/v1/fees/slab-year-mappings", feesSlabYearMappingRouter);
app.use("/api/v1/fees", feesRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/fees/components", feesComponentRouter);
app.use("/api/v1/fees/addons", addonRouter);
app.use("/api/v1/fees/heads", feesHeadRouter);
app.use("/api/v1/fees/receipt-types", feesReceiptTypeRouter);

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

app.use("/api/accommodations", accommodationRouter);

app.use("/api/health", healthRouter);

app.use("/api/reports", reportRouter);

app.use("/api/classes", classRouter);

app.use("/api/fees/student-fees-mappings", studentFeesMappingRouter);

app.use("/api/v1/shifts", shiftRouter);

app.use("/api/v1/academics", academicYearRouter);

app.use("/api/v1/fees/structure", feesStructureRouter);

app.use("/api/v1/fees/slab-year-mappings", feesSlabYearMappingRouter);

app.use("/api/v1/fees", feesRouter);

app.use("/api/v1/courses", courseRouter);

app.use("/api/v1/fees/components", feesComponentRouter);

app.use("/api/v1/fees/addons", addonRouter);

app.use("/api/v1/fees/heads", feesHeadRouter);

app.use("/api/v1/fees/receipt-types", feesReceiptTypeRouter);

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
