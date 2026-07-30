
import { serviceRequestMasterTypeEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { documentTypeModel } from "./document-type.model";

export const serviceRequestMasterModel = pgTable("service_request_master", {
    id: serial().primaryKey(),
    type: serviceRequestMasterTypeEnum("type").notNull(),
    documentTypeId: integer("document_type_id_fk")
        .references(() => documentTypeModel.id),
    code: varchar("code", { length: 256 }).notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createServiceRequestMasterModel = createInsertSchema(serviceRequestMasterModel);

export type ServiceRequestMaster = z.infer<typeof createServiceRequestMasterModel>;

export type ServiceRequestMasterT = typeof createServiceRequestMasterModel._type;