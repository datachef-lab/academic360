import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const bloodGroupModel = pgTable("blood_group", {
    id: serial().primaryKey(),
    legacyBloodGroupId: integer("legacy_blood_group_id"),
    type: varchar("type", { length: 255 }).notNull().unique(),
    sequence: integer("sequence").unique(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createBloodGroupSchema = createInsertSchema(bloodGroupModel);

export type BloodGroup = z.infer<typeof createBloodGroupSchema>;

export type BloodGroupT = typeof createBloodGroupSchema._type;