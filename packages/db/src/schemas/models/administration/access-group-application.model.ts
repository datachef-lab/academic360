import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { accessGroupModel } from "./access-group.model";
import { academic360ApplicationDomainEnum } from "@/schemas/enums";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const accessGroupApplicationModel = pgTable("access_group_applications", {
    id: serial().primaryKey(),
    accessGroupId: integer("access_group_id_fk")
        .references(() => accessGroupModel.id)
        .notNull(),
    type: academic360ApplicationDomainEnum().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    accessGroupUserTypeUq: unique("access_group__user_type_uq").on(
        table.accessGroupId,
        table.type,
    )
}));

export const createAccessGroupApplicationSchema = createInsertSchema(accessGroupApplicationModel);

export type AccessGroupApplication = z.infer<typeof createAccessGroupApplicationSchema>;

export type AccessGroupApplicationT = typeof createAccessGroupApplicationSchema._type;