import {dbPostgres} from "@/db";
import { AdmissionGeneralInfo, ApplicationForm, applicationForms } from "@/db/schema";
import { ApplicationFormDto } from "@/types/admissions";
import { eq } from "drizzle-orm";
import { checkExistingEntry, createGeneralInfo, deleteGeneralInfo, findGeneralInfoByApplicationFormId } from "./adm-general-info.service";
import { deleteAcademicInfo, findAcademicInfoByApplicationFormId } from "./adm-academic-info.service";
import { deleteAdmissionAdditionalInfo, findAdditionalInfoByApplicationFormId } from "./adm-additional-info.service";
import { deletePayment, findPaymentInfoByApplicationFormId } from "./adm-payment.service";
import { deleteAdmissionCourse, findCourseApplicationByApplicationFormId } from "./adm-course-info.service";
import { getSportsInfoByAdditionalInfoId } from "./adm-sports-info.service";

export async function createApplicationForm(form: ApplicationForm, generalInfo: AdmissionGeneralInfo) {
    // Check if the form already exists for the given admission year for the given student
    const existingEntry = await checkExistingEntry(form.admissionId, generalInfo);
    if (existingEntry) {
        return { applicationForm: null, message: "Application form already exists for this student. Try login to continue." };
    }
    // Create a new application form
    const [newApplicationForm] = await dbPostgres
        .insert(applicationForms)
        .values({
            admissionId: form.admissionId,
            admissionStep: form.admissionStep,
            formStatus: form.formStatus,
        })
        .returning();

    // Create a new admission general info entry
    generalInfo.applicationFormId = newApplicationForm.id;
    await createGeneralInfo(generalInfo);

    const dto = await formatAppform(newApplicationForm);

    return { applicationForm: dto, message: "New Application Form Created!" };
}

export async function findApplicationFormById(id: number) {
    const [form] = await dbPostgres
        .select()
        .from(applicationForms)
        .where(eq(applicationForms.id, id));

    const dto = await formatAppform(form);

    return dto;
}

export async function findApplicationFormsByAdmissionId(admissionId: number) {
    const forms = await dbPostgres
        .select()
        .from(applicationForms)
        .where(eq(applicationForms.admissionId, admissionId));

    const dtos = (await Promise.all(forms.map(async (form) => await formatAppform(form)))).filter((form): form is ApplicationFormDto => form !== null);

    return dtos;
}

export async function updateApplicationForm(id: number, givenForm: Partial<ApplicationForm>) {
    const [foundForm] = await dbPostgres
        .select()
        .from(applicationForms)
        .where(eq(applicationForms.id, id));

    if (!foundForm) {
        return null;
    }

    const [updatedForm] = await dbPostgres
        .update(applicationForms)
        .set({
            ...foundForm,
            ...givenForm
        })
        .where(eq(applicationForms.id, id))
        .returning();

    const dto = await formatAppform(updatedForm);

    return dto;
}

export async function deleteApplicationForm(id: number) {
    const foundForm = await findApplicationFormById(id);

    if (!foundForm) {
        return null;
    }

    // Delete the general info
    const generalInfoDeleted = await deleteGeneralInfo(foundForm.generalInfo!.id!);
    if (generalInfoDeleted !== null && !generalInfoDeleted) {
        return { success: false, message: "Failed to delete general info." };
    }

    // Delete the academic info
    const academicInfoDeleted = await deleteAcademicInfo(foundForm.academicInfo!.id!);
    if (academicInfoDeleted !== null && !academicInfoDeleted) {
        return { success: false, message: "Failed to delete academic info." };
    }

    // Delete the course application
    for (const course of foundForm.courseApplication!) {
        const courseApplicationInfoDeleted = await deleteAdmissionCourse(course.id!);
        if (courseApplicationInfoDeleted !== null && !courseApplicationInfoDeleted) {
            return { success: false, message: "Failed to delete course app." };
        }

    }

    // Delete additional info if exists
    if (foundForm.additionalInfo) {
        const additionalInfoDeleted = await deleteAdmissionAdditionalInfo(foundForm.additionalInfo!.id!);
        if (!additionalInfoDeleted) {
            throw new Error("Failed to delete additional info");
        }
    }

    // Delete the payment info
    const paymentInfoDeleted = await deletePayment(foundForm.paymentInfo!.id!);
    if (paymentInfoDeleted !== null && !paymentInfoDeleted) {
        return { success: false, message: "Failed to delete payemnt info." };
    }

    // Delete the application form
    await dbPostgres
        .delete(applicationForms)
        .where(eq(applicationForms.id, id));

    return true;
}

export async function formatAppform(form: ApplicationForm): Promise<ApplicationFormDto | null> {
    if (!form) return null;

    const dto: ApplicationFormDto = {
        ...form,
        generalInfo: null,
        academicInfo: null,
        courseApplication: null,
        additionalInfo: null,
        paymentInfo: null,
        currentStep: 0,
    };

    dto.generalInfo = await findGeneralInfoByApplicationFormId(form.id!);

    dto.academicInfo = await findAcademicInfoByApplicationFormId(form.id!);

    const additionalInfo = await findAdditionalInfoByApplicationFormId(form.id!);
    if (additionalInfo) {
        const sportsInfo = await getSportsInfoByAdditionalInfoId(additionalInfo.id!);
        dto.additionalInfo = {
            ...additionalInfo,
            sportsInfo: sportsInfo || [],
        };
    }

    dto.courseApplication = await findCourseApplicationByApplicationFormId(form.id!);

    dto.paymentInfo = await findPaymentInfoByApplicationFormId(form.id!);

    return dto;
}

