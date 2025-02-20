import { count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { Student, studentModel } from "../models/student.model.js";
import { StudentType } from "@/types/user/student.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { findAll } from "@/utils/helper.js";
import { removeAcademicHistory, saveAcademicHistory } from "./academicHistory.service.js";
import { addAcademicIdentifier, findAcademicIdentifierById, findAcademicIdentifierByStudentId, removeAcademicIdentifier, saveAcademicIdentifier } from "./academicIdentifier.service.js";
import { removeAccommodationByStudentId } from "./accommodation.service.js";
import { removeAdmissionByStudentId } from "./admission.service.js";
import { removeParentsByStudentId } from "./parentDetails.service.js";
import { removeGuardianByStudentId } from "./guardian.service.js";
import { removeHealthByStudentId } from "./health.service.js";
import { removeEmergencyContactByStudentId } from "./emergencyContact.service.js";
import { removeTransportDetailsByStudentId } from "./transportDetail.service.js";
import { addPersonalDetails, findPersonalDetailsByStudentId, removePersonalDetailsByStudentId, savePersonalDetails } from "./personalDetails.service.js";
import { removeMarksheetByStudentId } from "@/features/academics/services/marksheet.service.js";
import { findSpecializationById } from "@/features/resources/services/specialization.service.js";
import { findUserById } from "./user.service.js";
import { academicIdentifierModel } from "../models/academicIdentifier.model.js";
import { userModel } from "../models/user.model.js";
import { nationalityModel } from "@/features/resources/models/nationality.model.js";


export async function addStudent(student: StudentType): Promise<StudentType | null> {
    let { name, academicIdentifier, specialization, personalDetails, ...props } = student;

    if (academicIdentifier) {
        academicIdentifier = await addAcademicIdentifier(academicIdentifier);
    }

    if (personalDetails) {
        personalDetails = await addPersonalDetails(personalDetails);
    }

    const [newStudent] = await db.insert(studentModel).values({
        ...props,
        specializationId: specialization?.id
    }).returning();

    const formatedStudent = await studentResponseFormat(newStudent);

    return formatedStudent;
}

export async function findAllStudent(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<StudentType>> {
    const studentsResponse = await findAll<StudentType>(studentModel, page, pageSize);

    // Await Promise.all to resolve async operations
    const content = await Promise.all(studentsResponse.content.map(async (student) => {
        return await studentResponseFormat(student);
    })) as StudentType[];

    const [{ count: countRows }] = await db.select({ count: count() }).from(studentModel);

    return {
        content,
        page,
        pageSize,
        totalElements: Number(countRows),
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}

export async function findStudentById(id: number): Promise<StudentType | null> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, id));

    const formatedStudent = await studentResponseFormat(foundStudent);

    return formatedStudent;
}

export async function getStudentByUserId(userId: number): Promise<Student | null> {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, userId));
    return foundStudent;
}

export async function saveStudent(id: number, student: StudentType): Promise<StudentType | null> {
    let { academicIdentifier, personalDetails, id: studentId, userId, ...props } = student;

    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, id));
    if (!foundStudent) {
        return null;
    }

    const [updatedStudent] = await db.update(studentModel).set({ ...props }).where(eq(studentModel.id, id)).returning();

    if (academicIdentifier) {
        academicIdentifier = await saveAcademicIdentifier(academicIdentifier?.id as number, academicIdentifier);
    }

    if (personalDetails) {
        personalDetails = await savePersonalDetails(personalDetails.id as number, personalDetails);
    }

    const formattedPersonalDetails = await studentResponseFormat(updatedStudent);

    return formattedPersonalDetails;
}

export async function removeStudent(id: number): Promise<boolean | null> {
    // Return if the student not exist.
    const foundStudent = await findStudentById(id);
    if (!foundStudent) {
        return null;
    }
    // Delete the student: -
    // Step 1: Delete the academic-history
    let isDeleted: boolean | null = false;
    isDeleted = await removeAcademicHistory(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 2: Delete the academic-identifier
    isDeleted = await removeAcademicIdentifier(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 3: Delete the accommodation
    isDeleted = await removeAccommodationByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 4: Delete the admission
    isDeleted = await removeAdmissionByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 5: Delete the parent-details
    isDeleted = await removeParentsByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 6: Delete the guardian-details
    isDeleted = await removeGuardianByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 7: Delete the health
    isDeleted = await removeHealthByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 8: Delete the emergency-contact
    isDeleted = await removeEmergencyContactByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 9: Delete the transport-details
    isDeleted = await removeTransportDetailsByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 10: Delete the personal-details
    isDeleted = await removePersonalDetailsByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 11: Delete all the marksheets
    isDeleted = await removeMarksheetByStudentId(id);
    if (isDeleted !== null && !isDeleted) return false;

    // Step 12: Delete the student
    const [deletedStudent] = await db.delete(studentModel).where(eq(studentModel.id, id)).returning();
    if (!deletedStudent) {
        return false;
    }

    return true;
}

export async function searchStudent(searchText: string, page: number = 1, pageSize: number = 10) {
    // Trim spaces and convert searchText to lowercase
    searchText = searchText.trim().toLowerCase();

    // Query students based on student name, roll number, registration number, etc.
    const studentsQuery = db
        .select()
        .from(studentModel)
        .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id)) // Join with academic identifiers
        .where(
            or(
                ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`), // Search by registration number
                ilike(academicIdentifierModel.rollNumber, `%${searchText}%`), // Search by roll number
                ilike(academicIdentifierModel.uid, `%${searchText}%`) // Search by UID
            )
        );

    // Get the paginated students
    const students = await studentsQuery
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    console.log(students);

    // Get the total count of students matching the filter
    const [{ count: countRows }] = await db
        .select({ count: count() })
        .from(studentModel)
        .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id)) // Join with academic identifiers
        .where(
            or(
                ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`), // Search by registration number
                ilike(academicIdentifierModel.rollNumber, `%${searchText}%`), // Search by roll number
                ilike(academicIdentifierModel.uid, `%${searchText}%`) // Search by UID
            )
        );

    // Map the result to a properly formatted response
    const content = await Promise.all(students.map(async (studentRecord) => {
        const student = studentRecord.students; // Extract the student data
        return await studentResponseFormat(student);
    }));

    return {
        content,
        page,
        pageSize,
        totalElements: Number(countRows), // Now this count is correct!
        totalPages: Math.ceil(Number(countRows) / pageSize)
    };
}


async function studentResponseFormat(student: Student): Promise<StudentType | null> {
    if (!student) {
        return null;
    }

    const { specializationId, ...props } = student;

    const user = await findUserById(student.userId);

    const formatedStudent: StudentType = { ...props, name: user?.name as string }

    if (specializationId) {
        formatedStudent.specialization = await findSpecializationById(specializationId);
    }

    formatedStudent.academicIdentifier = await findAcademicIdentifierByStudentId(student?.id as number);

    formatedStudent.personalDetails = await findPersonalDetailsByStudentId(student?.id as number);

    return formatedStudent;
}