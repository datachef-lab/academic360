import { BoardUniversityType } from "@/types/resources/board-university.js";
import { BoardUniversity, boardUniversityModel } from "@/features/resources/models/boardUniversity.model.js";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import { findAddressById } from "@/features/user/services/address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

export async function findBoardUniversityById(id: number): Promise<BoardUniversityType | null> {
    const [foundBoardUniversity] = await db.select().from(boardUniversityModel).where(eq(boardUniversityModel.id, id));

    const formattedBoardUniversity = await boardUniversityResponseFormat(foundBoardUniversity);

    return formattedBoardUniversity;
}

export async function boardUniversityResponseFormat(boardUniversity: BoardUniversity): Promise<BoardUniversityType | null> {
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