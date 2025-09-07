import {
  settingsTypeInputEnum,
  settingsVariantEnum,
} from "@repo/db/schemas/enums";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const settingsModel = pgTable("settings", {
  id: serial().primaryKey(),
  variant: settingsVariantEnum().default("GENERAL").notNull(),
  type: settingsTypeInputEnum().default("TEXT").notNull(),
  name: varchar({ length: 700 }).notNull().unique(),
  value: varchar({ length: 700 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createSettingsSchema = createInsertSchema(settingsModel);

export type Settings = z.infer<typeof createSettingsSchema>;
