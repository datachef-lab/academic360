import { db } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import { subjectMetadataModel } from "../models/subjectMetadata.model";

export async function addSubjectMetadata(subjectMetadata: any): Promise<any | null> {
  const [newSubjectMetadata] = await db.insert(subjectMetadataModel).values(subjectMetadata).returning();
  return newSubjectMetadata;
}

export async function findAllSubjectMetadata(subjectMetadataModel: any): Promise<any | null> {
  const records = await db.select().from(subjectMetadataModel);
  return records;
}

export async function findSubjectMetadataById(id: number) {
  const [existingSubject] = await db
    .select()
    .from(subjectMetadataModel)
    .where(eq(subjectMetadataModel.id, Number(id)));
  return existingSubject;
}

export async function findSubjectMetadataByStreamId(streamId: number) {
  const [existingSubject] = await db
    .select()
    .from(subjectMetadataModel)
    .where(eq(subjectMetadataModel.streamId, Number(streamId)));
  return existingSubject;
}

export async function findSubjectMetadataBySemester(semester: number) {
  const records = await db
    .select()
    .from(subjectMetadataModel)
    .where(eq(subjectMetadataModel.semester, Number(semester)));
  return records;
}

export async function findSubjectMetadataByStreamIdAndSemester(streamId: number, semester: number) {
  const records = await db
    .select()
    .from(subjectMetadataModel)
    .where(
      and(eq(subjectMetadataModel.streamId, Number(streamId)), eq(subjectMetadataModel.semester, Number(semester)))
    );
  return records;
}

export async function modifySubjectMetadata(updatedData: any, id: number) {
  const [updatedRecord] = await db
    .update(subjectMetadataModel)
    .set(updatedData)
    .where(eq(subjectMetadataModel.id, Number(id)))
    .returning();
  return updatedRecord;
}

export async function removeSubjectMetadata(id: number) {
  const deletedRecord = await db
    .delete(subjectMetadataModel)
    .where(eq(subjectMetadataModel.id, Number(id)))
    .returning();
  return deletedRecord;
}
