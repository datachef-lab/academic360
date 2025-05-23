import { db } from "@/db/index.js";
import { PersonalDetails, personalDetailsModel } from "../models/personalDetails.model.js";
import { eq } from "drizzle-orm";
import { PersonalDetailsType } from "@/types/user/personal-details.js";
import { addAddress, findAddressById, saveAddress } from "./address.service.js";
import { findDisabilityCodeById } from "@/features/resources/services/disabilityCode.service.js";
import { findNationalityById } from "@/features/resources/services/nationality.service.js";
import { findReligionById } from "@/features/resources/services/religion.service.js";
import { findLanguageMediumById } from "@/features/resources/services/languageMedium.service.js";
import { findCategoryById } from "@/features/resources/services/category.service.js";

export async function addPersonalDetails(personalDetails: PersonalDetailsType): Promise<PersonalDetailsType | null> {
    let {
        category,
        disabilityCode,
        mailingAddress,
        residentialAddress,
        motherTongue,
        nationality,
        otherNationality,
        religion,
        ...props
    } = personalDetails;

    if (mailingAddress) {
        mailingAddress = await addAddress(mailingAddress);
    }

    if (residentialAddress) {
        residentialAddress = await addAddress(residentialAddress);
    }

    const [newPersonalDetails] = await db.insert(personalDetailsModel).values({
        ...props,
        categoryId: category?.id,
        disabilityCodeId: disabilityCode?.id,
        mailingAddressId: mailingAddress?.id,
        residentialAddressId: residentialAddress?.id,
        motherTongueId: motherTongue?.id,
        nationalityId: nationality?.id,
        otherNationalityId: otherNationality?.id,
        religionId: religion?.id,
    }).returning();


    const formattedPersonalDetails = await personalDetailsResponseFormat(newPersonalDetails);

    return formattedPersonalDetails;
}

export async function findPersonalDetailsById(id: number): Promise<PersonalDetailsType | null> {
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.id, id));

    const formattedPersonalDetails = await personalDetailsResponseFormat(foundPersonalDetail);

    return formattedPersonalDetails;
}

export async function findPersonalDetailsByStudentId(stdentId: number): Promise<PersonalDetailsType | null> {
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.studentId, stdentId));

    const formattedPersonalDetails = await personalDetailsResponseFormat(foundPersonalDetail);

    return formattedPersonalDetails;
}

export async function savePersonalDetails(id: number, personalDetails: PersonalDetailsType): Promise<PersonalDetailsType | null> {
    let {
        category,
        disabilityCode,
        mailingAddress,
        residentialAddress,
        motherTongue,
        nationality,
        otherNationality,
        religion,
        studentId,
        id: personalDetailsId,
        ...props
    } = personalDetails;

    const [updatedPersonalDetails] = await db.update(personalDetailsModel).set({
        ...props,
        categoryId: category?.id,
        disabilityCodeId: disabilityCode?.id,
        mailingAddressId: mailingAddress?.id,
        residentialAddressId: residentialAddress?.id,
        motherTongueId: motherTongue?.id,
        nationalityId: nationality?.id,
        otherNationalityId: otherNationality?.id,
        religionId: religion?.id,
    }).where(eq(personalDetailsModel.id, id)).returning();

    if (mailingAddress) {
        mailingAddress = await saveAddress(mailingAddress?.id as number, mailingAddress);
    }

    if (residentialAddress) {
        residentialAddress = await saveAddress(residentialAddress?.id as number, residentialAddress);
    }

    const formattedPersonalDetails = await personalDetailsResponseFormat(updatedPersonalDetails);

    return formattedPersonalDetails;
}

export async function removePersonalDetails(id: number): Promise<boolean | null> {
    // Return if the transport-detail doesn't exist
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.id, id));
    if (!foundPersonalDetail) {
        return null; // No Content
    }
    // Delete the transport-detail
    const [deletedPersonalDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.id, id)).returning();
    if (!deletedPersonalDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removePersonalDetailsByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the personal-detail doesn't exist
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId));
    if (!foundPersonalDetail) {
        return null; // No Content
    }
    // Delete the personal-detail
    const [deletedPersonalDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId)).returning();
    if (!deletedPersonalDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removePersonalDetailsByAddressId(addresId: number): Promise<boolean | null> {
    // Return if the personal-detail doesn't exist
    let [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.mailingAddressId, addresId));
    if (!foundPersonalDetail) {
        const tmpPersonalDetails = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.residentialAddressId, addresId));
        if (tmpPersonalDetails.length == 0) {
            return null; // No Content
        }
        foundPersonalDetail = tmpPersonalDetails[0];
    }
    // Delete the personal-detail
    const [deletedPersonalDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.id, foundPersonalDetail.id)).returning();
    if (!deletedPersonalDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function personalDetailsResponseFormat(personalDetails: PersonalDetails): Promise<PersonalDetailsType | null> {
    if (!personalDetails) {
        return null;
    }

    const {
        categoryId,
        disabilityCodeId,
        mailingAddressId,
        residentialAddressId,
        motherTongueId,
        nationalityId,
        otherNationalityId,
        religionId,
        ...props
    } = personalDetails;

    const formattedPersonalDetails: PersonalDetailsType = { ...props };

    if (categoryId) {
        formattedPersonalDetails.category = await findCategoryById(categoryId);
    }

    if (disabilityCodeId) {
        formattedPersonalDetails.disabilityCode = await findDisabilityCodeById(disabilityCodeId);
    }

    if (mailingAddressId) {
        formattedPersonalDetails.mailingAddress = await findAddressById(mailingAddressId);
    }

    if (residentialAddressId) {
        formattedPersonalDetails.residentialAddress = await findAddressById(residentialAddressId);
    }

    if (motherTongueId) {
        formattedPersonalDetails.motherTongue = await findLanguageMediumById(motherTongueId);
    }

    if (nationalityId) {
        formattedPersonalDetails.nationality = await findNationalityById(nationalityId);
    }

    if (otherNationalityId) {
        formattedPersonalDetails.otherNationality = await findNationalityById(otherNationalityId);
    }

    if (religionId) {
        formattedPersonalDetails.religion = await findReligionById(religionId);
    }

    return formattedPersonalDetails;
}