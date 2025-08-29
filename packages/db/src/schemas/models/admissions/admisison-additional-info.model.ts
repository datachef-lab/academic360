import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { departmentModel } from "@/schemas/models/user";
import { disabilityTypeEnum, personTitleType } from "@/schemas/enums";
import { applicationFormModel } from "@/schemas/models/admissions";
import { annualIncomeModel,bloodGroupModel, categoryModel, religionModel } from "@/schemas/models/resources";

export const admissionAdditionalInfoModel = pgTable("admission_additional_info", {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),
    alternateMobileNumber: varchar("alternate_mobile_number", { length: 255 }),
    bloodGroupId: integer("blood_group_id_fk")
        .references(() => bloodGroupModel.id)
        .notNull(),
    religionId: integer("religion_id_fk")
        .references(() => religionModel.id)
        .notNull(),
    categoryId: integer("category_id_fk")
        .references(() => categoryModel.id)
        .notNull(),
    isPhysicallyChallenged: boolean("is_physically_challenged").default(false),
    disabilityType: disabilityTypeEnum("disability_type"),
    isSingleParent: boolean("is_single_parent").default(false),
    fatherTitle: personTitleType("father_title"),
    fatherName: varchar("father_name", { length: 255 }),
    motherTitle: personTitleType("mother_title"),
    motherName: varchar("mother_name", { length: 255 }),
    isEitherParentStaff: boolean("is_either_parent_staff").default(false),
    nameOfStaffParent: varchar("name_of_staff_parent", { length: 255 }),
    departmentOfStaffParent: integer("department_of_staff_parent_fk")
        .references(() => departmentModel.id),
    hasSmartphone: boolean("has_smartphone").default(false),
    hasLaptopOrDesktop: boolean("has_laptop_or_desktop").default(false),
    hasInternetAccess: boolean("has_internet_access").default(false),
    annualIncomeId: integer("annual_income_id_fk")
        .references(() => annualIncomeModel.id)
        .notNull(),
    applyUnderNCCCategory: boolean("apply_under_ncc_category").default(false),
    applyUnderSportsCategory: boolean("apply_under_sports_category").default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
export const createAdmissionAdditionalInfoSchema = createInsertSchema(admissionAdditionalInfoModel);

export type AdmissionAdditionalInfo = z.infer<typeof createAdmissionAdditionalInfoSchema>;

export type AdmissionAdditionalInfoT = typeof createAdmissionAdditionalInfoSchema._type;