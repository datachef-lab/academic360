import "dotenv/config";
import { UserType } from "@/features/user/models/user.model.ts";
import jwt from "jsonwebtoken";

type PayloadType = {
    id: number,
    type: UserType["type"]
}

export const generateToken = (payload: PayloadType, secret: string, expiresIn: string | number | undefined) => {
    return jwt.sign(payload, secret, { expiresIn });
};
