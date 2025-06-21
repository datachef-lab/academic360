import { db } from "@/db";
import { feesStructureModel, FeesStructure } from "../models/fees-structure.model";
import { and, eq } from "drizzle-orm";
import { FeesStructureDto } from "@/types/fees";
import { academicYearModel, AcademicYear } from "@/features/academics/models/academic-year.model";
import { courseModel } from "@/features/academics/models/course.model";
import { feesComponentModel } from "../models/fees-component.model";
import { alias } from "drizzle-orm/pg-core";
import { FeesDesignAbstractLevel } from "@/types/fees";
import { batchModel } from "@/features/academics/models/batch.model";
import { shiftModel } from "@/features/academics/models/shift.model";

export const getFeesStructures = async (): Promise<FeesStructureDto[] | null> => {
    try {
        const advanceCourse = alias(courseModel, "advanceCourse");
        const feesStructures = await db.select({
            id: feesStructureModel.id,
            closingDate: feesStructureModel.closingDate,
            academicYearId: feesStructureModel.academicYearId,
            courseId: feesStructureModel.courseId,
            semester: feesStructureModel.semester,
            advanceForCourseId: feesStructureModel.advanceForCourseId,
            advanceForSemester: feesStructureModel.advanceForSemester,
            startDate: feesStructureModel.startDate,
            endDate: feesStructureModel.endDate,
            onlineStartDate: feesStructureModel.onlineStartDate,
            onlineEndDate: feesStructureModel.onlineEndDate,
            numberOfInstalments: feesStructureModel.numberOfInstalments,
            instalmentStartDate: feesStructureModel.instalmentStartDate,
            instalmentEndDate: feesStructureModel.instalmentEndDate,
            createdAt: feesStructureModel.createdAt,
            updatedAt: feesStructureModel.updatedAt,
            academicYear: academicYearModel,
            course: courseModel,
            advanceForCourse: advanceCourse,
        }).from(feesStructureModel)
            .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
            .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id))
            .leftJoin(advanceCourse, eq(feesStructureModel.advanceForCourseId, advanceCourse.id));

        const feesStructureDtos: FeesStructureDto[] = [];
        for (const feesStructure of feesStructures) {
            const components = await db.select().from(feesComponentModel).where(eq(feesComponentModel.feesStructureId, feesStructure.id));
            if (feesStructure.academicYear && feesStructure.course) {
                feesStructureDtos.push({
                    ...feesStructure,
                    academicYear: feesStructure.academicYear,
                    course: feesStructure.course,
                    components,
                });
            }
        }
        return feesStructureDtos;
    } catch (error) {
        return null;
    }
};

export const getFeesStructureById = async (id: number): Promise<FeesStructureDto | null> => {
    try {
        const advanceCourse = alias(courseModel, "advanceCourse");
        const feesStructures = await db.select({
            id: feesStructureModel.id,
            closingDate: feesStructureModel.closingDate,
            academicYearId: feesStructureModel.academicYearId,
            courseId: feesStructureModel.courseId,
            semester: feesStructureModel.semester,
            advanceForCourseId: feesStructureModel.advanceForCourseId,
            advanceForSemester: feesStructureModel.advanceForSemester,
            startDate: feesStructureModel.startDate,
            endDate: feesStructureModel.endDate,
            onlineStartDate: feesStructureModel.onlineStartDate,
            onlineEndDate: feesStructureModel.onlineEndDate,
            numberOfInstalments: feesStructureModel.numberOfInstalments,
            instalmentStartDate: feesStructureModel.instalmentStartDate,
            instalmentEndDate: feesStructureModel.instalmentEndDate,
            createdAt: feesStructureModel.createdAt,
            updatedAt: feesStructureModel.updatedAt,
            academicYear: academicYearModel,
            course: courseModel,
            advanceForCourse: advanceCourse,
        }).from(feesStructureModel)
            .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
            .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id))
            .leftJoin(advanceCourse, eq(feesStructureModel.advanceForCourseId, advanceCourse.id))
            .where(eq(feesStructureModel.id, id));
            
        if (feesStructures.length === 0) {
            return null;
        }
        const feesStructure = feesStructures[0];
        
        if (!feesStructure.academicYear || !feesStructure.course) {
            return null;
        }

        const components = await db.select().from(feesComponentModel).where(eq(feesComponentModel.feesStructureId, feesStructure.id));
        
        return {
            ...feesStructure,
            academicYear: feesStructure.academicYear,
            course: feesStructure.course,
            components,
        };
    } catch (error) {
        return null;
    }
};

export const createFeesStructure = async (feesStructure: FeesStructure) => {
    try {
        const newFeesStructure = await db.insert(feesStructureModel).values(feesStructure).returning();
        return newFeesStructure[0];
    } catch (error) {
        return null;
    }
};

export const updateFeesStructure = async (id: number, feesStructure: FeesStructure) => {
    try {
        const updatedFeesStructure = await db.update(feesStructureModel).set(feesStructure).where(eq(feesStructureModel.id, id)).returning();
        return updatedFeesStructure[0];
    } catch (error) {
        return null;
    }
};

export const deleteFeesStructure = async (id: number) => {
    try {
        const deletedFeesStructure = await db.delete(feesStructureModel).where(eq(feesStructureModel.id, id)).returning();
        return deletedFeesStructure[0];
    } catch (error) {
        return null;
    }
};

export const getFeesDesignAbstractLevel = async (academicYearId?: number, courseId?: number): Promise<FeesDesignAbstractLevel[]> => {
    try {
        const conditions = [];
        if (academicYearId) {
            conditions.push(eq(feesStructureModel.academicYearId, academicYearId));
        }
        if (courseId) {
            conditions.push(eq(feesStructureModel.courseId, courseId));
        }

        const query = db.select({
            academicYear: academicYearModel,
            course: courseModel,
            semester: feesStructureModel.semester,
            startDate: feesStructureModel.startDate,
            endDate: feesStructureModel.endDate,
        })
        .from(feesStructureModel)
        .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
        .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id));

        if (conditions.length > 0) {
            // @ts-ignore
            query.where(and(...conditions));
        }

        const feesStructures = await query;

        const academicYearsMap = new Map<number, FeesDesignAbstractLevel>();

        for (const { academicYear, course, semester, startDate, endDate } of feesStructures) {
            if (!academicYear || !course) continue;

            if (!academicYearsMap.has(academicYear.id)) {
                academicYearsMap.set(academicYear.id, {
                    academicYear,
                    courses: [],
                });
            }

            const academicYearData = academicYearsMap.get(academicYear.id)!;
            let courseData = academicYearData.courses.find(c => c.id === course.id);

            if (!courseData) {
                const batches = await db.select({
                    shift: shiftModel.name,
                })
                .from(batchModel)
                .leftJoin(shiftModel, eq(batchModel.shiftId, shiftModel.id))
                .where(eq(batchModel.courseId, course.id));

                courseData = {
                    id: course.id,
                    name: course.name,
                    semesters: [],
                    shifts: batches.map(b => b.shift).filter((s): s is string => s !== null),
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                academicYearData.courses.push(courseData);
            }

            if (courseData && !courseData.semesters.includes(semester)) {
                courseData.semesters.push(semester);
            }
        }

        return Array.from(academicYearsMap.values());
    } catch (error) {
        console.error(error);
        return [];
    }
};
