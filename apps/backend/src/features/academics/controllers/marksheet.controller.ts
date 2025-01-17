import fs from "fs";
import path from "path";
import { db } from "@/db/index.ts";
import { ExcelRow } from "@/types/excel-row.ts";
import { readExcelFile } from "@/utils/readExcelFile.ts";
import { NextFunction, Request, Response } from "express";
import { streamModel } from "../models/stream.model.ts";
import { filterData, sortData, Stream } from "@/utils/student-marksheet-helper.ts";
import { studentModel } from "../models/student.model.ts";
import { eq } from "drizzle-orm";
import { userModel } from "@/features/user/models/user.model.ts";
import { handleError } from "@/utils/handleError.ts";

const processStudent = async (rows: ExcelRow[], stream: Stream) => {
    // Check for the student exist
    const [existingStudent] = await db.select().from(studentModel).where(eq(studentModel.rollNumber, rows[0].roll_no));
    if (!existingStudent) {
        // Create the user
        const newUser = await db.insert(userModel).values({
            name: rows[0].name,
            email: rows[0].email,
            password: rows[0].roll_no,
            type: "STUDENT"
        })
        // Create the student
        const student = await db.insert(studentModel).values({
            
        })
    }

    // Process the subjects
}

export const createMultipleMarksheets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.file?.path; // Get the file path saved by multer
        if (!filePath) {
            throw new Error("File not uploaded");
        }

        // Read and parse the Excel file
        let excelData = readExcelFile(filePath) as ExcelRow[];

        // TODO: Validate all the data

        const streamsArr = await db.select().from(streamModel);

        excelData = sortData(excelData, streamsArr);

        for (let y = 2017; y <= new Date().getFullYear(); y++) {
            for (let s = 0; s < streamsArr.length; s++) {
                for (let sem = 1; sem <= 6; sem++) {
                    const arr = filterData(excelData, y, streamsArr[s].name, sem);
                    const doneStudents: string[] = [];
                    for (let st = 0; st < arr.length; st++) {
                        // Skip the iteration, if already done
                        if (doneStudents.includes(arr[st].roll_no)) continue;

                        // TODO: Process the data
                        const studentRows = arr.filter(ele => ele.roll_no === arr[st].roll_no)
                        await processStudent(studentRows, streamsArr[s]);

                        // Mark the roll_no as done
                        doneStudents.push(arr[st].roll_no);

                    }
                }
            }
        }

        // After processing, optionally delete the file to clean up
        fs.unlinkSync(filePath);

        res.status(200).json({ message: "Students created successfully" });
    } catch (error) {
        handleError(error, res, next);
    }
};