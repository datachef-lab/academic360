import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, time, timestamp, varchar } from "drizzle-orm/pg-core";

import { studentModel } from "@/schemas/models/user";
import { pickupPointModel, transportModel } from "@/schemas/models/resources";

export const transportDetailsModel = pgTable("transport_details", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").references(() => studentModel.id),
    transportId: integer("transport_id_fk").references(() => transportModel.id),
    pickupPointId: integer("pickup_point_id_fk").references(() => pickupPointModel.id),
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

export type TransportDetailsT = typeof createTransportDetailsSchema._type;