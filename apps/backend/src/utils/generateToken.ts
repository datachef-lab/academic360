import "dotenv/config";
import type { StringValue } from "ms";
import jwt from "jsonwebtoken";
import { User } from "@repo/db/schemas/models/user";

type PayloadType = {
  id: number;
  type: User["type"];
};

export const generateToken = (
  payload: PayloadType,
  secret: string,
  expiresIn: StringValue | number = "1h",
) => {
  return jwt.sign(payload, secret, { expiresIn });
};
