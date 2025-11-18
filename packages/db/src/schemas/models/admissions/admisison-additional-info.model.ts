import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { departmentModel } from "@/schemas/models/administration";
import { disabilityTypeEnum } from "@/schemas/enums";
import { applicationFormModel } from "@/schemas/models/admissions";
import { annualIncomeModel } from "@/schemas/models/resources";
// import { bankBranchModel } from "../payments";
import { programCourseModel } from "../course-design";

export const admissionAdditionalInfoModel = pgTable("admission_additional_info", {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),
    alternateMobileNumber: varchar("alternate_mobile_number", { length: 255 }),

    isPhysicallyChallenged: boolean("is_physically_challenged").default(false),
    disabilityType: disabilityTypeEnum("disability_type"),

    isSingleParent: boolean("is_single_parent").default(false),

    // familyDetailsId: integer("family_details_id_fk").references(() => familyModel.id),

    isEitherParentStaff: boolean("is_either_parent_staff").default(false),

    nameOfStaffParent: varchar("name_of_staff_parent", { length: 255 }),
    departmentOfStaffParent: integer("department_of_staff_parent_fk")
        .references(() => departmentModel.id),

    hasFamilyExStudent: boolean("has_family_ex_student").default(false),

    familyExStudentRelation: varchar("family_ex_student_relation", { length: 255 }),

    familyExStudentName: varchar("family_ex_student_name", { length: 255 }),

    familyExStudentProgramCourseId: integer("family_ex_student_program_course_id_fk")
        .references(() => programCourseModel.id),

    familyExStudentYearOfPassing: integer("family_ex_student_year_of_passing"),

    hasSmartphone: boolean("has_smartphone").default(false),
    hasLaptopOrDesktop: boolean("has_laptop_or_desktop").default(false),
    hasInternetAccess: boolean("has_internet_access").default(false),

    annualIncomeId: integer("annual_income_id_fk")
        .references(() => annualIncomeModel.id),

   

    applyUnderNCCCategory: boolean("apply_under_ncc_category").default(false),
    applyUnderSportsCategory: boolean("apply_under_sports_category").default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
export const createAdmissionAdditionalInfoSchema = createInsertSchema(admissionAdditionalInfoModel);

export type AdmissionAdditionalInfo = z.infer<typeof createAdmissionAdditionalInfoSchema>;

export type AdmissionAdditionalInfoT = typeof createAdmissionAdditionalInfoSchema._type;