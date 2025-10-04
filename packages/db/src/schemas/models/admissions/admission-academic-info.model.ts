import { z } from "zod";
import {
    boolean,
    doublePrecision,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

import { programCourseModel, specializationModel } from "@/schemas/models/course-design";
import { boardResultStatusType } from "@/schemas/enums";
import { applicationFormModel } from "@/schemas/models/admissions";
import { boardModel, institutionModel, languageMediumModel } from "@/schemas/models/resources";
import { addressModel, studentModel } from "../user";

export const admissionAcademicInfoModel = pgTable("admission_academic_info", {
    id: serial("id").primaryKey(),
    legacyAcademicDetailsId: integer("legacy_academic_details_id"),
    legacyStudentAcademicDetailsId: integer("legacy_student_academic_details_id"),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id),
    boardId: integer("board_id_fk")
        .references(() => boardModel.id)
        .notNull(),
    otherBoard: varchar("other_board", { length: 755 }),
    boardResultStatus: boardResultStatusType("board_result_status").notNull(),
    percentageOfMarks: doublePrecision(),
    division: varchar("division", { length: 255 }),
    rank: integer(),
    totalPoints: doublePrecision(),
    aggregate: doublePrecision(),

    subjectStudied: varchar("subject_studied", { length: 255 }),
    lastSchoolId: integer("last_school_id_fk").references(() => institutionModel.id),
    lastSchoolName: varchar("last_school_name", { length: 755 }),
    lastSchoolAddress: integer("last_school_address_id_fk").references(() => addressModel.id),

    indexNumber1: varchar("index_number_1", { length: 255 }),
    indexNumber2: varchar("index_number_2", { length: 255 }),

    registrationNumber: varchar("registration_number", { length: 255 }),
    previousRegistrationNumber: varchar("previous_registration_number", { length: 255 }),
    rollNumber: varchar("roll_number", { length: 255 }),
    examNumber: varchar("exam_number", { length: 255 }),

    schoolNumber: varchar("school_number", { length: 255 }),
    centerNumber: varchar("center_number", { length: 255 }),
    admitCardId: varchar("admit_card_id", { length: 255 }),
    // instituteId: integer("institute_id_fk").references(() => institutionModel.id),
    // otherInstitute: varchar("other_institute", { length: 500 }),
    languageMediumId: integer("language_medium_id_fk")
        .references(() => languageMediumModel.id),
    yearOfPassing: integer("year_of_passing").notNull(),
    studiedUpToClass: integer(),

    specializationId: integer().references(() => specializationModel.id),

    // streamId: integer("stream_id_fk").references(() => streamModel.id).notNull(),
    bestOfFour: doublePrecision(),
    totalScore: doublePrecision(),

    oldBestOfFour: doublePrecision(),
    oldTotalScore: doublePrecision(),

    isRegisteredForUGInCU: boolean("is_registered_for_ug_in_cu").default(false),
    cuRegistrationNumber: varchar("cu_registration_number", { length: 255 }),
    previouslyRegisteredProgramCourseId: integer(
        "previously_registered_program_course_id_fk",
    ).references(() => programCourseModel.id),
    otherPreviouslyRegisteredProgramCourse: varchar(
        "other_previously_registered_program_course",
        { length: 500 },
    ),
    previousInstituteId: integer("previous_institute_id_fk").references(
        () => institutionModel.id,
    ),
    otherPreviousInstitute: varchar("other_previous_institute", { length: 500 }),


    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAdmissionAcademicInfoSchema: z.ZodTypeAny = createInsertSchema(
    admissionAcademicInfoModel,
);

export type AdmissionAcademicInfo = z.infer<
    typeof createAdmissionAcademicInfoSchema
>;

export type AdmissionAcademicInfoT = typeof createAdmissionAcademicInfoSchema._type;