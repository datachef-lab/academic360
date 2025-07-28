// import { db } from "@/db/index.js";
// import { studyMaterialModel } from "../models/study-material.model.js";
// import { eq } from "drizzle-orm";
// import path from "path";
// import fs from "fs";

// const STUDY_MATERIAL_BASE_PATH = process.env.STUDY_MATERIAL_BASE_PATH!;

// export async function createStudyMaterial(data: any) {
//     // If type is FILE, move the file to the correct location and set filePath/url
//     if (data.type === "FILE" && data.file) {
//         const batchPaperId = data.batchPaperId;
//         const file = data.file; // { originalname, path, ... }
//         const destDir = path.join(STUDY_MATERIAL_BASE_PATH, String(batchPaperId));
//         if (!fs.existsSync(destDir)) {
//             fs.mkdirSync(destDir, { recursive: true });
//         }
//         const destPath = path.join(destDir, file.originalname);
//         fs.renameSync(file.path, destPath);
//         data.filePath = destPath;
//         data.url = `${STUDY_MATERIAL_BASE_PATH}/${batchPaperId}/${file.originalname}`;
//         delete data.file; // Remove file info from DB insert
//     }
//     const [created] = await db.insert(studyMaterialModel).values(data).returning();
//     return created;
// }

// export async function getAllStudyMaterials() {
//     return db.select().from(studyMaterialModel);
// }

// export async function getStudyMaterialById(id: number) {
//     const [material] = await db.select().from(studyMaterialModel).where(eq(studyMaterialModel.id, id));
//     return material;
// }

// export async function updateStudyMaterial(id: number, data: any) {
//     const [updated] = await db.update(studyMaterialModel).set(data).where(eq(studyMaterialModel.id, id)).returning();
//     return updated;
// }

// export async function deleteStudyMaterial(id: number) {
//     const [deleted] = await db.delete(studyMaterialModel).where(eq(studyMaterialModel.id, id)).returning();
//     return deleted;
// }
