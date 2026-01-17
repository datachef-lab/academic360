import { db } from "@/db/index.js";
import {
  academicYearModel,
  AcademicYear,
} from "@repo/db/schemas/models/academics";
import { eq, and, desc, or, count, countDistinct } from "drizzle-orm";
import { Session, sessionModel } from "@repo/db/schemas/models/academics";
import { marksheetPaperMappingModel } from "@repo/db/schemas/models/academics";
import { noticeModel } from "@repo/db/schemas/models/academics";

import { paperModel } from "@repo/db/schemas/models/course-design";
// import { feesStructureModel } from "@repo/db/schemas/models/fees";
import { admissionModel } from "@repo/db/schemas";

export async function createAcademicYear(
  academicYear: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">,
  session: Omit<Session, "id" | "createdAt" | "updatedAt">,
): Promise<AcademicYear | null> {
  const [newAcademicYear] = await db
    .insert(academicYearModel)
    .values(academicYear)
    .returning();

  return await newAcademicYear;
}

export async function findAllAcademicYears(): Promise<AcademicYear[]> {
  const academicYears = await db
    .select()
    .from(academicYearModel)
    .orderBy(desc(academicYearModel.year));
  return academicYears.filter((year) => year !== null);
}

export async function findAcademicYearById(
  id: number,
): Promise<AcademicYear | null> {
  const [academicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, id));
  return academicYear;
}

export async function findCurrentAcademicYear(): Promise<AcademicYear | null> {
  const [academicYear] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.isCurrentYear, true));
  return academicYear || null;
}

export async function updateAcademicYear(
  id: number,
  academicYear: Partial<AcademicYear>,
): Promise<AcademicYear | null> {
  const [updatedAcademicYear] = await db
    .update(academicYearModel)
    .set(academicYear)
    .where(eq(academicYearModel.id, id))
    .returning();

  return await updatedAcademicYear;
}

export async function deleteAcademicYear(id: number) {
  const foundAcademicYear = await findAcademicYearById(id);
  if (!foundAcademicYear) {
    return null;
  }

  const [{ mksCount }] = await db
    .select({
      mksCount: countDistinct(marksheetPaperMappingModel.marksheetId),
    })
    .from(marksheetPaperMappingModel)
    .where(
      or(
        eq(marksheetPaperMappingModel.yearOfAppearanceId, id),
        eq(marksheetPaperMappingModel.yearOfPassingId, id),
      ),
    );

  const [{ noticeCount }] = await db
    .select({
      noticeCount: countDistinct(noticeModel.id),
    })
    .from(noticeModel)
    .where(eq(noticeModel.academicYearId, id));

  const [{ sessionCount }] = await db
    .select({
      sessionCount: countDistinct(sessionModel.id),
    })
    .from(sessionModel)
    .where(eq(sessionModel.academicYearId, id));

  const [{ admissionCount }] = await db
    .select({
      admissionCount: countDistinct(admissionModel.id),
    })
    .from(admissionModel)
    .where(eq(admissionModel.sessionId, 0));

  const [{ paperCount }] = await db
    .select({
      paperCount: countDistinct(paperModel.id),
    })
    .from(paperModel)
    .where(eq(paperModel.academicYearId, id));

  //   const [{ feesStructureCount }] = await db
  //     .select({
  //       feesStructureCount: countDistinct(feesStructureModel.id),
  //     })
  //     .from(feesStructureModel)
  //     .where(eq(feesStructureModel.academicYearId, id));

  // Check if the academic year is associated with any records
  if (
    mksCount > 0 ||
    noticeCount > 0 ||
    sessionCount > 0 ||
    admissionCount > 0 ||
    paperCount > 0
    // feesStructureCount > 0
  ) {
    return {
      success: false,
      message:
        "Cannot delete academic year. It is associated with other records.",
      records: [
        { count: mksCount, type: "Marksheets" },
        { count: noticeCount, type: "Notices" },
        { count: sessionCount, type: "Sessions" },
        { count: admissionCount, type: "Admissions" },
        { count: paperCount, type: "Papers" },
        // { count: feesStructureCount, type: "Fees Structures" },
      ],
    };
  }

  // If no associations, proceed with deletion
  const [deletedAcademicYear] = await db
    .delete(academicYearModel)
    .where(eq(academicYearModel.id, id))
    .returning();
  if (deletedAcademicYear) {
    return {
      success: true,
      message: "Academic year deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete academic year.",
    records: [],
  };
}

export async function setCurrentAcademicYear(
  id: number,
): Promise<AcademicYear | null> {
  // First, set all academic years to not current
  await db
    .update(academicYearModel)
    .set({ isCurrentYear: false })
    .where(eq(academicYearModel.isCurrentYear, true));

  // Then set the specified academic year as current
  const [currentAcademicYear] = await db
    .update(academicYearModel)
    .set({ isCurrentYear: true })
    .where(eq(academicYearModel.id, id))
    .returning();

  return currentAcademicYear || null;
}

export async function findAcademicYearByYearRange(
  year: string,
  endYear: string,
): Promise<AcademicYear | null> {
  const [academicYear] = await db
    .select()
    .from(academicYearModel)
    .where(
      and(
        eq(academicYearModel.year, year),
        // eq(academicYearModel.endYear, endYear)
      ),
    );

  return academicYear;
}
