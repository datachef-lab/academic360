import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const addonModel = pgTable("addons", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createAddOnSchema = createInsertSchema(addonModel);

export type AddOn = z.infer<typeof createAddOnSchema>;
