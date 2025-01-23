import { z } from "zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { degreeModel } from "./degree.model.ts";
import { addressModel } from "@/features/user/models/address.model.ts";
import { relations } from "drizzle-orm";

export const lastBoardUniversityModel = pgTable("last_board_universities", {
    id: serial().primaryKey(),
    name: varchar({ length: 700 }).notNull().unique(),
    degreeId: integer().notNull().references(() => degreeModel.id),
    addressId: integer().references(() => addressModel.id),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLastBoardUniversityRelations = relations(lastBoardUniversityModel, ({ one }) => ({
    degree: one(degreeModel, {
        fields: [lastBoardUniversityModel.degreeId],
        references: [degreeModel.id]
    }),
    address: one(addressModel, {
        fields: [lastBoardUniversityModel.addressId],
        references: [addressModel.id]
    }),
}));

export const createLastBoardUniversitySchema = createInsertSchema(lastBoardUniversityModel);

export type LastBoardUniversity = z.infer<typeof createLastBoardUniversitySchema>;