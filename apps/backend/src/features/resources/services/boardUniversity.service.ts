import { BoardUniversityType } from "@/types/resources/board-university";
import { BoardUniversity, boardUniversityModel } from "../models/boardUniversity.model";
import { findDegreeById } from "./degree.service";
import { findAddressById } from "@/features/user/services/address.service";
import { db } from "@/db/index";
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