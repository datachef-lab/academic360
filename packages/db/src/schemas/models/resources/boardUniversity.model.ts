import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addressModel } from "@/schemas/models/user";
import { degreeModel } from "@/schemas/models/resources";

export const boardUniversityModel = pgTable("board_universities", {
    id: serial().primaryKey(),
    legacyBoardUniversityId: integer(),
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

export type BoardUniversityT = typeof createBoardUniversitySchema._type;