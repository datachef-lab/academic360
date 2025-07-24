import { db } from "@/db";
import { streams } from "../models/stream.model";
import { eq } from "drizzle-orm";
import { insertStreamSchema } from "../models/stream.model";
import { z } from "zod";

// Types
export type StreamData = z.infer<typeof insertStreamSchema>;

// Create a new stream
export const createStream = async (streamData: StreamData) => {
  const validatedData = insertStreamSchema.parse(streamData);
  const newStream = await db.insert(streams).values(validatedData).returning();
  return newStream[0];
};

// Get all streams
export const getAllStreams = async () => {
  const allStreams = await db.select().from(streams);
  return allStreams;
};

// Get stream by ID
export const getStreamById = async (id: string) => {
  const stream = await db.select().from(streams).where(eq(streams.id, id));
  return stream.length > 0 ? stream[0] : null;
};

// Update stream
export const updateStream = async (id: string, streamData: StreamData) => {
  const validatedData = insertStreamSchema.parse(streamData);
  const updatedStream = await db
    .update(streams)
    .set(validatedData)
    .where(eq(streams.id, id))
    .returning();
  return updatedStream.length > 0 ? updatedStream[0] : null;
};

// Delete stream
export const deleteStream = async (id: string) => {
  const deletedStream = await db
    .delete(streams)
    .where(eq(streams.id, id))
    .returning();
  return deletedStream.length > 0 ? deletedStream[0] : null;
};
