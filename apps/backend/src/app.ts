import "dotenv/config";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import express, { Request, Response } from "express";
import { Strategy } from "passport-google-oauth20";
import passport from "passport";
import { eq } from "drizzle-orm";

import { db } from "@/db/index.ts";

import { logger } from "@/middlewares/logger.middleware.ts";
import { errorHandler } from "@/middlewares/errorHandler.middleware.ts";
import { corsOptions } from "@/config/corsOptions.ts";

import authRouter from "@/features/auth/routes/auth.route.ts";
import {
    documentRouter,
    marksheetRouter,
    streamRouter,
    subjectMetadataRouter,
    subjectRouter,
} from "@/features/academics/routes/index.ts";
import { userModel, User } from "./features/user/models/user.model.ts";

import { generateToken } from "./utils/generateToken.ts";
import {
    bloodGroupRouter,
    categoryRouter,
    cityRouter,
    languageMediumRouter,
    lastBoardUniversityRouter,
    lastInstitutionRouter,
    qualificationRouter,
    transportRouter,
} from "./features/resources/routes/index.ts";
import { studentRouter, userRouter } from "./features/user/routes/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: "180kb" }));

app.use(express.urlencoded({ extended: true, limit: "180kb" }));

app.use(cookieParser());

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

                const accessToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY!);

                const refreshToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.REFRESH_TOKEN_SECRET!, process.env.REFRESH_TOKEN_EXPIRY!);

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

app.use("/api/users", userRouter);

app.use("/api/students", studentRouter);

app.use("/api/streams", streamRouter);

app.use("/api/subject-metadatas", subjectMetadataRouter);

app.use("/api/marksheets", marksheetRouter);

app.use("/api/subjects", subjectRouter);

app.use("/api/documents", documentRouter);

app.use("/api/blood-groups", bloodGroupRouter);

app.use("/api/category", categoryRouter);

app.use("/api/city", cityRouter);

app.use("/api/language-mediums", languageMediumRouter);

app.use("/api/last-board-university", lastBoardUniversityRouter);

app.use("/api/last-institution", lastInstitutionRouter);

app.use("/api/qualifications", qualificationRouter);

app.use("/api/transports", transportRouter);

app.use(errorHandler);

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

export default app;
