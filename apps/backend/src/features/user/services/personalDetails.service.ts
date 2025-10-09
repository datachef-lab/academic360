import { z } from "zod";
import { db } from "@/db/index.js";
import {
  PersonalDetails,
  personalDetailsModel,
  createPersonalDetailsSchema,
  studentModel,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";
import { PersonalDetailsDto } from "@repo/db/index.js";
import { addAddress, findAddressById, saveAddress } from "./address.service.js";
import { findDisabilityCodeById } from "@/features/resources/services/disabilityCode.service.js";
import { findNationalityById } from "@/features/resources/services/nationality.service.js";
import { findReligionById } from "@/features/resources/services/religion.service.js";
import { findLanguageMediumById } from "@/features/resources/services/languageMedium.service.js";
import { findCategoryById } from "@/features/resources/services/category.service.js";

// Validate input using Zod schema
function validatePersonalDetailsInput(data: any) {
  const parseResult = createPersonalDetailsSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-ignore
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

export async function addPersonalDetails(
  personalDetails: PersonalDetailsDto,
): Promise<PersonalDetailsDto | null> {
  // let {
  //     category,
  //     disabilityCode,
  //     mailingAddress,
  //     residentialAddress,
  //     motherTongue,
  //     nationality,
  //     otherNationality,
  //     religion,
  //     ...props
  // } = personalDetails;

  // // Validate input (excluding nested objects)
  // validatePersonalDetailsInput(props);

  // if (mailingAddress) {
  //     mailingAddress = await addAddress(mailingAddress);
  // }

  // if (residentialAddress) {
  //     residentialAddress = await addAddress(residentialAddress);
  // }

  // const [newPersonalDetails] = await db.insert(personalDetailsModel).values({
  //     ...props,
  //     categoryId: category?.id,
  //     disabilityCodeId: disabilityCode?.id,
  //     mailingAddressId: mailingAddress?.id,
  //     residentialAddressId: residentialAddress?.id,
  //     motherTongueId: motherTongue?.id,
  //     nationalityId: nationality?.id,
  //     otherNationalityId: otherNationality?.id,
  //     religionId: religion?.id,
  // }).returning();

  // const formattedPersonalDetails = await personalDetailsResponseFormat(newPersonalDetails);
  return null;
}

export async function findPersonalDetailsById(
  id: number,
): Promise<PersonalDetailsDto | null> {
  const [foundPersonalDetail] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.id, id));
  if (!foundPersonalDetail) return null;
  const formattedPersonalDetails =
    await personalDetailsResponseFormat(foundPersonalDetail);
  return formattedPersonalDetails;
}

export async function findPersonalDetailsByStudentId(
  studentId: number,
): Promise<PersonalDetailsDto | null> {
  // First get the student to find their userId
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  if (!student) {
    return null;
  }

  // Then get personal details using the userId
  const [foundPersonalDetail] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.userId, student.userId as number));

  if (!foundPersonalDetail) {
    return null;
  }

  const formattedPersonalDetails =
    await personalDetailsResponseFormat(foundPersonalDetail);
  return formattedPersonalDetails;
}

export async function savePersonalDetails(
  id: number,
  personalDetails: PersonalDetailsDto,
): Promise<PersonalDetailsDto | null> {
  let {
    category,
    disabilityCode,
    address,
    motherTongue,
    nationality,
    religion,

    createdAt,
    updatedAt,
    id: personalDetailsId,
    ...props
  } = personalDetails;

  // Validate input (excluding nested objects)
  validatePersonalDetailsInput({ ...props });

  const [updatedPersonalDetails] = await db
    .update(personalDetailsModel)
    .set({
      ...props,
      // studentId, // Ensure studentId is included in the update
      categoryId: category?.id,
      disabilityCodeId: disabilityCode?.id,
      // addresses are managed separately
      motherTongueId: motherTongue?.id,
      nationalityId: nationality?.id,
      religionId: religion?.id,
    })
    .where(eq(personalDetailsModel.id, id))
    .returning();

  if (!updatedPersonalDetails) return null;

  // if (address && address.length) {
  //     await Promise.all(address.map((a) => a?.id ? saveAddress(a.id, a) : addAddress(a)));
  // }

  const formattedPersonalDetails = await personalDetailsResponseFormat(
    updatedPersonalDetails,
  );
  return formattedPersonalDetails;
}

export async function savePersonalDetailsByStudentId(
  studentId: number,
  personalDetails: PersonalDetailsDto,
): Promise<PersonalDetailsDto | null> {
  // let {
  //     category,
  //     disabilityCode,
  //     mailingAddress,
  //     residentialAddress,
  //     motherTongue,
  //     nationality,
  //     otherNationality,
  //     religion,
  //     id: personalDetailsId,
  //     ...props
  // } = personalDetails;

  // // Validate input (excluding nested objects)
  // validatePersonalDetailsInput({ ...props, studentId });

  // const [updatedPersonalDetails] = await db.update(personalDetailsModel).set({
  //     ...props,
  //     categoryId: category?.id,
  //     disabilityCodeId: disabilityCode?.id,
  //     mailingAddressId: mailingAddress?.id,
  //     residentialAddressId: residentialAddress?.id,
  //     motherTongueId: motherTongue?.id,
  //     nationalityId: nationality?.id,
  //     otherNationalityId: otherNationality?.id,
  //     religionId: religion?.id,
  // }).where(eq(personalDetailsModel.studentId, studentId)).returning();

  // if (!updatedPersonalDetails) return null;

  // if (mailingAddress) {
  //     mailingAddress = await saveAddress(mailingAddress?.id as number, mailingAddress);
  // }

  // if (residentialAddress) {
  //     residentialAddress = await saveAddress(residentialAddress?.id as number, residentialAddress);
  // }

  // const formattedPersonalDetails = await personalDetailsResponseFormat(updatedPersonalDetails);
  return null;
}

export async function removePersonalDetails(
  id: number,
): Promise<boolean | null> {
  // Return if the personal-detail doesn't exist
  const [foundPersonalDetail] = await db
    .select()
    .from(personalDetailsModel)
    .where(eq(personalDetailsModel.id, id));
  if (!foundPersonalDetail) {
    return null; // No Content
  }
  // Delete the personal-detail
  const [deletedPersonalDetail] = await db
    .delete(personalDetailsModel)
    .where(eq(personalDetailsModel.id, id))
    .returning();
  if (!deletedPersonalDetail) {
    return false; // Failure!
  }
  return true; // Success!
}

export async function removePersonalDetailsByStudentId(
  studentId: number,
): Promise<boolean | null> {
  // Return if the personal-detail doesn't exist
  // const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId));
  // if (!foundPersonalDetail) {
  //     return null; // No Content
  // }
  // // Delete the personal-detail
  // const [deletedPersonalDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId)).returning();
  // if (!deletedPersonalDetail) {
  //     return false; // Failure!
  // }
  return false; // Success!
}

export async function removePersonalDetailsByAddressId(
  addresId: number,
): Promise<boolean | null> {
  // Return if the personal-detail doesn't exist
  //   let [foundPersonalDetail] = await db
  //     .select()
  //     .from(personalDetailsModel)
  //     .where(eq(personalDetailsModel.mailingAddressId, addresId));
  //   if (!foundPersonalDetail) {
  //     const tmpPersonalDetails = await db
  //       .select()
  //       .from(personalDetailsModel)
  //       .where(eq(personalDetailsModel.residentialAddressId, addresId));
  //     if (tmpPersonalDetails.length == 0) {
  //       return null; // No Content
  //     }
  //     foundPersonalDetail = tmpPersonalDetails[0];
  //   }
  // Delete the personal-detail
  //   const [deletedPersonalDetail] = await db
  //     .delete(personalDetailsModel)
  //     .where(eq(personalDetailsModel.id, foundPersonalDetail.id))
  //     .returning();
  // if (!deletedPersonalDetail) {
  //     return false; // Failure!
  // }
  return false; // Success!
}

export async function getAllPersonalDetails(): Promise<PersonalDetails[]> {
  const details = await db.select().from(personalDetailsModel);
  return details;
}

export async function personalDetailsResponseFormat(
  personalDetails: PersonalDetails,
): Promise<PersonalDetailsDto | null> {
  if (!personalDetails) {
    return null;
  }
  const {
    categoryId,
    disabilityCodeId,
    // mailingAddressId,
    // residentialAddressId,
    motherTongueId,
    nationalityId,
    religionId,
    ...props
  } = personalDetails;
  const formattedPersonalDetails: PersonalDetailsDto = { ...props } as any;
  if (categoryId) {
    formattedPersonalDetails.category = await findCategoryById(categoryId);
  }
  if (disabilityCodeId) {
    formattedPersonalDetails.disabilityCode =
      await findDisabilityCodeById(disabilityCodeId);
  }
  // Populate address array if legacy FKs exist in future
  (formattedPersonalDetails as any).address = [];
  if (motherTongueId) {
    formattedPersonalDetails.motherTongue =
      await findLanguageMediumById(motherTongueId);
  }
  if (nationalityId) {
    formattedPersonalDetails.nationality =
      await findNationalityById(nationalityId);
  }

  if (religionId) {
    formattedPersonalDetails.religion = await findReligionById(religionId);
  }
  return formattedPersonalDetails;
}
