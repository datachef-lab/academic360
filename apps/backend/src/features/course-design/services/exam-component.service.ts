import { db } from "@/db/index.js";
import { ExamComponent, examComponentModel } from "../models/exam-component.model.js";
import { eq } from "drizzle-orm";
import { ExamComponentSchema } from "@/types/course-design/index.js";
import { z } from "zod";

const defaultExamComponents: ExamComponent[] = [
    {
        name: "Theoretical",
        shortName: "Theory",
        code: "TH",
        sequence: 1,
        disabled: false,
    },
    {
        name: "Practical",
        shortName: "Practical",
        code: "PR",
        sequence: 2,
        disabled: false,
    },
    {
        name: "Tutorial",
        shortName: "Tutorial",
        code: "TU",
        sequence: 5,
        disabled: false,
    },
    {
        name: "Viva",
        shortName: "Viva",
        code: "VIVA",
        sequence: 3,
        disabled: false,
    },

    {
        name: "Project",
        shortName: "Project",
        code: "PROJ",
        sequence: 4,
        disabled: false,
    },
]

export const createDefaultExamComponents = async () => {
    console.log("Creating default exam components");
    const examComponents = await db.select().from(examComponentModel);
    if (examComponents.length > 0) {
        return examComponents;
    }
    const newExamComponents = await db.insert(examComponentModel).values(defaultExamComponents).returning();
    return newExamComponents;
};

// Types
export type ExamComponentData = z.infer<typeof ExamComponentSchema>;

// Create a new exam component
export const createExamComponent = async (examComponentData: ExamComponent) => {
    const { id, createdAt, updatedAt, ...props } = examComponentData;
    const newExamComponent = await db.insert(examComponentModel).values(props).returning();
    return newExamComponent[0];
};

// Get all exam components
export const getAllExamComponents = async () => {
    const allExamComponents = await db.select().from(examComponentModel);
    console.log("allExamComponents:", allExamComponents);
    return allExamComponents;
};

// Get exam component by ID
export const findExamComponentById = async (id: string) => {
    const examComponent = await db
        .select()
        .from(examComponentModel)
        .where(eq(examComponentModel.id, +id));
    return examComponent.length > 0 ? examComponent[0] : null;
};

// Update exam component
export const updateExamComponent = async (id: string, examComponentData: ExamComponent) => {
    const { id: idObj, createdAt, updatedAt, ...props } = examComponentData;
    const updatedExamComponent = await db
        .update(examComponentModel)
        .set(props)
        .where(eq(examComponentModel.id, +id))
        .returning();
    return updatedExamComponent.length > 0 ? updatedExamComponent[0] : null;
};

// Delete exam component
export const deleteExamComponent = async (id: string) => {
    const deletedExamComponent = await db
        .delete(examComponentModel)
        .where(eq(examComponentModel.id, +id))
        .returning();
    return deletedExamComponent.length > 0 ? deletedExamComponent[0] : null;
};
