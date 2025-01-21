import "dotenv/config";
import { ApiError } from "@/utils/ApiError.ts";
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "@/utils/verifyToken.ts";
import { db } from "@/db/index.ts";
import { userModel } from "@/features/user/models/user.model.ts";
import { eq } from "drizzle-orm";
import { handleError } from "@/utils/handleError.ts";

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization as string;
        console.log(authHeader);
        if (!authHeader?.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized");
        }

        const accessToken = authHeader.split(" ")[1];
        const decoded = await verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET!);

        const [foundUser] = await db.select().from(userModel).where(eq(userModel.id, decoded.id));

        if (!foundUser || foundUser.disabled) {
            throw new ApiError(401, "Unauthorized");
        }

        req.user = foundUser;

        next();

    } catch (err) {
        // if (err instanceof Error && err.name === "TokenExpiredError") {
        //     res.status(401).json(new ApiError(401, "Token expired"));
        // } else {
        //     handleError(err, res, next);
        //     // res.status(403).json(new ApiError(403, "Forbidden"));
        // }
        handleError(err, res, next);
    }
};
