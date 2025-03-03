import { PaperType } from "@/types/academics/paper.js";
import { Paper, paperModel } from "../models/paper.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { findOfferedSubjectById } from "./offeredSubject.service.js";
import { OfferedSubjectType } from "@/types/academics/offered-subject.js";

export async function findPaperById(id: number): Promise<PaperType | null> {
    const [foundPaper] = await db.select().from(paperModel).where(eq(paperModel.id, id));

    const formattedPaper = await paperFormateResponse(foundPaper);

    return formattedPaper;
}

export async function paperFormateResponse(paper: Paper | null): Promise<PaperType | null> {
    if (!paper) {
        return null;
    }

    const { offeredSubjectId, ...props } = paper;

    const offeredSubject = await findOfferedSubjectById(offeredSubjectId);

    return {
        ...props,
        offeredSubject: offeredSubject as OfferedSubjectType
    }
}