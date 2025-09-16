import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    index,
} from "drizzle-orm/pg-core";

import { academicYearModel, classModel } from "@/schemas/models/academics";
import {
    subjectTypeModel,
    subjectModel,
    affiliationModel,
    regulationTypeModel,
    programCourseModel,
} from "@/schemas/models/course-design";

export const paperModel = pgTable("papers", {
    id: serial().primaryKey(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    affiliationId: integer("affiliation_id_fk")
        .references(() => affiliationModel.id)
        .notNull(),
    regulationTypeId: integer("regulation_type_id_fk")
        .references(() => regulationTypeModel.id)
        .notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    programCourseId: integer("programe_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
    isOptional: boolean().default(false),
    sequence: integer(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    // Foreign key indexes for fast joins
    subjectIdIdx: index("idx_papers_subject_id").on(table.subjectId),
    affiliationIdIdx: index("idx_papers_affiliation_id").on(table.affiliationId),
    regulationTypeIdIdx: index("idx_papers_regulation_type_id").on(table.regulationTypeId),
    academicYearIdIdx: index("idx_papers_academic_year_id").on(table.academicYearId),
    subjectTypeIdIdx: index("idx_papers_subject_type_id").on(table.subjectTypeId),
    programCourseIdIdx: index("idx_papers_program_course_id").on(table.programCourseId),
    classIdIdx: index("idx_papers_class_id").on(table.classId),

    // Search indexes
    nameIdx: index("idx_papers_name").on(table.name),
    codeIdx: index("idx_papers_code").on(table.code),
    isOptionalIdx: index("idx_papers_is_optional").on(table.isOptional),

    // Ordering indexes
    createdAtIdx: index("idx_papers_created_at").on(table.createdAt),
    idIdx: index("idx_papers_id").on(table.id),

    // Composite indexes for common filter combinations
    filtersIdx: index("idx_papers_filters").on(table.subjectId, table.affiliationId, table.regulationTypeId),
    searchIdx: index("idx_papers_search").on(table.name, table.code, table.isOptional),

    // Active records index
    activeIdx: index("idx_papers_active").on(table.isActive),
}));

export const createPaperModel = createInsertSchema(paperModel);

export type Paper = z.infer<typeof createPaperModel>;

export type PaperT = typeof createPaperModel._type;