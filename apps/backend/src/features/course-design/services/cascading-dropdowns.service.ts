import { db } from "@/db/index.js";
import { academicYearModel } from "@repo/db/schemas/models/academics";
import { marksheetPaperMappingModel } from "@repo/db/schemas/models/academics";
import { regulationTypeModel } from "@repo/db/schemas";
import { subjectModel } from "@repo/db/schemas";
import { affiliationModel } from "@repo/db/schemas";
import { paperModel } from "@repo/db/schemas";
import { and, eq } from "drizzle-orm";

// Get academic years based on affiliation
export async function getAcademicYearsByAffiliation(affiliationId: number) {
  try {
    // Get unique academic years that have papers for this affiliation
    const academicYears = await db
      .selectDistinct({
        id: academicYearModel.id,
        year: academicYearModel.year,
        isActive: academicYearModel.isCurrentYear,
      })
      .from(academicYearModel)
      .innerJoin(
        paperModel,
        eq(paperModel.academicYearId, academicYearModel.id),
      )
      .where(eq(paperModel.affiliationId, affiliationId));

    return academicYears;
  } catch (error) {
    console.error("Error getting academic years by affiliation:", error);
    throw error;
  }
}

// Get regulation types based on affiliation and academic year
export async function getRegulationTypesByAffiliationAndAcademicYear(
  affiliationId: number,
  academicYearId: number,
) {
  try {
    // Get unique regulation types that have papers for this affiliation and academic year
    const regulationTypes = await db
      .selectDistinct({
        id: regulationTypeModel.id,
        name: regulationTypeModel.name,
        code: regulationTypeModel.shortName,
      })
      .from(regulationTypeModel)
      .innerJoin(
        paperModel,
        eq(paperModel.regulationTypeId, regulationTypeModel.id),
      )
      .where(
        and(
          eq(paperModel.affiliationId, affiliationId),
          eq(paperModel.academicYearId, academicYearId),
        ),
      );

    return regulationTypes;
  } catch (error) {
    console.error(
      "Error getting regulation types by affiliation and academic year:",
      error,
    );
    throw error;
  }
}

// Get subjects based on affiliation, academic year, and regulation type
export async function getSubjectsByAffiliationAcademicYearAndRegulation(
  affiliationId: number,
  academicYearId: number,
  regulationTypeId: number,
) {
  try {
    // Get unique subjects that have papers for this combination
    const subjects = await db
      .selectDistinct({
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        description: subjectModel.name,
      })
      .from(subjectModel)
      .innerJoin(paperModel, eq(paperModel.subjectId, subjectModel.id))
      .where(
        and(
          eq(paperModel.affiliationId, affiliationId),
          eq(paperModel.academicYearId, academicYearId),
          eq(paperModel.regulationTypeId, regulationTypeId),
        ),
      );

    return subjects;
  } catch (error) {
    console.error(
      "Error getting subjects by affiliation, academic year, and regulation:",
      error,
    );
    throw error;
  }
}

// Get all available affiliations (for the first dropdown)
export async function getAvailableAffiliations() {
  try {
    // Get unique affiliations that have papers
    const affiliations = await db
      .selectDistinct({
        id: affiliationModel.id,
        name: affiliationModel.name,
        code: affiliationModel.shortName,
      })
      .from(affiliationModel)
      .innerJoin(paperModel, eq(paperModel.affiliationId, affiliationModel.id));

    return affiliations;
  } catch (error) {
    console.error("Error getting available affiliations:", error);
    throw error;
  }
}
