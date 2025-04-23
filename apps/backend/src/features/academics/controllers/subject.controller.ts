import { Request, Response } from "express";
import { db } from "@/db/index.js";
import { eq, and, sql } from "drizzle-orm";
import { subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { streamModel } from "../models/stream.model.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { getFilteredSubjectsHandler } from "./subjectHelper.js";

/**
 * Get subjects based on framework, semester, and stream filters
 */
export const getFilteredSubjects = getFilteredSubjectsHandler; 