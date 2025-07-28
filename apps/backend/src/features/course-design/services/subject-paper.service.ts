import { db } from "@/db";
import { subjectPaperModel } from "@/features/course-design/models/subject-paper.model";
import { paperModel } from "@/features/course-design/models/paper.model";
import { paperComponentModel } from "@/features/course-design/models/paper-component.model";
import { subjectModel } from "@/features/course-design/models/subject.model";
import { subjectTypeModel } from "@/features/course-design/models/subject-type.model";
import { affiliationModel } from "@/features/course-design/models/affiliation.model";
import { regulationTypeModel } from "@/features/course-design/models/regulation-type.model";
import { academicYearModel } from "@/features/academics/models/academic-year.model";
import { examComponentModel } from "@/features/course-design/models/exam-component.model";
import { classModel } from "@/features/academics/models/class.model";
import { eq, ilike } from "drizzle-orm";
import type { SubjectPaper } from "@/features/course-design/models/subject-paper.model";

// Define proper types for bulk upload
export interface BulkUploadRow {
  [key: string]: string | number | boolean;
}

export interface BulkUploadError {
  row: number;
  data: BulkUploadRow;
  error: string;
}

export interface BulkUploadResult {
  success: BulkUploadRow[];
  errors: BulkUploadError[];
  unprocessedData: BulkUploadRow[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    unprocessed: number;
  };
}

export async function createSubjectPaper(data: Omit<SubjectPaper, 'id' | 'createdAt' | 'updatedAt'>) {
  const [result] = await db.insert(subjectPaperModel).values(data).returning();
  return result;
}

export async function getSubjectPaperById(id: number) {
  const [result] = await db.select().from(subjectPaperModel).where(eq(subjectPaperModel.id, id));
  return result;
}

export async function getAllSubjectPapers() {
  return await db.select().from(subjectPaperModel);
}

export async function updateSubjectPaper(id: number, data: Partial<SubjectPaper>) {
  const [result] = await db.update(subjectPaperModel).set(data).where(eq(subjectPaperModel.id, id)).returning();
  return result;
}

export async function deleteSubjectPaper(id: number) {
  const [result] = await db.delete(subjectPaperModel).where(eq(subjectPaperModel.id, id)).returning();
  return result;
}

export async function getSubjectPapersWithPapers() {
  const subjectPapers = await db
    .select({
      id: subjectPaperModel.id,
      subjectId: subjectPaperModel.subjectId,
      affiliationId: subjectPaperModel.affiliationId,
      regulationTypeId: subjectPaperModel.regulationTypeId,
      academicYearId: subjectPaperModel.academicYearId,
      sequence: subjectPaperModel.sequence,
      disabled: subjectPaperModel.disabled,
      createdAt: subjectPaperModel.createdAt,
      updatedAt: subjectPaperModel.updatedAt,
      // Paper details
      paperId: paperModel.id,
      paperName: paperModel.name,
      paperCode: paperModel.code,
      paperIsOptional: paperModel.isOptional,
      // Subject details
      subjectName: subjectModel.name,
      // Subject type details
      subjectTypeName: subjectTypeModel.name,
      // Course details
      courseName: subjectTypeModel.name, // This should be course name, but we're using subject type for now
      // Class details
      className: subjectTypeModel.name, // This should be class name, but we're using subject type for now
    })
    .from(subjectPaperModel)
    .leftJoin(paperModel, eq(subjectPaperModel.id, paperModel.subjectPaperId))
    .leftJoin(subjectModel, eq(subjectPaperModel.subjectId, subjectModel.id))
    .leftJoin(subjectTypeModel, eq(paperModel.subjectTypeId, subjectTypeModel.id))
    .leftJoin(classModel, eq(paperModel.classId, classModel.id));

  // For each subject paper, fetch its paper components
  const result = await Promise.all(
    subjectPapers.map(async (sp) => {
      if (sp.paperId) {
        const paperComponents = await db
          .select({
            examComponentId: paperComponentModel.examComponentId,
            fullMarks: paperComponentModel.fullMarks,
            credit: paperComponentModel.credit,
            examComponentName: examComponentModel.name,
            examComponentCode: examComponentModel.code,
          })
          .from(paperComponentModel)
          .leftJoin(examComponentModel, eq(paperComponentModel.examComponentId, examComponentModel.id))
          .where(eq(paperComponentModel.paperId, sp.paperId));

        return {
          ...sp,
          paperComponents,
        };
      }
      return {
        ...sp,
        paperComponents: [],
      };
    })
  );

  return result;
}

export async function bulkUploadSubjectPapers(data: BulkUploadRow[]): Promise<BulkUploadResult> {
  const success: BulkUploadRow[] = [];
  const errors: BulkUploadError[] = [];
  const unprocessedData: BulkUploadRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel rows start from 1, and we have header at row 1
    const rowErrors: string[] = [];

    try {
      // Find subject by name
      const subject = await db.select().from(subjectModel).where(ilike(subjectModel.name, row.Subject as string)).limit(1);
      if (subject.length === 0) {
        unprocessedData.push({ ...row, error: 'Subject not found' });
        continue;
      }

      // Find subject type by name
      const subjectType = await db.select().from(subjectTypeModel).where(ilike(subjectTypeModel.name, row['Subject Type'] as string)).limit(1);
      if (subjectType.length === 0) {
        unprocessedData.push({ ...row, error: 'Subject Type not found' });
        continue;
      }

      // Find affiliation by name
      const affiliation = await db.select().from(affiliationModel).where(ilike(affiliationModel.name, row.Affiliation as string)).limit(1);
      if (affiliation.length === 0) {
        unprocessedData.push({ ...row, error: 'Affiliation not found' });
        continue;
      }

      // Find regulation type by name
      const regulationType = await db.select().from(regulationTypeModel).where(ilike(regulationTypeModel.name, row.Regulation as string)).limit(1);
      if (regulationType.length === 0) {
        unprocessedData.push({ ...row, error: 'Regulation not found' });
        continue;
      }

      // Find academic year by year (if provided)
      let academicYear = null;
      if (row['Academic Year']) {
        const academicYearResult = await db.select().from(academicYearModel).where(ilike(academicYearModel.year, row['Academic Year'] as string)).limit(1);
        if (academicYearResult.length === 0) {
          unprocessedData.push({ ...row, error: 'Academic Year not found' });
          continue;
        }
        academicYear = academicYearResult[0];
      }

      // Check if paper code is unique
      const existingPaper = await db.select().from(paperModel).where(eq(paperModel.code, row['Paper Code'] as string)).limit(1);
      if (existingPaper.length > 0) {
        rowErrors.push('Paper Code already exists');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          data: row,
          error: rowErrors.join(', ')
        });
        continue;
      }

      // Create subject paper mapping
      const subjectPaperData = {
        subjectId: subject[0].id,
        affiliationId: affiliation[0].id,
        regulationTypeId: regulationType[0].id,
        academicYearId: academicYear?.id || 1, // Default to first academic year if not provided
        sequence: 1,
        disabled: false,
      };

      const [createdSubjectPaper] = await db.insert(subjectPaperModel).values(subjectPaperData).returning();

      // Create paper
      const paperData = {
        name: row['Paper Name'] as string,
        code: row['Paper Code'] as string,
        isOptional: (row['Is Optional'] as string)?.toLowerCase() === 'yes' || (row['Is Optional'] as string)?.toLowerCase() === 'true',
        subjectPaperId: createdSubjectPaper.id,
        courseId: 1, // Default course ID - will need to be updated based on applicable courses
        subjectTypeId: subjectType[0].id,
        classId: 1, // Default class ID - will need to be updated based on semester
      };

      const [createdPaper] = await db.insert(paperModel).values(paperData).returning();

      // Create paper components for exam components
      for (const examComponent of await db.select().from(examComponentModel)) {
        const fullMarksField = `Full Marks ${examComponent.code}`;
        const creditField = `Credit ${examComponent.code}`;
        
        const fullMarksValue = row[fullMarksField];
        const creditValue = row[creditField];
        
        if (fullMarksValue !== undefined && fullMarksValue !== null && fullMarksValue !== '') {
          await db.insert(paperComponentModel).values({
            paperId: createdPaper.id,
            examComponentId: examComponent.id,
            fullMarks: parseFloat(fullMarksValue as string) || 0,
            credit: parseFloat(creditValue as string) || 0,
          });
        }
      }

      success.push({ ...row, id: createdSubjectPaper.id });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        row: rowNumber,
        data: row,
        error: errorMessage
      });
    }
  }

  return {
    success,
    errors,
    unprocessedData,
    summary: {
      total: data.length,
      successful: success.length,
      failed: errors.length,
      unprocessed: unprocessedData.length,
    }
  };
} 