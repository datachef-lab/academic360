import { db } from "@/db/index.js";
import { Admission, admissionModel } from "../models/admission.model.js";
import { applicationFormModel } from "../models/application-form.model.js";
import { admissionGeneralInfoModel } from "../models/admission-general-info.model.js";
// import { categoryModel } from "../models/category.model.js";
// import { religionModel } from "../models/religion.model.js";
// import { annualIncomeModel } from "../models/annual-income.model.js";
// import { admissionAdditionalInfoModel } from "../models/admission-additional-info.model.js";
import { admissionCourseModel } from "../models/admission-course.model.js";
import { courseModel } from "@/features/academics/models/course.model.js";
// import { boardUniversityModel } from "../models/board-university.model.js";
import { admissionAcademicInfoModel } from "../models/admission-academic-info.model.js";
import { admissionCourseApplication } from "../models/admission-course-application.model.js";
import { count, desc, eq, and, sql, ilike, or, SQL } from "drizzle-orm";
import { createAdmissionCourse, findAdmissionCoursesByAdmissionId } from "./admission-course.service.js";
import { AdmissionDto } from "@/types/admissions/index.js";
import { categoryModel } from "@/features/resources/models/category.model.js";
// import { admissionAdditionalInfoModel } from "../models/admission-additional-info.model.js";
import { admissionAdditionalInfoModel } from "@/features/admissions/models/admisison-additional-info.model.js";
import { annualIncomeModel } from "@/features/resources/models/annualIncome.model.js";
import { boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { religionModel } from "@/features/resources/models/religion.model.js";
import { academicYearModel } from "@/features/academics/models/academic-year.model.js";

// CREATE
export async function createAdmission(admission: Admission): Promise<AdmissionDto | null> {
    const [foundAdmission] = await db
        .select()
        .from(admissionModel)
        .where(eq(admissionModel.academicYearId, admission.academicYearId));

    if (foundAdmission) return null;

    const [newAdmission] = await db
        .insert(admissionModel)
        .values({
            ...admission,
            startDate: admission.startDate,
            lastDate: admission.lastDate
        })
        .returning();

    return await modelToDto(newAdmission);
}

// READ by year
export async function findAdmissionByYear(year: number): Promise<AdmissionDto | null> {
    const [{admissions: foundAdmission}] = await db
        .select()
        .from(admissionModel)
        .leftJoin(academicYearModel, eq(academicYearModel.id, admissionModel.academicYearId))
        .where(eq(academicYearModel.year, String(year)));

    if (!foundAdmission) return null;

    // Auto-close if end date is past
    const now = new Date();
    const endDate = new Date(foundAdmission.lastDate!);
    if (!foundAdmission.isClosed && endDate < now) {
        await db.update(admissionModel)
            .set({ isClosed: true })
            .where(eq(admissionModel.id, foundAdmission.id));
        foundAdmission.isClosed = true;
    }

    return await modelToDto(foundAdmission);
}

// READ by ID
export async function findAdmissionById(id: number): Promise<AdmissionDto | null> {
    const [foundAdmission] = await db
        .select()
        .from(admissionModel)
        .where(eq(admissionModel.id, id));

    if (!foundAdmission) return null;

    // Auto-close if end date is past
    const now = new Date();
    const endDate = new Date(foundAdmission.lastDate!);
    if (!foundAdmission.isClosed && endDate < now) {
        await db.update(admissionModel)
            .set({ isClosed: true })
            .where(eq(admissionModel.id, foundAdmission.id));
        foundAdmission.isClosed = true;
    }

    return await modelToDto(foundAdmission);
}

// UPDATE
export async function updateAdmission(id: number, admission: Partial<Admission>): Promise<AdmissionDto | null> {
    const [foundAdmission] = await db
        .select()
        .from(admissionModel)
        .where(eq(admissionModel.id, id));

    if (!foundAdmission) return null;

    const [updatedAdmission] = await db
        .update(admissionModel)
        .set({
            ...admission,
            startDate: admission.startDate,
            lastDate: admission.lastDate
        })
        .where(eq(admissionModel.id, id))
        .returning();

    return await modelToDto(updatedAdmission);
}

// DELETE
export async function deleteAdmission(id: number) {
    const [foundAdmission] = await db
        .select()
        .from(admissionModel)
        .where(eq(admissionModel.id, id));

    if (!foundAdmission) return null;

    // TODO: Delete all the application forms, etc.
    const [deletedAdmission] = await db
        .delete(admissionModel)
        .where(eq(admissionModel.id, id))
        .returning();

    return deletedAdmission;
}

// DTO conversion
async function modelToDto(adm: Admission): Promise<AdmissionDto> {
    const courses = await findAdmissionCoursesByAdmissionId(adm.id!);
    return {
        ...adm,
        
        createdAt: adm.createdAt ?? undefined,
        updatedAt: adm.updatedAt ?? undefined,
        courses
    };
}

// STATS (example)
export async function admissionStats() {
    const [{admissionYearCount}] = await db
        .select({admissionYearCount: count()})
        .from(admissionModel);
    const [{totalApplications}] = await db
        .select({totalApplications: count()}) 
        .from(applicationFormModel);
    const [{totalPayments}] = await db
        .select({totalPayments: count()}) 
        .from(applicationFormModel)
        .where(eq(applicationFormModel.formStatus, "PAYMENT_SUCCESS"));
    const [{totalDrafts}] = await db
        .select({totalDrafts: count()}) 
        .from(applicationFormModel)
        .where(eq(applicationFormModel.formStatus, "DRAFT"));

    return {
        admissionYearCount,
        totalApplications,
        totalPayments,
        totalDrafts
    };
}

interface GetApplicationFormsFilters {
    category?: string;
    religion?: string;
    annualIncome?: string;
    gender?: "MALE" | "FEMALE" | "TRANSGENDER";
    isGujarati?: boolean;
    search?: string;
    formStatus?: string;
    paymentStatus?: string;
    course?: string;
    boardUniversity?: string;
}

export async function getApplicationFormsByAdmissionId(
    admissionId: number,
    page: number = 1,
    size: number = 10,
    filters: GetApplicationFormsFilters = {}
) {
    const offset = (page - 1) * size;

    const baseQuery = db
        .select({
            id: applicationFormModel.id,
            formStatus: applicationFormModel.formStatus,
            admissionStep: applicationFormModel.admissionStep,
            submittedAt: applicationFormModel.createdAt,
            name: sql<string>`${admissionGeneralInfoModel.firstName} || ' ' || ${admissionGeneralInfoModel.lastName}`.as('name'),
            category: categoryModel.name,
            religion: sql<string>`COALESCE((SELECT ${religionModel.name} FROM ${admissionGeneralInfoModel} LEFT JOIN ${religionModel} ON ${admissionGeneralInfoModel.religionId} = ${religionModel.id} WHERE ${admissionGeneralInfoModel.applicationFormId} = ${applicationFormModel.id} LIMIT 1), (SELECT ${religionModel.name} FROM ${admissionAdditionalInfoModel} LEFT JOIN ${religionModel} ON ${admissionAdditionalInfoModel.religionId} = ${religionModel.id} WHERE ${admissionAdditionalInfoModel.applicationFormId} = ${applicationFormModel.id} LIMIT 1))`.as('religion'),
            annualIncome: annualIncomeModel.range,
            gender: admissionGeneralInfoModel.gender,
            isGujarati: admissionGeneralInfoModel.isGujarati,
            course: sql<string>`(SELECT ${courseModel.name} FROM ${admissionCourseApplication} LEFT JOIN ${courseModel} ON ${admissionCourseApplication.admissionCourseId} = ${courseModel.id} WHERE ${admissionCourseApplication.applicationFormId} = ${applicationFormModel.id} LIMIT 1)`.as('course'),
            boardUniversity: sql<string>`(SELECT ${boardUniversityModel.name} FROM ${admissionAcademicInfoModel} LEFT JOIN ${boardUniversityModel} ON ${admissionAcademicInfoModel.boardUniversityId} = ${boardUniversityModel.id} WHERE ${admissionAcademicInfoModel.applicationFormId} = ${applicationFormModel.id} LIMIT 1)`.as('boardUniversity')
        })
        .from(applicationFormModel)
        .leftJoin(admissionGeneralInfoModel, eq(applicationFormModel.id, admissionGeneralInfoModel.applicationFormId))
        .leftJoin(categoryModel, eq(admissionGeneralInfoModel.categoryId, categoryModel.id))
        .leftJoin(admissionAdditionalInfoModel, eq(applicationFormModel.id, admissionAdditionalInfoModel.applicationFormId))
        .leftJoin(annualIncomeModel, eq(admissionAdditionalInfoModel.annualIncomeId, annualIncomeModel.id));

    let conditions: SQL<unknown>[] = [eq(applicationFormModel.admissionId, admissionId)];

    // Apply filters (case-insensitive for strings)
    if (filters.category) {
        conditions.push(ilike(categoryModel.name, filters.category));
    }
    if (filters.religion) {
        conditions.push(
            sql`LOWER((SELECT ${religionModel.name} FROM ${admissionGeneralInfoModel} LEFT JOIN ${religionModel} ON ${admissionGeneralInfoModel.religionId} = ${religionModel.id} WHERE ${admissionGeneralInfoModel.applicationFormId} = ${applicationFormModel.id} LIMIT 1)) = LOWER(${filters.religion})`
        );
    }
    if (filters.annualIncome) {
        conditions.push(ilike(annualIncomeModel.range, filters.annualIncome));
    }
    if (typeof filters.gender !== 'undefined' && filters.gender) {
        conditions.push(ilike(admissionGeneralInfoModel.gender, filters.gender));
    }
    if (typeof filters.isGujarati === 'boolean') {
        conditions.push(eq(admissionGeneralInfoModel.isGujarati, filters.isGujarati));
    }
    if (filters.formStatus) {
        conditions.push(ilike(applicationFormModel.formStatus, filters.formStatus));
    }
    if (filters.course) {
        conditions.push(
            sql`LOWER((SELECT ${courseModel.name} FROM ${admissionCourseApplication} LEFT JOIN ${courseModel} ON ${admissionCourseApplication.admissionCourseId} = ${courseModel.id} WHERE ${admissionCourseApplication.applicationFormId} = ${applicationFormModel.id} LIMIT 1)) = LOWER(${filters.course})`
        );
    }
    if (filters.boardUniversity) {
        conditions.push(
            sql`LOWER((SELECT ${boardUniversityModel.name} FROM ${admissionAcademicInfoModel} LEFT JOIN ${boardUniversityModel} ON ${admissionAcademicInfoModel.boardUniversityId} = ${boardUniversityModel.id} WHERE ${admissionAcademicInfoModel.applicationFormId} = ${applicationFormModel.id} LIMIT 1)) = LOWER(${filters.boardUniversity})`
        );
    }

    // Apply search
    if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        const searchConditions = [
            ilike(admissionGeneralInfoModel.firstName, searchTerm),
            ilike(admissionGeneralInfoModel.lastName, searchTerm),
            ilike(sql`${applicationFormModel.id}::text`, searchTerm),
        ].filter((cond): cond is SQL<unknown> => cond !== undefined);

        if (searchConditions.length > 0) {
            conditions.push(or(...searchConditions) as SQL<unknown>);
        }
    }

    // Main query with conditions
    let query = baseQuery.where(and(...conditions));

    // Count query with same conditions
    let totalCountQuery = db
        .select({ count: count() })
        .from(applicationFormModel)
        .leftJoin(admissionGeneralInfoModel, eq(applicationFormModel.id, admissionGeneralInfoModel.applicationFormId))
        .leftJoin(categoryModel, eq(admissionGeneralInfoModel.categoryId, categoryModel.id))
        .leftJoin(admissionAdditionalInfoModel, eq(applicationFormModel.id, admissionAdditionalInfoModel.applicationFormId))
        .leftJoin(annualIncomeModel, eq(admissionAdditionalInfoModel.annualIncomeId, annualIncomeModel.id))
        .where(and(...conditions));

    const [totalCountResult] = await totalCountQuery;
    const totalItems = totalCountResult ? totalCountResult.count : 0;

    const applicationFormsList = await query
        .limit(size)
        .offset(offset)
        .orderBy(desc(applicationFormModel.createdAt));

    return {
        applications: applicationFormsList,
        totalItems,
    };
}