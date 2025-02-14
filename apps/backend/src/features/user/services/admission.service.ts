import { db } from "@/db/index.js";
import { admissionModel, Admission } from "../models/admission.model.js";
import { eq } from "drizzle-orm";

export async function addAdmission(admission: Admission): Promise<Admission | null> {
    const [newAdmission] = await db.insert(admissionModel).values(admission).returning();
    return newAdmission;
}

export async function findAdmissionById(id: number): Promise<Admission | null> {
    const [foundAdmission] = await db.select().from(admissionModel).where(eq(admissionModel.id, id));
    return foundAdmission;
}

export async function findAdmissionByStudentId(studentId: number): Promise<Admission | null> {
    const [foundAdmission] = await db.select().from(admissionModel).where(eq(admissionModel.studentId, studentId));
    return foundAdmission;
}

export async function findAdmissionByYear(yearOfAdmission: number): Promise<Admission | null> {
    const [foundAdmission] = await db.select().from(admissionModel).where(eq(admissionModel.yearOfAdmission, yearOfAdmission));
    return foundAdmission;
}

export async function saveAdmission(id: number, admission: Admission): Promise<Admission | null> {
    const foundAdmission = await findAdmissionById(id);
    if (!foundAdmission) {
        return null;
    }

    const { admissionCode, admissionDate, applicantSignature, applicationNumber, yearOfAdmission } = foundAdmission;

    const [updatedAdmission] = await db.update(admissionModel).set({
        admissionCode,
        admissionDate,
        applicantSignature,
        applicationNumber,
        yearOfAdmission,
    }).where(eq(admissionModel.id, id)).returning();

    return updatedAdmission;
}

export async function removeAdmission(id: number): Promise<boolean | null> {
    const foundAdmission = await findAdmissionById(id);
    if (!foundAdmission) {
        return null; // No content
    }
    
    const [deletedAdmission] = await db.delete(admissionModel).where(eq(admissionModel.id, id)).returning();
    
    if (!deletedAdmission) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removeAdmissionByStudentId(studentId: number): Promise<boolean | null> {
    const foundAdmission = await findAdmissionByStudentId(studentId);
    if (!foundAdmission) {
        return null; // No content
    }
    
    const [deletedAdmission] = await db.delete(admissionModel).where(eq(admissionModel.studentId, studentId)).returning();
    
    if (!deletedAdmission) {
        return false; // Failure!
    }

    return true; // Success!
}