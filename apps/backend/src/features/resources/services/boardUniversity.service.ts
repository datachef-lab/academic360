import { BoardUniversityType } from "@/types/resources/board-university.js";
import {
  BoardUniversity,
  boardUniversityModel,
} from "@/features/resources/models/boardUniversity.model.js";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import { findAddressById } from "@/features/user/services/address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

export async function findBoardUniversityById(
  id: number,
): Promise<BoardUniversityType | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardUniversityModel)
    .where(eq(boardUniversityModel.id, id));

  const formattedBoardUniversity =
    await boardUniversityResponseFormat(foundBoardUniversity);

  return formattedBoardUniversity;
}

export async function findAllBoardUniversities(): Promise<BoardUniversity[]> {
  return await db
    .select()
    .from(boardUniversityModel)
    .orderBy(boardUniversityModel.sequence);
}

export async function createBoardUniversity(
  data: Omit<BoardUniversity, "id" | "createdAt" | "updatedAt">,
): Promise<BoardUniversity> {
  const [newBoardUniversity] = await db
    .insert(boardUniversityModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newBoardUniversity;
}

export async function updateBoardUniversity(
  id: number,
  data: Partial<Omit<BoardUniversity, "id" | "createdAt" | "updatedAt">>,
): Promise<BoardUniversity | null> {
  const [updatedBoardUniversity] = await db
    .update(boardUniversityModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(boardUniversityModel.id, id))
    .returning();

  return updatedBoardUniversity || null;
}

export async function deleteBoardUniversity(
  id: number,
): Promise<BoardUniversity | null> {
  const [deletedBoardUniversity] = await db
    .delete(boardUniversityModel)
    .where(eq(boardUniversityModel.id, id))
    .returning();

  return deletedBoardUniversity || null;
}

export async function findBoardUniversityByName(
  name: string,
): Promise<BoardUniversity | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardUniversityModel)
    .where(eq(boardUniversityModel.name, name));

  return foundBoardUniversity || null;
}

export async function findBoardUniversityByCode(
  code: string,
): Promise<BoardUniversity | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardUniversityModel)
    .where(eq(boardUniversityModel.code, code));

  return foundBoardUniversity || null;
}

export async function boardUniversityResponseFormat(
  boardUniversity: BoardUniversity,
): Promise<BoardUniversityType | null> {
  if (!boardUniversity) {
    return null;
  }

  const { degreeId, addressId, ...props } = boardUniversity;

  const formattedBoardUniversity: BoardUniversityType = { ...props };

  if (degreeId) {
    formattedBoardUniversity.degree = await findDegreeById(degreeId);
  }

  if (addressId) {
    formattedBoardUniversity.address = await findAddressById(addressId);
  }

  return formattedBoardUniversity;
}
