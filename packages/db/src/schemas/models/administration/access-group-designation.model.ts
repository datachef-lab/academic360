import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { accessGroupModel } from "./access-group.model";
import { designationModel } from "./designation.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const accessGroupDesignationModel = pgTable("access_group__designation", {
    id: serial().primaryKey(),
    accessGroupId: integer("access_group_id_fk")
        .references(() => accessGroupModel.id)
        .notNull(),
    designationId: integer("designation_id_fk")
        .references(() => designationModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAccessGroupDesignationSchema = createInsertSchema(accessGroupDesignationModel);

export type AccessGroupDesignation = z.infer<typeof createAccessGroupDesignationSchema>;

export type AccessGroupDesignationT = typeof createAccessGroupDesignationSchema._type;