import { otpType } from "@repo/db/schemas/enums";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const otpModel = pgTable("otps", {
    id: serial("id").primaryKey(),
    otp: varchar("otp", { length: 6 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    type: otpType("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createOtpSchema = createInsertSchema(otpModel);

export type Otp = z.infer<typeof createOtpSchema>;