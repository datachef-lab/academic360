import _ from "lodash";
import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError.ts";

export function validateData(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.strict().parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: `${issue.path.join(".")} is ${issue.message}`,
                }));

                const errorMessagesStrings = errorMessages.map((err) => err.message);
                new ApiError(400, "BAD_REQUEST", "Invalid Data", errorMessagesStrings)
                res.status(400).json({ error: "", details: errorMessages });
            } else {
                res.status(500).json({ error: "Internal Server Error!" });
            }
        }
    };
}
