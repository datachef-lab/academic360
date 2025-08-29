import { userTypeEnum } from "@/features/user/models/helper.js";
import "dotenv/config";

import jwt from "jsonwebtoken";

type DecodedType = {
    id: number,
    type: typeof userTypeEnum.enumValues
}
export const verifyToken = (token: string, secret: string): Promise<DecodedType> => {

    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err: unknown, decoded: unknown) => {
            if (err) return reject(err);
            resolve(decoded as DecodedType);
        });
    });
};
