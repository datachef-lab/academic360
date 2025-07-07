import { z } from "zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { addressModel } from "@/features/user/models/address.model.js";
import { relations } from "drizzle-orm";

export const boardUniversityModel = pgTable("board_universities", {
    id: serial().primaryKey(),
    name: varchar({ length: 700 }).notNull().unique(),
    degreeId: integer().references(() => degreeModel.id),
    passingMarks: integer(),
    code: varchar({ length: 255 }),
    addressId: integer().references(() => addressModel.id),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLastBoardUniversityRelations = relations(boardUniversityModel, ({ one }) => ({
    degree: one(degreeModel, {
        fields: [boardUniversityModel.degreeId],
        references: [degreeModel.id]
    }),
    address: one(addressModel, {
        fields: [boardUniversityModel.addressId],
        references: [addressModel.id]
    }),
}));

export const createBoardUniversitySchema = createInsertSchema(boardUniversityModel);

export type BoardUniversity = z.infer<typeof createBoardUniversitySchema>;