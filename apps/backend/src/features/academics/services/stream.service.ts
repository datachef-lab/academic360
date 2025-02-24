import { db } from "@/db/index.js";
import { Stream, streamModel } from "@/features/academics/models/stream.model.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { findDegreeById } from "@/features/resources/services/degree.service";
import { StreamType } from "@/types/academics/stream.js";
import { eq } from "drizzle-orm";

export async function addStream(stream: StreamType): Promise<StreamType | null> {
    const { degree, ...props } = stream;

    const foundDegree = await findDegreeById(degree.id as number);

    if (!foundDegree) {
        throw Error("No degree available...!");
    }

    const [newStream] = await db.insert(streamModel).values({ ...props, degreeId: foundDegree.id as number } as Stream).returning();

    const formattedStream = await streamResponseFormat(newStream);

    return formattedStream;
}

export async function findAllStreams(): Promise<StreamType[]> {
    const streams = await db.select().from(streamModel);

    const formattedStreams = (await Promise.all(streams.map(async (stream) => {
        return await streamResponseFormat(stream);
    }))).filter((stream): stream is StreamType => stream !== null);

    return formattedStreams;
}

export async function findStreamById(id: number): Promise<StreamType | null> {
    const [foundStream] = await db.select().from(streamModel).where(eq(streamModel.id, id));

    const formattedStream = await streamResponseFormat(foundStream);

    return formattedStream;
}

export async function findStreamByNameAndProgrammee(name: string, degreeProgramme: "HONOURS" | "GENERAL"): Promise<StreamType | null> {
    const [foundStream] = await db.select({
        id: streamModel.id,
        framework: streamModel.framework,
        degreeId: streamModel.degreeId,
        degreeProgramme: streamModel.degreeProgramme,
        duration: streamModel.duration,
        numberOfSemesters: streamModel.numberOfSemesters,
        createdAt: streamModel.createdAt,
        updatedAt: streamModel.updatedAt,
    })
        .from(streamModel)
        .leftJoin(degreeModel, eq(degreeModel.id, streamModel.degreeId))
        .where(eq(streamModel.degreeProgramme, degreeProgramme));

    const formattedStream = await streamResponseFormat(foundStream);

    return formattedStream;
}

export async function streamResponseFormat(stream: Stream | null): Promise<StreamType | null> {
    if (!stream) {
        return null;
    }
    const { degreeId, ...props } = stream;

    let degree = await findDegreeById(degreeId);

    return {
        ...props,
        degree: degree
    } as StreamType;
}