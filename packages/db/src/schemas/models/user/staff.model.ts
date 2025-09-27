import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

import { bankAccountTypeEnum } from "@/schemas/enums";
// import { personalDetailsModel } from "./personalDetails.model";
import { userModel } from "./user.model";
import { studentCategoryModel } from "../admissions";
// import { healthModel } from "./health.model";
// import { emergencyContactModel } from "./emergencyContact.model";
import { bankBranchModel } from "../payments";
import { boardModel, institutionModel, languageMediumModel } from "../resources";
import { shiftModel } from "../academics";
// import { familyModel } from "./family.model";
// import { personModel } from "./person.model";
// import { addressModel } from "./address.model";


export const staffModel = pgTable('staffs', {
    id: serial().primaryKey(),
    legacyStaffId: integer("legacy_staff_id"),
    userId: integer("user_id_fk")
        .references(() => userModel.id).notNull(),
    attendanceCode: varchar("attendance_code", { length: 255 }),
    uid: varchar({ length: 255 }),
    codeNumber: varchar({ length: 255 }),
    rfidNumber: varchar({ length: 255 }),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id),
    gratuityNumber: varchar({ length: 255 }),

    // personalDetailsId: integer("personal_details_id_fk")
    //     .references(() => personalDetailsModel.id),

    // familyDetailsId: integer("family_details_id_fk").references(() => familyModel.id),

    studentCategoryId: integer("student_category_id_fk")
        .references(() => studentCategoryModel.id),
    // healthId: integer("health_id_fk").references(() => healthModel.id),

    // emergencyContactId: integer("emergency_contact_id_fk").references(() => emergencyContactModel.id),

    computerOperationKnown: boolean("computer_operation_known").default(false),
    lastSchoolAttended: integer("last_school_attended_id_fk").references(() => institutionModel.id),
    medium1: integer("medium1_id_fk").references(() => languageMediumModel.id),
    medium2: integer("medium2_id_fk").references(() => languageMediumModel.id),
    lastCollegeAttended: integer("last_college_attended_id_fk").references(() => institutionModel.id),
    boardId: integer("board_id_fk").references(() => boardModel.id),
    
    childrens: varchar({ length: 255 }),
    majorChildName: varchar({ length: 255 }),
    majorChildPhone: varchar({ length: 255 }),
    
    // nomineeId: integer("nominee_id_fk").references(() => personModel.id),
    previousEmployeeName: varchar({ length: 255 }),
    previousEmployeePhone: varchar({ length: 255 }),
    // previousEmployeeAddressId: integer("previous_employee_address_id_fk").references(() => addressModel.id),


    bankAccountNumber: varchar({ length: 255 }),
    bankBranchId: integer("bank_branch_id_fk").references(() => bankBranchModel.id),
    banlIfscCode: varchar({ length: 255 }),
    bankAccountType: bankAccountTypeEnum("bank_account_type"),
    providentFundAccountNumber: varchar({ length: 255 }),
    panNumber: varchar({ length: 255 }),
    esiNumber: varchar({ length: 255 }),
    impNumber: varchar({ length: 255 }),
    clinicAddress: varchar({ length: 500 }),
    hasPfNomination: boolean("has_pf_nomination").default(false),
    gratuityNominationDate: timestamp("gratuity_nomination_date"),
    univAccountNumber: varchar({ length: 255 }),

    dateOfConfirmation: timestamp("date_of_confirmation"),
    dateOfProbation: timestamp("date_of_probation"),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStaffSchema = createInsertSchema(staffModel);

export type Staff = z.infer<typeof createStaffSchema>;

export type StaffT = typeof createStaffSchema._type;