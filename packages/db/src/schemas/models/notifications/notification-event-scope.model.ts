import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { notificationEventModel } from "./notification-event.model";
import { sectionModel, shiftModel } from "../academics";
import { categoryModel, religionModel } from "../resources";
import { admissionQuotaTypeModel } from "../admissions";
import { genderTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/**
 * Multi-select scope dimensions for a notification event — one child table per
 * dimension, one row per selected value. A dimension with no rows means "any".
 * (academic-year, program-course & class are single-value FKs on the event.)
 */

const scopeCols = {
    id: serial().primaryKey(),
    notificationEventId: integer("notification_event_id_fk")
        .references(() => notificationEventModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
};

export const notificationEventShiftModel = pgTable("notification_event_shifts", {
    ...scopeCols,
    shiftId: integer("shift_id_fk").references(() => shiftModel.id).notNull(),
});

export const notificationEventSectionModel = pgTable("notification_event_sections", {
    ...scopeCols,
    sectionId: integer("section_id_fk").references(() => sectionModel.id).notNull(),
});

export const notificationEventGenderModel = pgTable("notification_event_genders", {
    ...scopeCols,
    gender: genderTypeEnum().notNull(),
});

export const notificationEventReligionModel = pgTable("notification_event_religions", {
    ...scopeCols,
    religionId: integer("religion_id_fk").references(() => religionModel.id).notNull(),
});

export const notificationEventCategoryModel = pgTable("notification_event_categories", {
    ...scopeCols,
    categoryId: integer("category_id_fk").references(() => categoryModel.id).notNull(),
});

export const notificationEventQuotaTypeModel = pgTable(
    "notification_event_quota_types",
    {
        ...scopeCols,
        quotaTypeId: integer("quota_type_id_fk")
            .references(() => admissionQuotaTypeModel.id)
            .notNull(),
    },
);

export const notificationEventShiftInsertSchema = createInsertSchema(
    notificationEventShiftModel,
);
export const notificationEventSectionInsertSchema = createInsertSchema(
    notificationEventSectionModel,
);
export const notificationEventGenderInsertSchema = createInsertSchema(
    notificationEventGenderModel,
);
export const notificationEventReligionInsertSchema = createInsertSchema(
    notificationEventReligionModel,
);
export const notificationEventCategoryInsertSchema = createInsertSchema(
    notificationEventCategoryModel,
);
export const notificationEventQuotaTypeInsertSchema = createInsertSchema(
    notificationEventQuotaTypeModel,
);

export type NotificationEventShiftT = typeof notificationEventShiftModel.$inferSelect;
export type NotificationEventSectionT = typeof notificationEventSectionModel.$inferSelect;
export type NotificationEventGenderT = typeof notificationEventGenderModel.$inferSelect;
export type NotificationEventReligionT = typeof notificationEventReligionModel.$inferSelect;
export type NotificationEventCategoryT = typeof notificationEventCategoryModel.$inferSelect;
export type NotificationEventQuotaTypeT =
    typeof notificationEventQuotaTypeModel.$inferSelect;

export type _NotificationEventScopeZod = z.infer<
    typeof notificationEventShiftInsertSchema
>;
