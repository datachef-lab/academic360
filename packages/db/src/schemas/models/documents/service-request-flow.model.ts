import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { serviceRequestModel } from "./service-request.model";

export const serviceRequestFlowModel = pgTable("service_requests", {
    id: serial().primaryKey(),
    serviceRequestId: integer("service_request_id_fk")
        .references(() => serviceRequestModel.id)
        .notNull(),
    
    
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createServiceRequestFlowModel = createInsertSchema(serviceRequestFlowModel);

export type ServiceRequestFlow = z.infer<typeof createServiceRequestFlowModel>;

export type ServiceRequestFlowT = typeof createServiceRequestFlowModel._type;