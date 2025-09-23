import { Board, boardModel, BoardT } from "@repo/db/schemas";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import { findAddressById } from "@/features/user/services/address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { BoardDto } from "@repo/db/dtos";

export async function findBoardUniversityById(
  id: number,
): Promise<BoardDto | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardModel)
    .where(eq(boardModel.id, id));

  const formattedBoardUniversity = await boardUniversityResponseFormat(
    foundBoardUniversity as unknown as Board,
  );

  return formattedBoardUniversity;
}

export async function findAllBoardUniversities(): Promise<BoardDto[]> {
  const rows = await db.select().from(boardModel).orderBy(boardModel.sequence);
  const list = await Promise.all(
    rows.map((row) => boardUniversityResponseFormat(row as unknown as Board)),
  );
  return list.filter(Boolean) as BoardDto[];
}

export async function createBoardUniversity(
  data: Omit<Board, "id" | "createdAt" | "updatedAt">,
): Promise<Board> {
  const [newBoardUniversity] = await db
    .insert(boardModel)
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
  data: Partial<Omit<Board, "id" | "createdAt" | "updatedAt">>,
): Promise<Board | null> {
  const [updatedBoardUniversity] = await db
    .update(boardModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(boardModel.id, id))
    .returning();

  return updatedBoardUniversity || null;
}

export async function deleteBoardUniversity(id: number): Promise<Board | null> {
  const [deletedBoardUniversity] = await db
    .delete(boardModel)
    .where(eq(boardModel.id, id))
    .returning();

  return deletedBoardUniversity || null;
}

export async function findBoardUniversityByName(
  name: string,
): Promise<Board | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardModel)
    .where(eq(boardModel.name, name));

  return foundBoardUniversity || null;
}

export async function findBoardUniversityByCode(
  code: string,
): Promise<Board | null> {
  const [foundBoardUniversity] = await db
    .select()
    .from(boardModel)
    .where(eq(boardModel.code, code));

  return foundBoardUniversity || null;
}

export async function boardUniversityResponseFormat(
  boardUniversity: Board,
): Promise<BoardDto | null> {
  if (!boardUniversity) {
    return null;
  }

  const { degreeId, addressId, ...props } = boardUniversity;

  const formattedBoardUniversity: BoardDto = {
    ...(props as unknown as Omit<BoardDto, "degree" | "address">),
    degree: null,
    address: null,
  };

  if (degreeId) {
    formattedBoardUniversity.degree = await findDegreeById(degreeId as number);
  }

  if (addressId) {
    const addr = await findAddressById(addressId as number);
    // Ensure AddressDto contract includes district (nullable)
    formattedBoardUniversity.address = addr
      ? ({
          ...(addr as unknown as object),
          district:
            (addr as unknown as { district?: unknown }).district ?? null,
        } as unknown as BoardDto["address"])
      : null;
  }

  return formattedBoardUniversity;
}
