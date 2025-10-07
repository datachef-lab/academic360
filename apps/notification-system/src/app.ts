import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import express, { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// mount routers before 404 is critical; exporting app here only sets structure

// Note: 404 handler is installed in index.ts after routers are mounted

export { app };
