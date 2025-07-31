import { db } from "@/db/index.js";
import { eq, and, ilike } from "drizzle-orm";
import { paperModel } from "../models/paper.model";
import { PaperDto } from "@/types/course-design/index.type";
import {
  createPaperComponent,
  updatePaperComponent,
  deletePaperComponent,
} from "./paper-component.service";
import { createTopic, updateTopic } from "./topic.service";
import { paperComponentModel } from "../models/paper-component.model";
import { examComponentModel } from "../models/exam-component.model";
import { classModel } from "@/features/academics/models/class.model";

export async function createPaper(data: PaperDto) {
  const {
    id,
    createdAt,
    updatedAt,
    academicYear,
    classId,
    paperComponents,
    specialization,
    course,
    subject,
    topics,
    ...props
  } = data;

  let [existingPaper] = await db
    .select()
    .from(paperModel)
    .where(
      and(
        eq(paperModel.code, data.code),
        eq(paperModel.subjectId, subject?.id!),
        eq(paperModel.courseId, course?.id!),
        eq(paperModel.classId, classId!),
        ilike(paperModel.name, data.name.trim()),
      ),
    );
  if (!existingPaper) {
    const [created] = await db
      .insert(paperModel)
      .values({
        ...props,
        subjectId: subject?.id!,
        affiliationId: data.affiliationId,
        regulationTypeId: data.regulationTypeId,
        academicYearId: data.academicYear?.id!,
        courseId: course?.id!,
        classId,
      })
      .returning();
    existingPaper = created;
  }

  for (const component of paperComponents) {
    // Only create components with valid marks and credit
    if ((component.fullMarks || 0) > 0 && (component.credit || 0) > 0) {
      await createPaperComponent({ ...component, paperId: existingPaper.id! });
    }
  }
  for (const topic of topics) {
    await createTopic({ ...topic, paperId: existingPaper.id! });
  }
  return existingPaper;
}

export async function getPaperById(id: number) {
  // Fetch paper with all related data including direct foreign key relationships
  const [paper] = await db
    .select({
      // Paper fields
      id: paperModel.id,
      name: paperModel.name,
      code: paperModel.code,
      isOptional: paperModel.isOptional,
      disabled: paperModel.disabled,
      sequence: paperModel.sequence,
      createdAt: paperModel.createdAt,
      updatedAt: paperModel.updatedAt,

      // Direct foreign key relationships (no subjectPaperId needed)
      subjectId: paperModel.subjectId,
      affiliationId: paperModel.affiliationId,
      regulationTypeId: paperModel.regulationTypeId,
      academicYearId: paperModel.academicYearId,
      subjectTypeId: paperModel.subjectTypeId,
      courseId: paperModel.courseId,
      classId: paperModel.classId,

      // Class name for semester display
      className: classModel.name,
    })
    .from(paperModel)
    .leftJoin(classModel, eq(paperModel.classId, classModel.id))
    .where(eq(paperModel.id, id));

  if (!paper) {
    return null;
  }

  // Fetch paper components with exam component details
  const paperComponents = await db
    .select({
      id: paperComponentModel.id,
      paperId: paperComponentModel.paperId,
      examComponentId: paperComponentModel.examComponentId,
      fullMarks: paperComponentModel.fullMarks,
      credit: paperComponentModel.credit,
      createdAt: paperComponentModel.createdAt,
      updatedAt: paperComponentModel.updatedAt,

      // Exam component details
      examComponentName: examComponentModel.name,
      examComponentShortName: examComponentModel.shortName,
      examComponentCode: examComponentModel.code,
    })
    .from(paperComponentModel)
    .leftJoin(
      examComponentModel,
      eq(paperComponentModel.examComponentId, examComponentModel.id),
    )
    .where(eq(paperComponentModel.paperId, id));

  // Return the complete paper object with components
  return {
    ...paper,
    paperComponents,
  };
}

export async function getAllPapers() {
  return db.select().from(paperModel);
}

export async function updatePaper(id: number, data: PaperDto) {
  const [updatedPaper] = await db
    .update(paperModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(paperModel.id, id))
    .returning();

  return updatedPaper;
}

export async function updatePaperWithComponents(
  id: number,
  data: {
    paperName: string;
    subjectId: number;
    affiliationId: number;
    regulationTypeId: number;
    academicYearId: number;
    courseId: number;
    subjectTypeId: number;
    semester: string;
    paperCode: string;
    isOptional: boolean;
    isActive: boolean;
    components: Array<{
      examComponentId: number;
      fullMarks: number;
      credit: number;
    }>;
  },
) {
  console.log("Updating paper with components:", { id, data });
  console.log("Received data fields:", {
    paperName: data.paperName,
    subjectId: data.subjectId,
    affiliationId: data.affiliationId,
    regulationTypeId: data.regulationTypeId,
    academicYearId: data.academicYearId,
    courseId: data.courseId,
    subjectTypeId: data.subjectTypeId,
    semester: data.semester,
    paperCode: data.paperCode,
    isOptional: data.isOptional,
    isActive: data.isActive,
    componentsCount: data.components.length,
  });

  // Find the class ID based on semester name
  console.log("Looking for class with name:", data.semester);
  const [classRecord] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.name, data.semester));

  if (!classRecord) {
    throw new Error(`Class not found for semester: ${data.semester}`);
  }
  console.log("Found class record:", classRecord);

  // Update the paper with all the mapping data directly
  const [updatedPaper] = await db
    .update(paperModel)
    .set({
      name: data.paperName,
      code: data.paperCode,
      isOptional: data.isOptional,
      subjectId: data.subjectId,
      affiliationId: data.affiliationId,
      regulationTypeId: data.regulationTypeId,
      academicYearId: data.academicYearId,
      subjectTypeId: data.subjectTypeId,
      courseId: data.courseId,
      classId: classRecord.id,
      disabled: !data.isActive, // Convert isActive to disabled (inverted)
      updatedAt: new Date(),
    })
    .where(eq(paperModel.id, id))
    .returning();

  console.log("Updated paper:", updatedPaper);

  // Delete existing paper components
  await db
    .delete(paperComponentModel)
    .where(eq(paperComponentModel.paperId, id));

  console.log("Deleted existing paper components");

  // Create new paper components
  const validComponents = data.components.filter(
    (component) => component.fullMarks > 0 || component.credit > 0,
  );

  console.log("Valid components to create:", validComponents);

  for (const componentData of validComponents) {
    await db.insert(paperComponentModel).values({
      paperId: id,
      examComponentId: componentData.examComponentId,
      fullMarks: componentData.fullMarks,
      credit: componentData.credit,
    });
  }

  console.log("Created new paper components");

  const result = {
    paper: updatedPaper,
    components: validComponents,
  };

  console.log("Final result:", result);
  return result;
}

export async function deletePaper(id: number) {
  const [deleted] = await db
    .delete(paperModel)
    .where(eq(paperModel.id, id))
    .returning();
  return deleted;
}
