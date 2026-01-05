import { db } from "@/db/index.js";
import { CreateFeeStructureDto } from "@repo/db/dtos/fees";
import { feeStructureModel, FeeStructure } from "@repo/db/schemas/models/fees";
import { eq } from "drizzle-orm";

export const createFeeStructure = async (
  data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">,
) => {
  const [created] = await db
    .insert(feeStructureModel)
    .values(data as any)
    .returning();
  return created || null;
};

export const getAllFeeStructures = async () => {
  return db.select().from(feeStructureModel);
};

export async function createFeeStructureByDto(givenDto: CreateFeeStructureDto) {
  for (let i = 0; i < givenDto.programCourseIds.length; i++) {
    for (let j = 0; j < givenDto.shiftIds.length; j++) {
      // Create fee structure for each combination of programCourseId and shiftId
      const feeStructuredataToInsert: Omit<
        FeeStructure,
        "id" | "createdAt" | "updatedAt"
      > = {
        academicYearId: givenDto.academicYearId,
        classId: givenDto.classId,
        receiptTypeId: givenDto.receiptTypeId,
        baseAmount: givenDto.baseAmount,
        programCourseId: givenDto.programCourseIds[i],
        shiftId: givenDto.shiftIds[j],
      };
      // await
    }
  }
}

export const getFeeStructureById = async (id: number) => {
  const [found] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, id));
  return found || null;
};

export const updateFeeStructure = async (
  id: number,
  data: Partial<FeeStructure>,
) => {
  const [updated] = await db
    .update(feeStructureModel)
    .set(data)
    .where(eq(feeStructureModel.id, id))
    .returning();
  return updated || null;
};

export const deleteFeeStructure = async (id: number) => {
  const [deleted] = await db
    .delete(feeStructureModel)
    .where(eq(feeStructureModel.id, id))
    .returning();
  return deleted || null;
};

// export const getFeesStructureById = async (
//     id: number,
// ): Promise<FeesStructureDto | null> => {
//     try {
//         const advanceCourse = alias(courseModel, "advanceCourse");
//         const feesStructures = await db
//             .select({
//                 id: feesStructureModel.id,
//                 closingDate: feesStructureModel.closingDate,
//                 academicYearId: feesStructureModel.academicYearId,
//                 courseId: feesStructureModel.courseId,
//                 semester: classModel.name,
//                 advanceForCourseId: feesStructureModel.advanceForCourseId,
//                 advanceForSemester: feesStructureModel.advanceForSemester,
//                 startDate: feesStructureModel.startDate,
//                 endDate: feesStructureModel.endDate,
//                 onlineStartDate: feesStructureModel.onlineStartDate,
//                 onlineEndDate: feesStructureModel.onlineEndDate,
//                 numberOfInstalments: feesStructureModel.numberOfInstalments,
//                 // instalmentStartDate: feesStructureModel.instalmentStartDate,
//                 // instalmentEndDate: feesStructureModel.instalmentEndDate,
//                 createdAt: feesStructureModel.createdAt,
//                 updatedAt: feesStructureModel.updatedAt,
//                 academicYear: academicYearModel,
//                 course: courseModel,
//                 advanceForCourse: advanceCourse,
//                 shiftId: feesStructureModel.shiftId,
//             })
//             .from(feesStructureModel)
//             .leftJoin(
//                 academicYearModel,
//                 eq(feesStructureModel.academicYearId, academicYearModel.id),
//             )
//             .leftJoin(classModel, eq(classModel.id, feesStructureModel.classId))
//             .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id))
//             .leftJoin(
//                 advanceCourse,
//                 eq(feesStructureModel.advanceForCourseId, advanceCourse.id),
//             )
//             .where(eq(feesStructureModel.id, id));

//         if (feesStructures.length === 0) {
//             return null;
//         }
//         const feesStructure = feesStructures[0];

//         if (!feesStructure.academicYear || !feesStructure.course) {
//             return null;
//         }

//         const components = await db
//             .select()
//             .from(feesComponentModel)
//             .where(eq(feesComponentModel.feesStructureId, feesStructure.id));
//         let shift: Shift | undefined = undefined;
//         if (feesStructure.shiftId) {
//             const [foundShift] = await db
//                 .select()
//                 .from(shiftModel)
//                 .where(eq(shiftModel.id, feesStructure.shiftId));
//             shift = foundShift;
//         }
//         const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(
//             feesStructure.id!,
//         );
//         const [fooundClass] = await db
//             .select()
//             .from(classModel)
//             .where(eq(classModel.name, feesStructure.semester!));

//         // Fetch instalments for this feesStructure
//         const instalments: Instalment[] = await db
//             .select()
//             .from(instalmentModel)
//             .where(eq(instalmentModel.feesStructureId, feesStructure.id));

//         return {
//             ...feesStructure,
//             feesSlabMappings,
//             class: fooundClass,
//             academicYear: feesStructure.academicYear,
//             course: feesStructure.course,
//             advanceForCourse: feesStructure.advanceForCourse,
//             components,
//             shift,
//             instalments,
//         };
//     } catch (error) {
//         return null;
//     }
// };

// export const getAcademicYearsFromFeesStructures = async (): Promise<
//     AcademicYear[]
// > => {
//     const academicYearIds = await db
//         .selectDistinct({
//             academicYearId: feesStructureModel.academicYearId,
//             id: feesStructureModel.id, // Include this for ORDER BY
//         })
//         .from(feesStructureModel)
//         .orderBy(desc(feesStructureModel.id));

//     return await db
//         .select()
//         .from(academicYearModel)
//         .where(
//             inArray(
//                 academicYearModel.id,
//                 academicYearIds.map((ay) => ay.academicYearId),
//             ),
//         );
// };

// export const getCoursesFromFeesStructures = async (
//     academicYearId: number,
// ): Promise<Course[]> => {
//     const courseIds = await db
//         .selectDistinct({
//             courseId: feesStructureModel.courseId,
//             id: feesStructureModel.id,
//         })
//         .from(feesStructureModel)
//         .where(eq(feesStructureModel.academicYearId, academicYearId))
//         .orderBy(desc(feesStructureModel.id));

//     return await db
//         .select()
//         .from(courseModel)
//         .where(
//             inArray(
//                 courseModel.id,
//                 courseIds.map((crs) => crs.courseId),
//             ),
//         );
// };

// export const getFeesStructuresByAcademicYearIdAndCourseId = async (
//     academicYearId: number,
//     courseId: number,
// ): Promise<FeesStructureDto[]> => {
//     const feesStructures = await db
//         .select()
//         .from(feesStructureModel)
//         .where(
//             and(
//                 eq(feesStructureModel.academicYearId, academicYearId),
//                 eq(feesStructureModel.courseId, courseId),
//             ),
//         )
//         .orderBy(desc(feesStructureModel.id));

//     const results = await Promise.all(
//         feesStructures.map(async (fs) => await modelToDto(fs)),
//     );
//     return results.filter(
//         (result): result is FeesStructureDto => result !== null,
//     );
// };

// export const createFeesStructure = async (
//     createFeesStructureDto: CreateFeesStructureDto,
// ) => {
//     try {
//         console.log(createFeesStructureDto);
//         const {
//             id,
//             components,
//             class: feesClassSem,
//             feesSlabMappings,
//             academicYear,
//             advanceForCourse,
//             shift,
//             createdAt,
//             updatedAt,
//             ...rest
//         } = createFeesStructureDto;

//         if (!academicYear?.id) {
//             throw new Error(
//                 "Academic Year and Course are required to create a fee structure.",
//             );
//         }

//         for (let i = 0; i < createFeesStructureDto.courses.length; i++) {
//             const course = createFeesStructureDto.courses[i];
//             if (!course.id) {
//                 throw new Error(`Course ID is required for course at index ${i}.`);
//             }
//             const [existing] = await db
//                 .select()
//                 .from(feesStructureModel)
//                 .where(
//                     and(
//                         eq(feesStructureModel.academicYearId, academicYear.id!),
//                         eq(feesStructureModel.courseId, course.id!),
//                         eq(feesStructureModel.classId, feesClassSem.id!),
//                         eq(feesStructureModel.shiftId, shift?.id!),
//                         eq(
//                             feesStructureModel.feesReceiptTypeId,
//                             createFeesStructureDto?.feesReceiptTypeId!,
//                         ),
//                     ),
//                 );

//             if (existing) {
//                 return null;
//             }

//             const dataToInsert: FeesStructure = {
//                 ...rest,
//                 classId: feesClassSem.id!,
//                 academicYearId: academicYear.id,
//                 courseId: course.id,
//                 advanceForCourseId: advanceForCourse?.id ?? null,
//                 shiftId: shift?.id!,
//             };

//             const [newFeesStructure] = await db
//                 .insert(feesStructureModel)
//                 .values(dataToInsert)
//                 .returning();

//             if (!newFeesStructure) {
//                 return null;
//             }

//             if (components && components.length > 0) {
//                 const newComponents = createFeesStructureDto.components.map((comp) => {
//                     const { id: compId, ...compRest } = comp;
//                     return { ...compRest, feesStructureId: newFeesStructure.id };
//                 });
//                 await db.insert(feesComponentModel).values(newComponents);
//             }

//             // Handle instalments creation
//             if (
//                 createFeesStructureDto.instalments &&
//                 createFeesStructureDto.instalments.length > 0
//             ) {
//                 const newInstalments = createFeesStructureDto.instalments.map(
//                     (inst) => {
//                         const { id: instId, ...instRest } = inst;
//                         // Convert all date fields to Date objects if needed
//                         const dateFields = [
//                             "startDate",
//                             "endDate",
//                             "onlineStartDate",
//                             "onlineEndDate",
//                             "createdAt",
//                             "updatedAt",
//                         ];
//                         for (const field of dateFields) {
//                             if (
//                                 (instRest as any)[field] &&
//                                 !((instRest as any)[field] instanceof Date)
//                             ) {
//                                 (instRest as any)[field] = new Date((instRest as any)[field]);
//                             }
//                         }
//                         return { ...instRest, feesStructureId: newFeesStructure.id };
//                     },
//                 );
//                 await db.insert(instalmentModel).values(newInstalments);
//             }

//             for (const feesSlabMapping of feesSlabMappings) {
//                 feesSlabMapping.feesStructureId = newFeesStructure.id;
//                 console.log("newFeesStructure.id:", newFeesStructure.id);
//                 const { id, ...rest } = feesSlabMapping;
//                 await createFeesSlabMapping({
//                     ...rest,
//                     feesStructureId: newFeesStructure.id,
//                 });
//             }
//         }

//         return true;
//     } catch (error) {
//         console.error("Error creating fees structure:", error);
//         return null;
//     }
// };

// export const updateFeesStructure = async (
//     id: number,
//     feesStructure: FeesStructureDto,
// ) => {
//     try {
//         const {
//             components,
//             academicYear,
//             course,
//             advanceForCourse,
//             class: feesClassSem,
//             shift,
//             createdAt,
//             updatedAt,
//             ...rest
//         } = feesStructure;

//         if (!academicYear?.id || !course?.id) {
//             throw new Error("Academic Year and Course are required.");
//         }

//         const dataToUpdate: FeesStructure = {
//             ...rest,
//             classId: feesClassSem.id!,
//             academicYearId: academicYear.id,
//             courseId: course.id,
//             advanceForCourseId: advanceForCourse?.id ?? null,
//             shiftId: shift?.id!,
//         };

//         const [updatedFeesStructure] = await db
//             .update(feesStructureModel)
//             .set(dataToUpdate)
//             .where(eq(feesStructureModel.id, id))
//             .returning();

//         if (!updatedFeesStructure) return null;

//         // Handle feesComponent update logic
//         if (components) {
//             // Fetch all existing component ids for this structure
//             const existingComponents = await db
//                 .select()
//                 .from(feesComponentModel)
//                 .where(eq(feesComponentModel.feesStructureId, id));
//             const existingComponentIds = existingComponents.map((c) => c.id);
//             const requestComponentIds = components
//                 .filter((c) => c.id)
//                 .map((c) => c.id);

//             // Update or create
//             for (const comp of components) {
//                 if (!comp.id || comp.id === 0) {
//                     // Create new
//                     const { id: compId, ...compRest } = comp;
//                     await db
//                         .insert(feesComponentModel)
//                         .values({ ...compRest, feesStructureId: updatedFeesStructure.id });
//                 } else {
//                     // Update existing
//                     let { createdAt, updatedAt, ...tmpComp } = comp;
//                     await db
//                         .update(feesComponentModel)
//                         .set(tmpComp)
//                         .where(eq(feesComponentModel.id, comp.id));
//                 }
//             }
//             // Delete components not present in request
//             const toDeleteComponentIds = existingComponentIds.filter(
//                 (id) => !requestComponentIds.includes(id),
//             );
//             if (toDeleteComponentIds.length > 0) {
//                 await db
//                     .delete(feesComponentModel)
//                     .where(
//                         and(
//                             eq(feesComponentModel.feesStructureId, id),
//                             inArray(feesComponentModel.id, toDeleteComponentIds),
//                         ),
//                     );
//             }
//         }

//         // Handle feesSlabMappings update logic
//         if (feesStructure.feesSlabMappings) {
//             // Fetch all existing mapping ids for this structure
//             const existingMappings = await db
//                 .select()
//                 .from(feesSlabMappingModel)
//                 .where(eq(feesSlabMappingModel.feesStructureId, id));
//             const existingMappingIds = existingMappings.map((m) => m.id);
//             const requestMappingIds = feesStructure.feesSlabMappings
//                 .filter((m) => m.id)
//                 .map((m) => m.id);

//             // Update or create
//             for (const mapping of feesStructure.feesSlabMappings) {
//                 if (!mapping.id || mapping.id === 0) {
//                     await createFeesSlabMapping({
//                         ...mapping,
//                         feesStructureId: updatedFeesStructure.id,
//                     });
//                 } else {
//                     let { createdAt, updatedAt, ...tmpMapping } = mapping;
//                     await db
//                         .update(feesSlabMappingModel)
//                         .set(tmpMapping)
//                         .where(eq(feesSlabMappingModel.id, mapping.id));
//                 }
//             }
//             // Delete mappings not present in request
//             const toDeleteMappingIds = existingMappingIds.filter(
//                 (id) => !requestMappingIds.includes(id),
//             );
//             if (toDeleteMappingIds.length > 0) {
//                 await db
//                     .delete(feesSlabMappingModel)
//                     .where(
//                         and(
//                             eq(feesSlabMappingModel.feesStructureId, id),
//                             inArray(feesSlabMappingModel.id, toDeleteMappingIds),
//                         ),
//                     );
//             }
//         }

//         // Handle instalments update logic
//         if (feesStructure.instalments) {
//             // Fetch all existing instalment ids for this structure
//             const existingInstalments = await db
//                 .select()
//                 .from(instalmentModel)
//                 .where(eq(instalmentModel.feesStructureId, id));
//             const existingInstalmentIds = existingInstalments.map((i) => i.id);
//             const requestInstalmentIds = feesStructure.instalments
//                 .filter((i) => i.id)
//                 .map((i) => i.id);

//             // Update or create
//             for (const inst of feesStructure.instalments) {
//                 // Convert all date fields to Date objects if needed
//                 const dateFields = [
//                     "startDate",
//                     "endDate",
//                     "onlineStartDate",
//                     "onlineEndDate",
//                     "createdAt",
//                     "updatedAt",
//                 ];
//                 for (const field of dateFields) {
//                     if ((inst as any)[field] && !((inst as any)[field] instanceof Date)) {
//                         (inst as any)[field] = new Date((inst as any)[field]);
//                     }
//                 }
//                 if (!inst.id || inst.id === 0) {
//                     // Create new
//                     const { id: instId, ...instRest } = inst;
//                     await db
//                         .insert(instalmentModel)
//                         .values({ ...instRest, feesStructureId: updatedFeesStructure.id });
//                 } else {
//                     // Update existing
//                     let { createdAt, updatedAt, ...tmpInst } = inst;
//                     await db
//                         .update(instalmentModel)
//                         .set(tmpInst)
//                         .where(eq(instalmentModel.id, inst.id));
//                 }
//             }
//             // Delete instalments not present in request
//             const toDeleteInstalmentIds = existingInstalmentIds.filter(
//                 (id) => !requestInstalmentIds.includes(id),
//             );
//             if (toDeleteInstalmentIds.length > 0) {
//                 await db
//                     .delete(instalmentModel)
//                     .where(
//                         and(
//                             eq(instalmentModel.feesStructureId, id),
//                             inArray(instalmentModel.id, toDeleteInstalmentIds),
//                         ),
//                     );
//             }
//         }

//         return getFeesStructureById(updatedFeesStructure.id);
//     } catch (error) {
//         console.error("Error updating fees structure:", error);
//         return null;
//     }
// };

// export const deleteFeesStructure = async (id: number) => {
//     try {
//         const deletedFeesStructure = await db
//             .delete(feesStructureModel)
//             .where(eq(feesStructureModel.id, id))
//             .returning();
//         return deletedFeesStructure[0];
//     } catch (error) {
//         return null;
//     }
// };

// export async function modelToDto(
//     model: FeesStructure,
// ): Promise<FeesStructureDto | null> {
//     try {
//         const [academicYear] = await db
//             .select()
//             .from(academicYearModel)
//             .where(eq(academicYearModel.id, model.academicYearId));

//         const [course] = await db
//             .select()
//             .from(courseModel)
//             .where(eq(courseModel.id, model.courseId));

//         let advanceForCourse = null;
//         if (model.advanceForCourseId) {
//             const [foundCourse] = await db
//                 .select()
//                 .from(courseModel)
//                 .where(eq(courseModel.id, model.advanceForCourseId));
//             advanceForCourse = foundCourse;
//         }

//         let shift = undefined;
//         if (model.shiftId) {
//             const [foundShift] = await db
//                 .select()
//                 .from(shiftModel)
//                 .where(eq(shiftModel.id, model.shiftId));
//             shift = foundShift;
//         }

//         let components: FeesComponent[] = [];
//         if (model.id) {
//             components = await db
//                 .select()
//                 .from(feesComponentModel)
//                 .where(eq(feesComponentModel.feesStructureId, model.id));
//         }

//         // Fetch instalments for this feesStructure
//         let instalments: Instalment[] = [];
//         if (model.id) {
//             instalments = await db
//                 .select()
//                 .from(instalmentModel)
//                 .where(eq(instalmentModel.feesStructureId, model.id));
//         }

//         if (!academicYear || !course) return null;
//         const feesSlabMappings = await getFeesSlabMappingsByFeesStructureId(
//             model.id!,
//         );
//         const { classId, ...rest } = model;
//         const foundClass = await findClassById(classId);

//         return {
//             ...rest,
//             class: foundClass,
//             academicYear,
//             course,
//             advanceForCourse,
//             components,
//             shift,
//             feesSlabMappings,
//             instalments,
//         };
//     } catch (error) {
//         console.error("Error in modelToDto:", error);
//         return null;
//     }
// }

// // export const getFeesDesignAbstractLevel = async (academicYearId?: number, courseId?: number): Promise<FeesDesignAbstractLevel[]> => {
// //     try {
// //         const conditions = [];
// //         if (academicYearId) {
// //             conditions.push(eq(feesStructureModel.academicYearId, academicYearId));
// //         }
// //         if (courseId) {
// //             conditions.push(eq(feesStructureModel.courseId, courseId));
// //         }

// //         const query = db.select({
// //             academicYear: academicYearModel,
// //             course: courseModel,
// //             semester: classModel.name,
// //             startDate: feesStructureModel.startDate,
// //             endDate: feesStructureModel.endDate,
// //         })
// //         .from(feesStructureModel)
// //         .leftJoin(academicYearModel, eq(feesStructureModel.academicYearId, academicYearModel.id))
// //         .leftJoin(classModel, eq(classModel.id, feesStructureModel.classId))
// //         .leftJoin(courseModel, eq(feesStructureModel.courseId, courseModel.id));

// //         if (conditions.length > 0) {
// //             // @ts-ignore
// //             query.where(and(...conditions));
// //         }

// //         const feesStructures = await query;

// //         const academicYearsMap = new Map<number, FeesDesignAbstractLevel>();

// //         for (const { academicYear, course, semester, startDate, endDate } of feesStructures) {
// //             if (!academicYear || !course) continue;

// //             if (!academicYearsMap.has(academicYear.id)) {
// //                 academicYearsMap.set(academicYear.id, {
// //                     academicYear,
// //                     courses: [],
// //                 });
// //             }

// //             const academicYearData = academicYearsMap.get(academicYear.id)!;
// //             let courseData = academicYearData.courses.find(c => c.id === course.id);

// //             if (!courseData) {
// //                 const batches = await db.select({
// //                     shift: shiftModel.name,
// //                 })
// //                 .from(batchModel)
// //                 .leftJoin(shiftModel, eq(batchModel.shiftId, shiftModel.id))
// //                 .where(eq(batchModel.courseId, course.id));

// //                 courseData = {
// //                     id: course.id,
// //                     name: course.name,
// //                     semesters: [],
// //                     shifts: batches.map(b => b.shift).filter((s): s is string => s !== null),
// //                     startDate: new Date(startDate),
// //                     endDate: new Date(endDate),
// //                 };
// //                 academicYearData.courses.push(courseData);
// //             }

// //             if (courseData && !courseData.semesters.includes(semester)) {
// //                 courseData.semesters.push(semester);
// //             }
// //         }

// //         return Array.from(academicYearsMap.values());
// //     } catch (error) {
// //         console.error(error);
// //         return [];
// //     }
// // };

// export const checkFeesStructureExists = async (
//     academicYearId: number,
//     courseId: number,
//     classId: number,
//     shiftId: number,
//     feesReceiptTypeId: number,
// ): Promise<boolean> => {
//     const [existing] = await db
//         .select()
//         .from(feesStructureModel)
//         .where(
//             and(
//                 eq(feesStructureModel.academicYearId, academicYearId),
//                 eq(feesStructureModel.courseId, courseId),
//                 eq(feesStructureModel.classId, classId),
//                 eq(feesStructureModel.shiftId, shiftId),
//                 eq(feesStructureModel.feesReceiptTypeId, feesReceiptTypeId),
//             ),
//         );
//     return !!existing;
// };
