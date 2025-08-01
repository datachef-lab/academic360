import { db } from "@/db/index.js";
import { eq, and, ilike } from "drizzle-orm";
import { Paper, paperModel } from "../models/paper.model.js";
import { PaperDto } from "@/types/course-design/index.type.js";
import {
    createPaperComponent,
    // updatePaperComponent,
    // deletePaperComponent,
    findPaperComponentsByPaperId,
} from "./paper-component.service.js";
import { createTopic, getTopicsByPaperId, updateTopic } from "./topic.service.js";
import { paperComponentModel } from "../models/paper-component.model.js";
import { examComponentModel } from "../models/exam-component.model.js";
import { classModel } from "@/features/academics/models/class.model.js";
// import { findCourseById } from "./course.service";
// import { findAcademicYearById } from "@/features/academics/services/academic-year.service";
// import { findClassById } from "@/features/academics/services/class.service";
// import { getSubjectById } from "./subject.service";
// import { getAffiliationById } from "./affiliation.service";
// import { getRegulationTypeById } from "./regulation-type.service";
// import { getSubjectTypeById } from "./subject-type.service";
// import { getPaperComponentById } from "../controllers/paper-component.controller";

export async function createPaper(data: PaperDto) {
    const {
        id,
        createdAt,
        updatedAt,
        components,
        topics,
        ...props
    } = data;

    let [existingPaper] = await db
        .select()
        .from(paperModel)
        .where(
            and(
                eq(paperModel.code, data.code),
                eq(paperModel.subjectId, data.subjectId!),
                eq(paperModel.courseId, data.courseId!),
                eq(paperModel.classId, data.classId!),
                eq(paperModel.affiliationId, data.affiliationId),
                eq(paperModel.regulationTypeId, data.regulationTypeId),
                eq(paperModel.academicYearId, data?.academicYearId!),
                ilike(paperModel.name, data.name.trim()),
            ),
        );
    if (!existingPaper) {
        const [created] = await db
            .insert(paperModel)
            .values({
                ...props,
                subjectId: data?.subjectId!,
                affiliationId: data.affiliationId,
                regulationTypeId: data.regulationTypeId,
                academicYearId: data.academicYearId!,
                courseId: data.courseId!,
                classId: data.classId!,
            })
            .returning();
        existingPaper = created;
    }

    for (const component of components) {
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

export async function createPapers(data: PaperDto[]) {
    const createdPapers: Paper[] = [];

    for (const paper of data) {
        const [existingPaper] = await db
            .select()
            .from(paperModel)
            .where(
                and(
                    eq(paperModel.code, paper.code),
                    eq(paperModel.subjectId, paper.subjectId!),
                    eq(paperModel.courseId, paper.courseId!),
                    eq(paperModel.classId, paper.classId!),
                    eq(paperModel.affiliationId, paper.affiliationId),
                    eq(paperModel.regulationTypeId, paper.regulationTypeId),
                    eq(paperModel.academicYearId, paper.academicYearId!),
                ),
            );

        if (existingPaper) {
            console.log("Paper already exists:", existingPaper);
            createdPapers.push(existingPaper);
            continue; // Skip to the next paper if it already exists
        }

        const newPaper = await createPaper(paper);
        if (newPaper) {
            createdPapers.push(newPaper);
        }
    }

    return (
        await Promise.all(
            createdPapers.map(async (paper) => await modelToDto(paper)),
        )
    ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
}

export async function getPaperById(id: number) {
    // Fetch paper with all related data including direct foreign key relationships
    const [paper] = await db
        .select()
        .from(paperModel)
        .where(eq(paperModel.id, id));

    if (!paper) {
        return null;
    }

    // Return the complete paper object with components
    return await modelToDto(paper);
}

export async function getAllPapers() {
    const papers = await db.select().from(paperModel);

    return (
        await Promise.all(
            papers.map(async (paper) => await modelToDto(paper)),
        )
    ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
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

    return await modelToDto(updatedPaper);
}

export async function updatePaperWithComponents(id: number, data: Omit<PaperDto, "id" | "createdAt" | "updatedAt">) {
    console.log("Updating paper with components:", { id, data });
    console.log("Received data fields:", data);

    // const { academicYear, components, subject, } = data;

    // Find the class ID based on semester name
    console.log("Looking for class with name:", data.classId);
    const [classRecord] = await db
        .select()
        .from(classModel)
        .where(eq(classModel.id, data.classId!));

    if (!classRecord) {
        throw new Error(`Class not found for class id: ${data.classId}`);
    }
    console.log("Found class record:", classRecord);

    // Update the paper with all the mapping data directly
    const [updatedPaper] = await db
        .update(paperModel)
        .set({
            name: data.name,
            code: data.code,
            isOptional: data.isOptional,
            subjectId: data.subjectId,
            affiliationId: data.affiliationId,
            regulationTypeId: data.regulationTypeId,
            academicYearId: data.academicYearId,
            subjectTypeId: data.subjectTypeId,
            courseId: data.courseId,
            classId: classRecord.id,
            disabled: data.disabled,
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
        (component) => component?.fullMarks! > 0 || component?.credit! > 0,
    );

    console.log("Valid components to create:", validComponents);

    for (const componentData of validComponents) {
        await db.insert(paperComponentModel).values({
            paperId: id,
            examComponentId: componentData.examComponent.id!,
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
    return await modelToDto(updatedPaper);
}

export async function deletePaper(id: number) {
    const [deleted] = await db
        .delete(paperModel)
        .where(eq(paperModel.id, id))
        .returning();

    return await modelToDto(deleted);
}


export async function modelToDto(paper: Paper): Promise<PaperDto | null> {
    const components = await findPaperComponentsByPaperId(paper.id!);
    const topics = await getTopicsByPaperId(paper.id!);


    return {
        ...paper,
        topics,
        components,
    };
}