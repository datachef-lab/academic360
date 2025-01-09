import fs from "fs";
import fsPromise from "fs/promises";
import path from "path";
import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import { NextFunction, Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const logEvents = async (message: string, logFileName: string) => {
    const dateTime = `${format(new Date(), "dd-MM-yyyy\tHH:mm:ss")}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    const logsDir = logFileName.includes("errLog") ? "errLogs" : "reqLogs";
    //   const baseLogDir = path.join(__dirname, "../..", "logs");
    const baseLogDir = process.env.LOG_DIRECTORY!;
    const targetLogDir = path.join(baseLogDir, logsDir);
    const logFilePath = path.join(targetLogDir, logFileName);

    try {
        // Ensure the base 'logs' directory exists
        if (!fs.existsSync(baseLogDir)) {
            await fsPromise.mkdir(baseLogDir);
        }

        // Ensure the 'logs/reqLogs' or 'logs/errLogs' directory exists
        if (!fs.existsSync(targetLogDir)) {
            await fsPromise.mkdir(targetLogDir);
        }

        // Read existing log content if the file exists
        let existingLogs = "";
        if (fs.existsSync(logFilePath)) {
            existingLogs = await fsPromise.readFile(logFilePath, "utf8");
        }

        // Prepend the new log item to the existing logs
        const updatedLogs = logItem + existingLogs;

        // Write the combined content back to the file
        await fsPromise.writeFile(logFilePath, updatedLogs);
    } catch (error) {
        console.error("Error writing log file:", error);
    }
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
    // Generate dynamic log file name based on current date
    const logFileName = `reqLog_${format(new Date(), "dd-MM-yyyy")}.log`;

    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, logFileName);

    console.log(`${req.method} ${req.path}`);

    next();
};
