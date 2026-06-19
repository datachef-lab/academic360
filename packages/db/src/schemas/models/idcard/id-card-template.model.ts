import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
    boolean,
    date,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

import { academicYearModel } from "@/schemas/models/academics/academic-year.model";
import { userModel } from "@/schemas/models/user/user.model";

export const idCardTemplateModel = pgTable("id_card_templates", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .notNull()
        .references(() => academicYearModel.id),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    templateImageKey: varchar({ length: 1000 }).notNull(),
    templateImageUrl: varchar({ length: 2000 }),
    backsideImageKey: varchar({ length: 1000 }),
    backsideImageUrl: varchar({ length: 2000 }),
    canvasWidthPx: integer().notNull().default(638),
    canvasHeightPx: integer().notNull().default(1004),
    qrcodeSize: integer().notNull().default(0),
    validFrom: date(),
    validTill: date(),
    isDefault: boolean().notNull().default(false),
    disabled: boolean().notNull().default(false),
    createdByUserId: integer("created_by_user_id_fk").references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createIdCardTemplateSchema = createInsertSchema(idCardTemplateModel);
export type IdCardTemplate = z.infer<typeof createIdCardTemplateSchema>;
export type IdCardTemplateT = typeof createIdCardTemplateSchema._type;
