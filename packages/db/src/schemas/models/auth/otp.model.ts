import { z } from "zod";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

import { otpType } from "@/schemas/enums";

export const otpModel = pgTable("otps", {
    id: serial("id").primaryKey(),
    otp: varchar("otp", { length: 6 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    type: otpType("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createOtpSchema = createInsertSchema(otpModel) as z.ZodTypeAny;

export type Otp = z.infer<typeof createOtpSchema>;

export type OtpT = typeof createOtpSchema._type;