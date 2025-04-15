import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { offeredSubjectModel } from "./offeredSubject.model.js";
import { paperModeTypeEnum } from "@/features/user/models/helper.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paperModel = pgTable("papers", {
    id: serial().primaryKey(),
    offeredSubjectId: integer().notNull().references(() => offeredSubjectModel.id),
    name: varchar({ length: 500 }),
    shortName: varchar({ length: 500 }),
    mode: paperModeTypeEnum(),
    displayName: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const paperRelations = relations(paperModel, ({ one }) => ({
    offeredSubject: one(offeredSubjectModel, {
        fields: [paperModel.offeredSubjectId],
        references: [offeredSubjectModel.id],
    })
}));

export const createPaperSchema = createInsertSchema(paperModel);

export type Paper = z.infer<typeof createPaperSchema>;