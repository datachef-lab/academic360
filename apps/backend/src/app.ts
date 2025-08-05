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
import { eq } from "drizzle-orm";
import { createServer } from "http";
import { Server } from "socket.io";
import { corsOptions } from "@/config/corsOptions.js";
import { socketService } from "./services/socketService.js";

import { logger, errorHandler } from "@/middlewares/index.js";

import { generateToken } from "./utils/index.js";
import {
  academicYearRouter,
  classRouter,
  batchStudentMappingRouter,
  marksheetPaperMappingRouter,
  marksheetPaperComponentMappingRouter,
  sessionRouter,
} from "@/features/academics/routes/index.js";
import { userModel, User } from "./features/user/models/user.model.js";
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
  nationalityRouter,
  religionRouter,
  academicHistoryRouter,
  academicIdentifierRouter,
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
} from "@/features/admissions/index.js";
// import studyMaterialRouter from "@/features/academics/routes/study-material.route.js";
import { sectionRoutes } from "@/features/academics/routes/index.js";
import {
  streamRouter,
  courseTypeRouter,
  subjectRouter,
  paperRouter,
  topicRouter,
  affiliationRouter,
  courseLevelRouter,
  subjectTypeRouter,
  affiliationTypeRouter,
  regulationTypeRouter,
  programCourseRouter,
  examComponentRouter,
  cascadingDropdownsRouter,
} from "@/features/course-design/routes/index.js";

// import { courseRouter } from "@/features/academics/routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: "180kb" }));

app.use(express.urlencoded({ extended: true, limit: "180kb" }));

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

app.use(passport.initialize());

app.use(passport.session());

app.use("/", express.static(path.join(__dirname, "..", "public")));

app.get("^/$|/index(.html)?", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:8080/auth/google/callback",
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
        const savedUser = await db
          .update(userModel)
          .set({
            image: profile.photos ? profile.photos[0].value : "",
          })
          .where(eq(userModel.id, foundUser.id))
          .returning();

        // console.log("Saved user: ", savedUser);

        if (!foundUser) {
          // If user doesn't exist, return failure
          return done(null, false, { message: "User not found!" });
        }

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

app.use("/api/academic-identifiers", academicIdentifierRouter);

app.use("/api/academic-history", academicHistoryRouter);

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

// Admissions routes
app.use("/api/admissions", admissionRouter);
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

// app.use("/api/study-materials", studyMaterialRouter);

app.use("/api/v1/sections", sectionRoutes);

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
app.use("/api/course-design/affiliation-types", affiliationTypeRouter);
app.use("/api/course-design/regulation-types", regulationTypeRouter);
app.use("/api/course-design/program-courses", programCourseRouter);
app.use("/api/course-design/course-types", courseTypeRouter);
app.use("/api/course-design/course-levels", courseLevelRouter);
app.use("/api/course-design/exam-components", examComponentRouter);
app.use("/api/course-design/specializations", specializationRouter);
app.use("/api/course-design/cascading-dropdowns", cascadingDropdownsRouter);

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
