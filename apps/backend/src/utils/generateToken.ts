import "dotenv/config";
import jwt from "jsonwebtoken";

type PayloadType = {
    id: number,
    type: "ADMIN" | "STUDENT" | "TEACHER" | null | undefined;
}

export const generateToken = (payload: PayloadType, secret: string, expiresIn: string | number | undefined) => {
    return jwt.sign(payload, secret, { expiresIn });
};
