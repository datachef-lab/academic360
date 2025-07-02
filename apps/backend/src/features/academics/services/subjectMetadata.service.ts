import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import {
  SubjectMetadata,
  subjectMetadataModel,
} from "../models/subjectMetadata.model.js";
// import { addStream, findStreamById, findStreamByNameAndProgrammee } from "./stream.service.js";
import {
  addSpecialization,
  findSpecializationById,
} from "@/features/resources/services/specialization.service.js";
import {
  Specialization,
  specializationModel,
} from "@/features/user/models/specialization.model.js";
// import { Stream, streamModel } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { and, eq, isNull, SQLWrapper } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import { readExcelFile } from "@/utils/readExcel.js";
import { SubjectRow } from "@/types/academics/subject-row.js";
import {
  subjectTypeModel,
  SubjectTypeModel,
} from "../models/subjectType.model.js";
import {
  addDegree,
  findDegreeById,
  findDegreeByName,
} from "@/features/resources/services/degree.service.js";
// import { StreamType } from "@/types/academics/stream.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { findClassById, processClassBySemesterNumber } from "./class.service.js";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export async function findAllSubjectMetadata() {
  const subjectMetadataArr = await db.select().from(subjectMetadataModel);

  const formattedSubjectMetadatas = (
    await Promise.all(
      subjectMetadataArr.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
      }),
    )
  ).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

  return formattedSubjectMetadatas;
}

export async function uploadSubjects(fileName: string): Promise<boolean> {
  // Read the file from the `/public/temp/` directory
  const filePath = path.resolve(
    directoryName,
    "../../../..",
    "public",
    "temp",
    fileName,
  );

  let degrees = await db.select().from(degreeModel);

  const subjectArr = await readExcelFile<SubjectRow>(filePath);

  for (let i = 0; i < subjectArr.length; i++) {
    const streamName = subjectArr[i].Stream.toUpperCase().trim();

    let foundDegree = degrees.find(
      (ele) => ele.name === streamName.toUpperCase().trim(),
    );
    if (!foundDegree) {
      const [newDegree] = await db
        .insert(degreeModel)
        .values({
          name: streamName.toUpperCase().trim(),
          level: streamName.startsWith("B")
            ? "UNDER_GRADUATE"
            : "POST_GRADUATE",
        })
        .returning();
      foundDegree = newDegree;

      degrees = await db.select().from(degreeModel);
    }

    // let [foundStream] = await db.select().from(streamModel).where(and(
    //     eq(streamModel.degreeId, foundDegree.id),
    //     eq(streamModel.framework, subjectArr[i].Framework),
    //     eq(streamModel.degreeProgramme, subjectArr[i].Course!),
    // ));

    // if (!foundStream) {
    //     const [newStream] = await db.insert(streamModel).values({
    //         degreeId: foundDegree.id as number,
    //         degreeProgramme: subjectArr[i].Course,
    //         framework: subjectArr[i].Framework,
    //     } as Stream).returning();

    //     if (!newStream) {
    //         throw Error("Unable to create new stream...!");
    //     }

    //     foundStream = newStream;

    //     if (!foundStream) {
    //         throw Error("Unable to create new stream...!");
    //     }
    // }

    let specialization: Specialization | null = null;
    if (subjectArr[i].Specialization) {
      const [tmpSpecialization] = await db
        .select()
        .from(specializationModel)
        .where(
          eq(
            specializationModel.name,
            subjectArr[i].Specialization?.toUpperCase().trim() as string,
          ),
        );
      specialization = tmpSpecialization as Specialization;
      if (!tmpSpecialization) {
        specialization = await addSpecialization({
          name: subjectArr[i].Specialization?.toUpperCase().trim() as string,
        });
      }
    }

    const irpType = subjectArr[i]["Subject Type as per IRP"]
      ?.toUpperCase()
      .trim();
    const marksheetType = subjectArr[i]["Subject Type as per Marksheet"]
      ?.toUpperCase()
      .trim();

    const whereClauses = [];

    if (irpType) {
      whereClauses.push(eq(subjectTypeModel.irpName, irpType));
    }
    if (marksheetType) {
      whereClauses.push(eq(subjectTypeModel.marksheetName, marksheetType));
    }

    let subjectType: SubjectTypeModel | null = null;

    const [foundSubjectType] = await db
      .select()
      .from(subjectTypeModel)
      .where(
        whereClauses.length === 2 ? and(...whereClauses) : whereClauses[0],
      );

    if (foundSubjectType) {
      subjectType = foundSubjectType;
    } else {
      const [newSubjectType] = await db
        .insert(subjectTypeModel)
        .values({
          irpName: irpType,
          marksheetName: marksheetType,
        })
        .returning();
      subjectType = newSubjectType;
    }

    console.log("subjectType:", subjectType);

    // const whereConditions = [
    //     eq(subjectMetadataModel.streamId, foundStream.id),
    //     // eq(subjectMetadataModel.fullMarks, ),
    //     // eq(subjectMetadataModel.fullMarksInternal, ),
    //     // eq(subjectMetadataModel.fullMarksPractical, ),
    //     // eq(subjectMetadataModel.fullMarksTheory, ),
    //     // eq(subjectMetadataModel.fullMarksTutorial, ),
    //     // eq(subjectMetadataModel.fullMarksViva, ),
    //     // eq(subjectMetadataModel.fullMarksProject, ),
    //     eq(subjectMetadataModel.isOptional, !!subjectArr[i].Optional),
    //     // eq(subjectMetadataModel.subjectTypeId, subjectType),
    //     eq(subjectMetadataModel.category, subjectArr[i].Category),
    //     // eq(subjectMetadataModel.specializationId, ),
    // ]

    const dashIndex =
      subjectArr[i]["Subject Code as per Marksheet"].indexOf("-");
    console.log(
      "dashIndex:",
      dashIndex,
      subjectArr[i]["Subject Code as per Marksheet"],
      subjectArr[i]["Subject Code as per IRP"],
    );
    // if (subjectMetadata.irpCode == null && dashIndex != -1) {
    const irpCode = subjectArr[i]["Subject Code as per Marksheet"].substring(
      0,
      dashIndex,
    );
    const foundClass = await processClassBySemesterNumber(
      subjectArr[i].Semester,
    );
    await db
      .insert(subjectMetadataModel)
      .values({
        // degreeId: foundDegree.id as number,
        classId: foundClass.id,
        framework: subjectArr[i].Framework,
        fullMarks: subjectArr[i]["Full Marks"]
          ? formatMarks(String(subjectArr[i]["Full Marks"]))
          : null,
        fullMarksInternal: subjectArr[i]["Full Marks Internal"]
          ? formatMarks(String(subjectArr[i]["Full Marks Internal"]))
          : null,
        fullMarksTheory: subjectArr[i]["Full Marks Theory"]
          ? formatMarks(String(subjectArr[i]["Full Marks Theory"]))
          : null,
        fullMarksPractical: subjectArr[i]["Full Marks Practical"]
          ? formatMarks(String(subjectArr[i]["Full Marks Practical"]))
          : null,
        fullMarksProject: subjectArr[i]["Full Marks Project"]
          ? formatMarks(String(subjectArr[i]["Full Marks Project"]))
          : null,
        fullMarksViva: subjectArr[i]["Full Marks Viva"]
          ? formatMarks(String(subjectArr[i]["Full Marks Viva"]))
          : null,

        isOptional: subjectArr[i]["Is Optional?"] ? true : false,
        subjectTypeId: subjectType ? (subjectType.id as number) : null,
        category: subjectArr[i].Category,
        specializationId: specialization
          ? (specialization.id as number)
          : undefined,
        marksheetCode: subjectArr[i]["Subject Code as per Marksheet"],
        irpCode: subjectArr[i]["Subject Code as per IRP"] ?? irpCode,
        irpName: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
        name: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
        semester: subjectArr[i].Semester,
        course: subjectArr[i].Course,
        degreeId: foundDegree.id,
        credit: subjectArr[i]["Total Credit"],
        internalCredit: subjectArr[i]["Internal Credit"],
        practicalCredit: subjectArr[i]["Practical Credit"],
        theoryCredit: subjectArr[i]["Theory Credit"],
        projectCredit: subjectArr[i]["Practical Credit"],
        vivalCredit: subjectArr[i]["Viva Credit"],
      } as SubjectMetadata)
      .returning();
  }

  return true;
}

export async function refactorSubejectsWithSubjectMetadata(
  fileName: string,
): Promise<boolean> {
  // Read the file from the `/public/temp/` directory
  const filePath = path.resolve(
    directoryName,
    "../../../..",
    "public",
    "temp",
    fileName,
  );

  let degrees = await db.select().from(degreeModel);

  const subjectArr = await readExcelFile<SubjectRow>(filePath);

  for (let i = 0; i < subjectArr.length; i++) {
    const streamName = subjectArr[i].Stream.toUpperCase().trim().split(" ")[0];

    let foundDegree = degrees.find(
      (ele) => ele.name === streamName.toUpperCase().trim(),
    );
    if (!foundDegree) {
      const [newDegree] = await db
        .insert(degreeModel)
        .values({
          name: streamName.toUpperCase().trim(),
          level: streamName.startsWith("B")
            ? "UNDER_GRADUATE"
            : "POST_GRADUATE",
        })
        .returning();
      foundDegree = newDegree;

      degrees = await db.select().from(degreeModel);
    }

    // let [foundStream] = await db.select().from(streamModel).where(and(
    //     eq(streamModel.degreeId, foundDegree.id),
    //     eq(streamModel.framework, subjectArr[i].Framework),
    //     eq(streamModel.degreeProgramme, subjectArr[i].Course!),
    // ));

    // if (!foundStream) {
    //     const [newStream] = await db.insert(streamModel).values({
    //         degreeId: foundDegree.id as number,
    //         degreeProgramme: subjectArr[i].Course,
    //         framework: subjectArr[i].Framework,
    //     } as Stream).returning();

    //     if (!newStream) {
    //         throw Error("Unable to create new stream...!");
    //     }

    //     foundStream = newStream;

    //     if (!foundStream) {
    //         throw Error("Unable to create new stream...!");
    //     }
    // }

    let specialization: Specialization | null = null;
    if (subjectArr[i].Specialization) {
      const [tmpSpecialization] = await db
        .select()
        .from(specializationModel)
        .where(
          eq(
            specializationModel.name,
            subjectArr[i].Specialization?.toUpperCase().trim() as string,
          ),
        );
      specialization = tmpSpecialization as Specialization;
      if (!tmpSpecialization) {
        specialization = await addSpecialization({
          name: subjectArr[i].Specialization?.toUpperCase().trim() as string,
        });
      }
    }

    const irpType = subjectArr[i]["Subject Type as per IRP"]
      ?.toUpperCase()
      .trim();
    const marksheetType = subjectArr[i]["Subject Type as per Marksheet"]
      ?.toUpperCase()
      .trim();

    const whereClauses = [];

    if (irpType) {
      whereClauses.push(eq(subjectTypeModel.irpName, irpType));
    }
    if (marksheetType) {
      whereClauses.push(eq(subjectTypeModel.marksheetName, marksheetType));
    }

    let subjectType: SubjectTypeModel | null = null;

    const [foundSubjectType] = await db
      .select()
      .from(subjectTypeModel)
      .where(
        whereClauses.length === 2 ? and(...whereClauses) : whereClauses[0],
      );

    if (foundSubjectType) {
      subjectType = foundSubjectType;
    } else {
      const [newSubjectType] = await db
        .insert(subjectTypeModel)
        .values({
          irpName: irpType,
          marksheetName: marksheetType,
        })
        .returning();
      subjectType = newSubjectType;
    }

    console.log("subjectType:", subjectType);

    // const whereConditions = [
    //     eq(subjectMetadataModel.streamId, foundStream.id),
    //     // eq(subjectMetadataModel.fullMarks, ),
    //     // eq(subjectMetadataModel.fullMarksInternal, ),
    //     // eq(subjectMetadataModel.fullMarksPractical, ),
    //     // eq(subjectMetadataModel.fullMarksTheory, ),
    //     // eq(subjectMetadataModel.fullMarksTutorial, ),
    //     // eq(subjectMetadataModel.fullMarksViva, ),
    //     // eq(subjectMetadataModel.fullMarksProject, ),
    //     eq(subjectMetadataModel.isOptional, !!subjectArr[i].Optional),
    //     // eq(subjectMetadataModel.subjectTypeId, subjectType),
    //     eq(subjectMetadataModel.category, subjectArr[i].Category),
    //     // eq(subjectMetadataModel.specializationId, ),
    // ]
    const foundClass = await processClassBySemesterNumber(
      subjectArr[i].Semester,
    );
    const [foundSubjectMetadata] = await db
      .select()
      .from(subjectMetadataModel)
      .where(
        and(
          eq(
            subjectMetadataModel.marksheetCode,
            subjectArr[i]["Subject Code as per Marksheet"],
          ),
          eq(subjectMetadataModel.degreeId, foundDegree.id),
          eq(subjectMetadataModel.programmeType, subjectArr[i].Course!),
          eq(subjectMetadataModel.framework, subjectArr[i].Framework!),
          eq(subjectMetadataModel.classId, foundClass.id),
        ),
      );

    if (!foundSubjectMetadata) continue;

    // Update the subject type ids in the subject metadata.
    await db
      .update(subjectMetadataModel)
      .set({
        subjectTypeId: subjectType.id!,
        specializationId: specialization?.id!,
        irpName: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
        name: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
      })
      .where(eq(subjectMetadataModel.id, foundSubjectMetadata.id!));
  }

  return true;
}

export async function refactorSubjectIrpCode() {
  const subjectMetadatas = await db.select().from(subjectMetadataModel);

  console.log(
    `Found ${subjectMetadatas.length} subject metadatas to refactor irpCode.`,
  );

  for (const subjectMetadata of subjectMetadatas) {
    const dashIndex = subjectMetadata.marksheetCode.indexOf("-");
    console.log(
      "dashIndex:",
      dashIndex,
      subjectMetadata.marksheetCode,
      subjectMetadata.irpCode,
    );
    // if (subjectMetadata.irpCode == null && dashIndex != -1) {
    const irpCode = subjectMetadata.marksheetCode.substring(0, dashIndex);
    console.log(
      `Updating subject metadata with id ${subjectMetadata.id} with irpCode: ${irpCode}`,
    );

    const [updatedSbjMetadata] = await db
      .update(subjectMetadataModel)
      .set({ irpCode })
      .where(eq(subjectMetadataModel.id, subjectMetadata.id!))
      .returning();

    console.log("updatedSbjMetadata:", updatedSbjMetadata.irpCode);
  }

  return true;
}

export async function findSubjectMetdataById(
  id: number,
): Promise<SubjectMetadataType | null> {
  const [foundSubjectMetadata] = await db
    .select()
    .from(subjectMetadataModel)
    .where(eq(subjectMetadataModel.id, id));

  const formattedSubjectMetadata =
    await subjectMetadataResponseFormat(foundSubjectMetadata);

  return formattedSubjectMetadata;
}

interface FindSubjectMetdataByFiltersProps {
  degreeId: number;
  classId: number;
}

export async function findSubjectMetdataByFilters({
  degreeId,
  classId,
}: FindSubjectMetdataByFiltersProps): Promise<SubjectMetadataType[]> {
  const foundSubjectMetadatas = await db
    .select()
    .from(subjectMetadataModel)
    .where(
      and(
        eq(subjectMetadataModel.degreeId, degreeId),
        eq(subjectMetadataModel.classId, classId),
      ),
    );

  const formattedSubjectMetadatas = (
    await Promise.all(
      foundSubjectMetadatas.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
      }),
    )
  ).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

  return formattedSubjectMetadatas;
}

export async function findSubjectMetdataByDegreeId(degreeId: number) {
  const foundSubjectMetadatas = await db
    .select()
    .from(subjectMetadataModel)
    .where(eq(subjectMetadataModel.degreeId, degreeId));

  const formattedSubjectMetadatas = (
    await Promise.all(
      foundSubjectMetadatas.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
      }),
    )
  ).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

  return formattedSubjectMetadatas;
}

async function subjectMetadataResponseFormat(
  subjectMetadata: SubjectMetadata | null,
): Promise<SubjectMetadataType | null> {
  if (!subjectMetadata) {
    return null;
  }

  const { degreeId, specializationId, subjectTypeId, ...props } =
    subjectMetadata;

  const degree = await findDegreeById(degreeId);

  let specialization: Specialization | null = null;
  if (specializationId) {
    specialization = await findSpecializationById(specializationId);
  }

  let subjectType: SubjectTypeModel | null = null;
  if (subjectTypeId) {
    const [foundSubjectType] = await db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, subjectTypeId));
    subjectType = foundSubjectType;
  }

  const foundClass = await findClassById(props.classId);
  const formattedSubjectMetadata = {
    ...props,
    specialization,
    class: foundClass,
    degree,
    subjectType,

  } as SubjectMetadataType;

  return formattedSubjectMetadata;
}

function formatMarks(marks: string | null): number | null {
  if (!marks || marks.trim() === "") {
    return null;
  }

  const tmpMarks = Number(marks);
  return isNaN(tmpMarks) ? null : tmpMarks;
}
