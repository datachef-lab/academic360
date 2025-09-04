import { courseModel } from "@repo/db/schemas/models/course-design";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { institutionModel } from "@/features/resources/models/institution.model.js";
import { languageMediumModel } from "@/features/resources/models/languageMedium.model.js";
import {
    boardResultStatusType,
    streamType,
} from "@repo/db/schemas/enums";
import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admissionAcademicInfoModel = pgTable("admission_academic_info", {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),
    boardUniversityId: integer("board_university_id_fk")
        .references(() => boardUniversityModel.id)
        .notNull(),
    boardResultStatus: boardResultStatusType("board_result_status").notNull(),
    rollNumber: varchar("roll_number", { length: 255 }),
    schoolNumber: varchar("school_number", { length: 255 }),
    centerNumber: varchar("center_number", { length: 255 }),
    admitCardId: varchar("admit_card_id", { length: 255 }),
    instituteId: integer("institute_id_fk").references(() => institutionModel.id),
    otherInstitute: varchar("other_institute", { length: 500 }),
    languageMediumId: integer("language_medium_id_fk")
        .references(() => languageMediumModel.id)
        .notNull(),
    yearOfPassing: integer("year_of_passing").notNull(),
    streamType: streamType("stream_type").notNull(),
    isRegisteredForUGInCU: boolean("is_registered_for_ug_in_cu").default(false),
    cuRegistrationNumber: varchar("cu_registration_number", { length: 255 }),
    previouslyRegisteredCourseId: integer(
        "previously_registered_course_id_fk",
    ).references(() => courseModel.id),
    otherPreviouslyRegisteredCourse: varchar(
        "other_previously_registered_course",
        { length: 500 },
    ),
    previousCollegeId: integer("previous_college_id_fk").references(
        () => institutionModel.id,
    ),
    otherCollege: varchar("other_college", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAdmissionAcademicInfoSchema = createInsertSchema(
    admissionAcademicInfoModel,
);

export type AdmissionAcademicInfo = z.infer<
    typeof createAdmissionAcademicInfoSchema
>;
