import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { serviceRequestMasterModel } from "./service-request-master.model";
import { promotionModel } from "../batches/promotions.model";
import { userModel } from "../user";
import { serviceRequestFlowConclusionEnum } from "@/schemas/enums";

export const serviceRequestModel = pgTable("service_requests", {
    id: serial().primaryKey(),
    serviceRequestMasterId: integer("service_request_master_id_fk")
        .references(() => serviceRequestMasterModel.id)
        .notNull(),
    code: text().notNull(),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id)
        .notNull(),
    conclusion: serviceRequestFlowConclusionEnum("conclusion").default("PENDING").notNull(),
    closedBy: integer("closed_by_user_id_fk")
        .references(() => userModel.id),
    closedAt: timestamp({ withTimezone: true }),
    remarks: text(),
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createServiceRequestModel = createInsertSchema(serviceRequestModel);

export type ServiceRequest = z.infer<typeof createServiceRequestModel>;

export type ServiceRequestT = typeof createServiceRequestModel._type;