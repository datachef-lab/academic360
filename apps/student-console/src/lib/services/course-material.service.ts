import { query } from "@/db";
import { DbCourseMaterial } from "@/types/academics/course-material";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { ResultSetHeader } from "mysql2";
import { mkdir } from "fs/promises";

const COURSE_MATERIAL_PATH = process.env.COURSE_MATERIAL_PATH!;

export async function findCourseMaterialBySubject(subjectId: number) {
    const sqlQuery = `
        SELECT * FROM course_materials WHERE subject_id_fk = ?
    `;

    try {
        console.log(`Fetching materials for subject ${subjectId}`);
        const results = await query(sqlQuery, [subjectId]) as DbCourseMaterial[];
        console.log("Found course materials:", results);
        return results ?? [];
    } catch (error) {
        console.error(`Error fetching materials for subject ${subjectId}:`, error);
        return [];
    }
}

// export async function addCourseMaterial(courseMaterial: DbCourseMaterial, files?: File[]) {
//     // Step 1: Add the material-item in the database
//     const sqlQuery = `
//         INSERT INTO course_materials (
//             subject_id_fk, 
//             type,
//             title,
//             url,
//             file_path,
//             created_at,
//             updated_at
//         )
//         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
//     `;

//     try {
//         let filePath = null;

//         // Step 2: Handle file upload if files are provided
//         if (files && files.length > 0) {
//             const file = files[0];
//             const fileName = `${Date.now()}-${file.name}`;

//             // First insert to get the ID
//             const result = await query(sqlQuery, [
//                 courseMaterial.subject_id_fk,
//                 courseMaterial.type,
//                 courseMaterial.title,
//                 courseMaterial.url,
//                 null, // Initially null, will update after file upload
//             ]) as [ResultSetHeader, FieldPacket[]];

//             // Get the inserted ID
//             const insertedId = result[0].insertId;

//             // Create directory path with the ID
//             const dirPath = path.join(COURSE_MATERIAL_PATH, insertedId.toString());
//             filePath = path.join(dirPath, fileName);

//             // Convert File to Buffer and save to disk
//             const buffer = Buffer.from(await file.arrayBuffer());
//             await writeFile(filePath, buffer);

//             // Update the file_path in database
//             const updateQuery = `
//                 UPDATE course_materials
//                 SET file_path = ? 
//                 WHERE id = ?
//             `;
//             await query(updateQuery, [filePath, insertedId]);

//             console.log("File uploaded and database updated:", filePath);
//             return result[0];
//         }

//         // If no file, just insert the record
//         const result = await query(sqlQuery, [
//             courseMaterial.subject_id_fk,
//             courseMaterial.type,
//             courseMaterial.title,
//             courseMaterial.url,
//             filePath,
//         ]) as [ResultSetHeader, FieldPacket[]];

//         console.log("Inserted course material:", result[0]);
//         return result[0];
//     } catch (error) {
//         console.error("Error inserting course material:", error);
//         throw error; // Re-throw to handle in the UI
//     }
// }

export async function addCourseMaterial(courseMaterial: DbCourseMaterial, files?: File[]) {
    // Step 1: Add the material-item in the database
    const sqlQuery = `
        INSERT INTO course_materials (
            subject_id_fk, 
            type,
            title,
            url,
            file_path,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
        let filePath = null;

        // Step 2: Handle file upload if files are provided
        if (files && files.length > 0) {
            const file = files[0];
            console.log("Processing file:", file.name, file.size, "bytes");
            const fileName = `${Date.now()}-${file.name}`;

            // First insert to get the ID
            const result = await query(sqlQuery, [
                courseMaterial.subject_id_fk,
                courseMaterial.type,
                courseMaterial.title,
                courseMaterial.url,
                null, // Initially null, will update after file upload
            ]) as unknown as ResultSetHeader;
            console.log("inserted result:", result);
            // Get the inserted ID
            const insertedId = result.insertId;
            console.log("Inserted record with ID:", insertedId);

            // Create directory path with the ID
            const dirPath = path.join(COURSE_MATERIAL_PATH, insertedId.toString());

            // Ensure directory exists
            try {
                await mkdir(dirPath, { recursive: true });
                console.log("Created directory:", dirPath);
            } catch (err) {
                console.error("Error creating directory:", err);
            }

            filePath = path.join(dirPath, fileName);
            console.log("Target file path:", filePath);

            try {
                // Convert File to Buffer and save to disk
                const buffer = Buffer.from(await file.arrayBuffer());
                await writeFile(filePath, buffer);
                console.log("Successfully wrote file to disk:", filePath);

                // Update the file_path in database
                const updateQuery = `
                    UPDATE course_materials
                    SET file_path = ? 
                    WHERE id = ?
                `;
                await query(updateQuery, [filePath, insertedId]);
                console.log("Updated record with file path");
            } catch (err) {
                console.error("Error saving file:", err);
            }

            // Return a serializable object
            return {
                id: insertedId,
                subject_id_fk: courseMaterial.subject_id_fk,
                title: courseMaterial.title,
                type: courseMaterial.type,
                url: courseMaterial.url || "",
                file_path: filePath,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }

        // If no file, just insert the record
        const result = await query(sqlQuery, [
            courseMaterial.subject_id_fk,
            courseMaterial.type,
            courseMaterial.title,
            courseMaterial.url,
            filePath,
        ]) as unknown as ResultSetHeader;

        console.log("Inserted course material:", result);

        // Return a serializable object
        return {
            id: result.insertId,
            subject_id_fk: courseMaterial.subject_id_fk,
            title: courseMaterial.title,
            type: courseMaterial.type,
            url: courseMaterial.url || "",
            file_path: filePath,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error inserting course material:", error);
        throw error; // Re-throw to handle in the UI
    }
}

export async function deleteCourseMaterial(id: number) {
    try {
        // Step 1: Get the material to find the file path
        const getMaterialQuery = `
            SELECT file_path FROM course_materials WHERE id = ?
        `;
        const results = await query(getMaterialQuery, [id]);
        const material = Array.isArray(results) && results.length > 0 ? results[0][0] : null;

        if (material?.file_path) {
            // Step 2: Delete the file from the server
            try {
                await unlink(material.file_path);
                console.log(`Deleted file: ${material.file_path}`);
            } catch (error) {
                console.error(`Error deleting file: ${material.file_path}`, error);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Step 3: Delete from the database
        const deleteQuery = `
            DELETE FROM course_materials WHERE id = ?
        `;
        const result = await query(deleteQuery, [id]);
        console.log("Deleted course material:", result);
        return result;
    } catch (error) {
        console.error("Error deleting course material:", error);
        return null;
    }
}

// Add this new function to fetch materials for multiple subjects
export async function findCourseMaterialsBySubjects(subjectIds: number[]) {
    if (!subjectIds.length) return [];

    // Create placeholders for the SQL IN clause
    const placeholders = subjectIds.map(() => '?').join(',');

    const sqlQuery = `
        SELECT * FROM course_materials WHERE subject_id_fk IN (${placeholders})
    `;

    try {
        console.log(`Fetching materials for ${subjectIds.length} subjects in batch: ${subjectIds.join(', ')}`);
        const results = await query(sqlQuery, subjectIds) as DbCourseMaterial[];
        console.log(`Found ${results.length} materials for the requested subjects`);
        return results ?? [];
    } catch (error) {
        console.error(`Error fetching materials for subjects [${subjectIds.join(', ')}]:`, error);
        return [];
    }
}