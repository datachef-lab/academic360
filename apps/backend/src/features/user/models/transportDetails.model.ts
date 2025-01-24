import { pickupPointModel } from "@/features/resources/models/pickupPoint.model.ts";
import { transportModel } from "@/features/resources/models/transport.model.ts";
import { integer, pgTable, serial, time, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const transportDetailsModel = pgTable("transport_details", {
    id: serial().primaryKey(),
    studentId: integer().references(() => studentModel.id),
    transportId: integer().references(() => transportModel.id),
    pickupPointId: integer().references(() => pickupPointModel.id),
    seatNumber: varchar({ length: 255 }),
    pickupTime: time(),
    dropOffTime: time(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const transportDetailsRelations = relations(transportDetailsModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [transportDetailsModel.studentId],
        references: [studentModel.id]
    }),
    transport: one(transportModel, {
        fields: [transportDetailsModel.transportId],
        references: [transportModel.id]
    }),
    pickupPoint: one(pickupPointModel, {
        fields: [transportDetailsModel.pickupPointId],
        references: [pickupPointModel.id]
    }),
}));

export const createTransportDetailsSchema = createInsertSchema(transportDetailsModel);

export type TransportDetails = z.infer<typeof createTransportDetailsSchema>;