import { db } from "@/db/index.js";
import { PaperComponent, paperComponentModel } from "../models/paper-component.model.js";
import { and, countDistinct, eq } from "drizzle-orm";
import { PaperComponentDto } from "@/types/course-design/index.type";
import { findExamComponentById } from "./exam-component.service.js";
import { marksheetPaperComponentMappingModel } from "@/features/academics/models/marksheet-paper-component-mapping.model.js";

// Create a new paper component
export const createPaperComponent = async (paperComponentData: PaperComponentDto) => {
    const { id, createdAt, updatedAt, examComponent, ...props } = paperComponentData;
    let [existingPaperComponent] = await db
        .select().from(paperComponentModel)
        .where(
            and(
                eq(paperComponentModel.examComponentId, examComponent?.id!),
                eq(paperComponentModel.paperId, paperComponentData.paperId!)
            )
        );
    if (!existingPaperComponent) {
        const [newPaperComponent] = await db.insert(paperComponentModel).values({ ...props, examComponentId: examComponent?.id! }).returning();
        existingPaperComponent = newPaperComponent;
    }
    return existingPaperComponent;
};

// Get all paper components
export const getAllPaperComponents = async () => {
    const allPaperComponents = await db.select().from(paperComponentModel);
    return allPaperComponents;
};

// Get paper component by ID
export const getPaperComponentById = async (id: string) => {
    const paperComponent = await db
        .select()
        .from(paperComponentModel)
        .where(eq(paperComponentModel.id, +id));
    return paperComponent.length > 0 ? paperComponent[0] : null;
};

export async function findPaperComponentsByPaperId(paperId: number) {
    const paperComponents = await db
        .select()
        .from(paperComponentModel)
        .where(eq(paperComponentModel.paperId, paperId));
    return (await Promise.all(
        paperComponents.map(async (comp) => await modelToDto(comp))
    )).filter((comp) => comp !== null);
}

// Update paper component
export const updatePaperComponent = async (id: string, paperComponentData: PaperComponentDto) => {
    const { id: idObj, createdAt, updatedAt, examComponent, ...props } = paperComponentData;
    const updatedPaperComponent = await db
        .update(paperComponentModel)
        .set({ ...props, examComponentId: examComponent?.id! })
        .where(eq(paperComponentModel.id, +id))
        .returning();
    const paperComponent = updatedPaperComponent.length > 0 ? updatedPaperComponent[0] : null;
    return paperComponent ? await modelToDto(paperComponent) : null;
};

// Delete paper component
export const deletePaperComponent = async (id: string) => {
    const deletedPaperComponent = await db
        .delete(paperComponentModel)
        .where(eq(paperComponentModel.id, +id))
        .returning();
    return deletedPaperComponent.length > 0 ? deletedPaperComponent[0] : null;
};

export const deletePaperComponentSafe = async (id: string) => {
    const [found] = await db.select().from(paperComponentModel).where(eq(paperComponentModel.id, +id));
    if (!found) return null;
    const [{ mksCompCount }] = await db
        .select({ mksCompCount: countDistinct(marksheetPaperComponentMappingModel.id) })
        .from(marksheetPaperComponentMappingModel)
        .where(eq(marksheetPaperComponentMappingModel.paperComponentId, +id));

    if (mksCompCount > 0) {
        return {
            success: false,
            message: "Cannot delete paper-component. It is associated with other records.",
            records: [{ count: mksCompCount, type: "Mks-paper-component" }],
        };
    }

    const deletedPaperComponent = await db
        .delete(paperComponentModel)
        .where(eq(paperComponentModel.id, +id))
        .returning();
    if (deletedPaperComponent.length > 0) {
        return { success: true, message: "Paper-component deleted successfully.", records: [] };
    }
    return { success: false, message: "Failed to delete paper-component.", records: [] };
};


export async function modelToDto(paperComponent: PaperComponent): Promise<PaperComponentDto | null> {
    const { examComponentId, ...props } = paperComponent;

    const examComponent = (await findExamComponentById(examComponentId.toString()))!;

    return {
        ...props,
        examComponent,
    };
}