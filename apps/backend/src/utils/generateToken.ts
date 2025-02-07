import "dotenv/config";
import type { StringValue } from "ms";
import jwt from "jsonwebtoken";

type PayloadType = {
    id: number,
    type: "ADMIN" | "STUDENT" | "TEACHER" | null | undefined;
}

export const generateToken = (payload: PayloadType, secret: string, expiresIn: StringValue | number = "1h") => {
    return jwt.sign(payload, secret, { expiresIn });
};
