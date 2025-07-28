import { db } from "@/db/index.js";
import { paperModel, createPaperModel, Paper } from "@/features/course-design/models/paper.model.js";
import { PaperDto } from "@/types/course-design/index.type";
import { eq } from "drizzle-orm";
import { createPaperComponent, updatePaperComponent } from "./paper-component.service";
import { createTopic, updateTopic } from "./topic.service";

export async function createPaper(data: PaperDto) {
    const { id, createdAt, updatedAt, academicYear, classId, paperComponents, specialization, course, subject, topics, ...props } = data;
    const [created] = await db.insert(paperModel).values({...props, subjectPaperId: subject?.id!, courseId: course?.id!, classId}).returning();
    for (const component of paperComponents) {
        await createPaperComponent({...component, paperId: created.id!});
    }
    for (const topic of topics) {
        await createTopic({...topic, paperId: created.id!});
    }
    return created;
}

export async function getPaperById(id: number) {
    const [paper] = await db.select().from(paperModel).where(eq(paperModel.id, id));
    return paper;
}

export async function getAllPapers() {
    return db.select().from(paperModel);
}

export async function updatePaper(id: number, data: PaperDto) {
    const { id: idObj, createdAt, updatedAt, academicYear, classId, paperComponents, specialization, course, subject, topics, ...props } = data;
    const [updated] = await db
        .update(paperModel)
        .set({...props, subjectPaperId: subject?.id!, courseId: course?.id!, classId})
        .where(eq(paperModel.id, id))
        .returning();
    for (const component of paperComponents) {
        await updatePaperComponent(component.id!.toString(), {...component, paperId: updated.id!});
    }
    for (const topic of topics) {
        await updateTopic(topic.id!, {...topic, paperId: updated.id!});
    }
    return updated;
}

export async function deletePaper(id: number) {
    const [deleted] = await db.delete(paperModel).where(eq(paperModel.id, id)).returning();
    return deleted;
} 
