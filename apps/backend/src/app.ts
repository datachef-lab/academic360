import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Request, Response, } from "express";

import { logger } from "@/middlewares/logger.middleware.ts";
import { errorHandler } from "@/middlewares/errorHandler.middleware.ts";
import { corsOptions } from "@/config/corsOptions.ts";

import userRouter from "@/features/user/routes/user.route.ts";
import authRouter from "@/features/auth/routes/auth.route.ts";

import { documentRouter, marksheetRouter, streamRouter, subjectMetadataRouter, subjectRouter } from "@/features/academics/routes/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: "180kb" }));

app.use(express.urlencoded({ extended: true, limit: "180kb" }));

app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "..", "public")));

app.get("^/$|/index(.html)?", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

app.use("/auth", authRouter);

app.use("/api/users", userRouter);

app.use("/api/streams", streamRouter);

app.use("/api/subject-metadatas", subjectMetadataRouter);

app.use("/api/marksheets", marksheetRouter);

app.use("/api/subjects", subjectRouter);

app.use("/api/documents", documentRouter);


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
