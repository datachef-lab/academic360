import { degreeModel } from "@/features/resources/models/degree.model.js";
import { degreeProgrammeTypeEnum, frameworkTypeEnum } from "@/features/user/models/helper.js";
import { relations } from "drizzle-orm";
import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const streamModel = pgTable('streams', {
    id: serial().primaryKey(),
    framework: frameworkTypeEnum(),
    degreeId: integer("degree_id_fk").notNull().references(() => degreeModel.id),
    degree_programme_type: degreeProgrammeTypeEnum(),
    duration: integer(),
    numberOfSemesters: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const streamRelations = relations(streamModel, ({ one }) => ({
    degreee: one(degreeModel, {
        fields: [streamModel.degreeId],
        references: [degreeModel.id]
    })
}));

export const createStreamModel = createInsertSchema(streamModel);

export type Stream = z.infer<typeof createStreamModel>;