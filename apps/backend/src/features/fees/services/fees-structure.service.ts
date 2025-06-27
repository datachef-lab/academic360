import { db } from "@/db/index.js";
import { feesStructureModel, FeesStructure } from "../models/fees-structure.model.js";
import { and, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import { FeesStructureDto } from "@/types/fees/index.js";
import { academicYearModel, AcademicYear } from "@/features/academics/models/academic-year.model.js";
import { Course, courseModel } from "@/features/academics/models/course.model.js";
import { feesComponentModel, type FeesComponent } from "../models/fees-component.model.js";
import { alias } from "drizzle-orm/pg-core";
import { FeesDesignAbstractLevel } from "@/types/fees/index.js";
import { batchModel } from "@/features/academics/models/batch.model.js";
import { shiftModel } from "@/features/academics/models/shift.model.js";
import type { Shift } from "@/features/academics/models/shift.model.js";
import { createFeesSlabMapping, getFeesSlabMappingsByFeesStructureId } from "./fees-slab-mapping.service.js";
import { feesSlabMappingModel } from "../models/fees-slab-mapping.model.js";

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
            shiftId: feesStructureModel.shiftId,
        }).from(feesStructureModel)
            .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
            .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id))
            .leftJoin(advanceCourse, eq(feesStructureModel.advanceForCourseId, advanceCourse.id));

        const feesStructureDtos: FeesStructureDto[] = [];
        for (const feesStructure of feesStructures) {
            const components = await db.select().from(feesComponentModel).where(eq(feesComponentModel.feesStructureId, feesStructure.id));
            let shift: Shift | undefined = undefined;
            if (feesStructure.shiftId) {
                const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, feesStructure.shiftId));
                shift = foundShift;
            }
            if (feesStructure.academicYear && feesStructure.course) {
                const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(feesStructure.id!);
                feesStructureDtos.push({
                    ...feesStructure,
                    feesSlabMappings,
                    academicYear: feesStructure.academicYear,
                    course: feesStructure.course,
                    advanceForCourse: feesStructure.advanceForCourse,
                    components,
                    shift,
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
            shiftId: feesStructureModel.shiftId,
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
        let shift: Shift | undefined = undefined;
        if (feesStructure.shiftId) {
            const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, feesStructure.shiftId));
            shift = foundShift;
        }
        const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(feesStructure.id!);
        
        return {
            ...feesStructure,
            feesSlabMappings,
            academicYear: feesStructure.academicYear,
            course: feesStructure.course,
            advanceForCourse: feesStructure.advanceForCourse,
            components,
            shift,
        };
    } catch (error) {
        return null;
    }
};

export const getAcademicYearsFromFeesStructures = async (): Promise<AcademicYear[]> => {
    const academicYearIds = await db
        .selectDistinct({
            academicYearId: feesStructureModel.academicYearId,
            id: feesStructureModel.id  // Include this for ORDER BY
        })
        .from(feesStructureModel)
        .orderBy(desc(feesStructureModel.id));

    return await db
        .select()
        .from(academicYearModel)
        .where(inArray(academicYearModel.id, academicYearIds.map(ay => ay.academicYearId)));
};

export const getCoursesFromFeesStructures = async (academicYearId: number): Promise<Course[]> => {
    const courseIds = await db
        .selectDistinct({ courseId: feesStructureModel.courseId, id: feesStructureModel.id })
        .from(feesStructureModel)
        .where(eq(feesStructureModel.academicYearId, academicYearId))
        .orderBy(desc(feesStructureModel.id));

    return await db
        .select()
        .from(courseModel)
        .where(inArray(courseModel.id, courseIds.map(crs => crs.courseId)));
};

export const getFeesStructuresByAcademicYearIdAndCourseId = async (academicYearId: number, courseId: number): Promise<FeesStructureDto[]> => {
    const feesStructures = await db
        .select()
        .from(feesStructureModel)
        .where(
            and(
                eq(feesStructureModel.academicYearId, academicYearId),
                eq(feesStructureModel.courseId, courseId)
            )
        )
        .orderBy(desc(feesStructureModel.id));

    const results = await Promise.all(
        feesStructures.map(async (fs) => await modelToDto(fs))
    );
    return results.filter((result): result is FeesStructureDto => result !== null);
};

export const createFeesStructure = async (feesStructure: FeesStructureDto) => {
    try {
        console.log(feesStructure);
        const { id, components, feesSlabMappings, academicYear, course, advanceForCourse, shift, createdAt, updatedAt, ...rest } = feesStructure;

        if (!academicYear?.id || !course?.id) {
            throw new Error("Academic Year and Course are required to create a fee structure.");
        }

        const [existing] = await db
            .select()
            .from(feesStructureModel)
            .where(
                and(
                    eq(feesStructureModel.academicYearId, academicYear.id!),
                    eq(feesStructureModel.courseId, course.id!),
                    eq(feesStructureModel.semester, rest.semester!),
                    eq(feesStructureModel.shiftId, shift?.id!),
                    eq(feesStructureModel.feesReceiptTypeId, feesStructure?.feesReceiptTypeId!),
                )
            );

        if (existing) {
            return null;
        }
        
        const dataToInsert: FeesStructure = {
            ...rest,
            academicYearId: academicYear.id,
            courseId: course.id,
            advanceForCourseId: advanceForCourse?.id ?? null,
            shiftId: shift?.id!,
        };
        
        const [newFeesStructure] = await db.insert(feesStructureModel).values(dataToInsert).returning();
        
        if (!newFeesStructure) {
            return null;
        }

        if (components && components.length > 0) {
            const newComponents = components.map(comp => {
                const { id: compId, ...compRest } = comp;
                return { ...compRest, feesStructureId: newFeesStructure.id }
            });
            await db.insert(feesComponentModel).values(newComponents);
        }

        for (const feesSlabMapping of feesSlabMappings) {
            feesSlabMapping.feesStructureId = newFeesStructure.id;
            console.log("newFeesStructure.id:", newFeesStructure.id)
            const {id, ...rest } = feesSlabMapping;
            await createFeesSlabMapping({...rest, feesStructureId: newFeesStructure.id});
        }

        return getFeesStructureById(newFeesStructure.id);
    } catch (error) {
        console.error("Error creating fees structure:", error);
        return null;
    }
};

export const updateFeesStructure = async (id: number, feesStructure: FeesStructureDto) => {
    try {
        const { components, academicYear, course, advanceForCourse, shift, createdAt, updatedAt, ...rest } = feesStructure;

        if (!academicYear?.id || !course?.id) {
            throw new Error("Academic Year and Course are required.");
        }

        const dataToUpdate: FeesStructure = {
            ...rest,
            academicYearId: academicYear.id,
            courseId: course.id,
            advanceForCourseId: advanceForCourse?.id ?? null,
            shiftId: shift?.id!,
        };

        const [updatedFeesStructure] = await db.update(feesStructureModel)
            .set(dataToUpdate)
            .where(eq(feesStructureModel.id, id))
            .returning();
        
        if (!updatedFeesStructure) return null;

        // Handle feesComponent update logic
        if (components) {
            // Fetch all existing component ids for this structure
            const existingComponents = await db.select().from(feesComponentModel).where(eq(feesComponentModel.feesStructureId, id));
            const existingComponentIds = existingComponents.map(c => c.id);
            const requestComponentIds = components.filter(c => c.id).map(c => c.id);

            // Update or create
            for (const comp of components) {
                if (!comp.id || comp.id === 0) {
                    // Create new
                    const { id: compId, ...compRest } = comp;
                    await db.insert(feesComponentModel).values({ ...compRest, feesStructureId: updatedFeesStructure.id });
                } else {
                    // Update existing
                    let {createdAt, updatedAt, ...tmpComp } = comp;
                    await db.update(feesComponentModel).set(tmpComp).where(eq(feesComponentModel.id, comp.id));
                }
            }
            // Delete components not present in request
            const toDeleteComponentIds = existingComponentIds.filter(id => !requestComponentIds.includes(id));
            if (toDeleteComponentIds.length > 0) {
                await db.delete(feesComponentModel).where(
                    and(
                        eq(feesComponentModel.feesStructureId, id),
                        inArray(feesComponentModel.id, toDeleteComponentIds)
                    )
                );
            }
        }

        // Handle feesSlabMappings update logic
        if (feesStructure.feesSlabMappings) {
            // Fetch all existing mapping ids for this structure
            const existingMappings = await db.select().from(feesSlabMappingModel).where(eq(feesSlabMappingModel.feesStructureId, id));
            const existingMappingIds = existingMappings.map(m => m.id);
            const requestMappingIds = feesStructure.feesSlabMappings.filter(m => m.id).map(m => m.id);

            // Update or create
            for (const mapping of feesStructure.feesSlabMappings) {
                if (!mapping.id || mapping.id === 0) {
                    await createFeesSlabMapping({ ...mapping, feesStructureId: updatedFeesStructure.id });
                } else {
                    let { createdAt, updatedAt, ...tmpMapping} = mapping;
                    await db
                        .update(feesSlabMappingModel)
                        .set(tmpMapping)
                        .where(
                            eq(feesSlabMappingModel.id, mapping.id)
                        );
                }
            }
            // Delete mappings not present in request
            const toDeleteMappingIds = existingMappingIds.filter(id => !requestMappingIds.includes(id));
            if (toDeleteMappingIds.length > 0) {
                await db.delete(feesSlabMappingModel).where(
                    and(
                        eq(feesSlabMappingModel.feesStructureId, id),
                        inArray(feesSlabMappingModel.id, toDeleteMappingIds)
                    )
                );
            }
        }

        return getFeesStructureById(updatedFeesStructure.id);
    } catch (error) {
        console.error("Error updating fees structure:", error);
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

export async function modelToDto(model: FeesStructure): Promise<FeesStructureDto | null> {
    try {
        const [academicYear] = await db
            .select()
            .from(academicYearModel)
            .where(eq(academicYearModel.id, model.academicYearId));

        const [course] = await db
            .select()
            .from(courseModel)
            .where(eq(courseModel.id, model.courseId));

        let advanceForCourse = null;
        if (model.advanceForCourseId) {
            const [foundCourse] = await db
                .select()
                .from(courseModel)
                .where(eq(courseModel.id, model.advanceForCourseId));
            advanceForCourse = foundCourse;
        }

        let shift = undefined;
        if (model.shiftId) {
            const [foundShift] = await db
                .select()
                .from(shiftModel)
                .where(eq(shiftModel.id, model.shiftId));
            shift = foundShift;
        }

        let components: FeesComponent[] = [];
        if (model.id) {
            components = await db
                .select()
                .from(feesComponentModel)
                .where(eq(feesComponentModel.feesStructureId, model.id));
        }

        if (!academicYear || !course) return null;
        const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(model.id!);
        return {
            ...model,
            academicYear,
            course,
            advanceForCourse,
            components,
            shift,
            feesSlabMappings
        };
    } catch (error) {
        console.error("Error in modelToDto:", error);
        return null;
    }
}

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

export const checkFeesStructureExists = async (
  academicYearId: number,
  courseId: number,
  semester: number,
  shiftId: number,
  feesReceiptTypeId: number
): Promise<boolean> => {
  const [existing] = await db
    .select()
    .from(feesStructureModel)
    .where(
      and(
        eq(feesStructureModel.academicYearId, academicYearId),
        eq(feesStructureModel.courseId, courseId),
        eq(feesStructureModel.semester, semester),
        eq(feesStructureModel.shiftId, shiftId),
        eq(feesStructureModel.feesReceiptTypeId, feesReceiptTypeId),
      )
    );
  return !!existing;
};
