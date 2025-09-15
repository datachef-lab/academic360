import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { restrictedGroupingMainModel } from "./restricted-grouping-main.model";
import { classModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const restrictedGroupingClassModel = pgTable("restricted_grouping_classes", {
    id: serial().primaryKey(),
    restrictedGroupingMainId: integer("restricted_grouping_main_id_fk")
        .references(() => restrictedGroupingMainModel.id),
    classId: integer("class_id_fk")
        .references(() => classModel.id),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRestrictedGroupingClass = createInsertSchema(restrictedGroupingClassModel);

export type RestrictedGroupingClass = z.infer<typeof createRestrictedGroupingClass>;

export type RestrictedGroupingClassT = typeof createRestrictedGroupingClass._type;