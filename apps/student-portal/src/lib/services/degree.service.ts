import { dbPostgres } from "@/db";
import { degree, degreeLevelType } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { Degree } from "@/types/resources/degree";

type DegreeLevel = typeof degreeLevelType.enumValues[number];

export type AddDegreeResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function uploadDegreesFromFile(formData: FormData): Promise<AddDegreeResult> {
  try {
    const file = formData.get("file");
    if (!file) {
      return { success: false, error: "No file uploaded" };
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);

    const validDegrees = json
      .map((row) => ({
        name: row["Name"] || row["name"],
        level: row["Level"] || row["level"],
        sequence: row["Sequence"] || row["sequence"],
      }))
      .filter((d) => d.name && d.level && degreeLevelType.enumValues.includes(d.level));

    if (validDegrees.length === 0) {
      return {
        success: false,
        error: "No valid degrees found in the file. Please check the format.",
      };
    }

    // Check for duplicates
    const existingDegrees = await dbPostgres
      .select()
      .from(degree)
      .where(eq(degree.disabled, false));

    const duplicates = validDegrees.filter((newDegree) =>
      existingDegrees.some(
        (existing) =>
          existing.name.toLowerCase() === newDegree.name.toLowerCase() &&
          existing.level === newDegree.level
      )
    );

    if (duplicates.length > 0) {
      return {
        success: false,
        error: `Duplicate degrees found: ${duplicates
          .map((d) => `${d.name} (${d.level})`)
          .join(", ")}`,
      };
    }

    await dbPostgres.insert(degree).values(validDegrees.map(d => ({
      ...d,
      sequence: d.sequence,
    })));

    return {
      success: true,
      message: `${validDegrees.length} degrees uploaded successfully`,
    };
  } catch (error) {
    console.error("Error uploading degrees:", error);
    return {
      success: false,
      error: "Failed to process the file. Please check the format and try again.",
    };
  }
}

export async function getAllDegrees() {
  return await dbPostgres
    .select()
    .from(degree)
    .where(eq(degree.disabled, false))
    .orderBy(degree.id);
}

export async function getDegreeById(id: number) {
  const result = await dbPostgres
    .select()
    .from(degree)
    .where(eq(degree.id, id))
    .limit(1);
  return result[0];
}

export async function createDegree(data: {
  name: string;
  level: string;
  sequence?: number;
}): Promise<AddDegreeResult> {
  try {
    if (!degreeLevelType.enumValues.includes(data.level as any)) {
      return {
        success: false,
        error: "Invalid degree level",
      };
    }

    // Check for duplicates
    const existingDegrees = await dbPostgres
      .select()
      .from(degree)
      .where(eq(degree.disabled, false));

    const isDuplicate = existingDegrees.some(
      (degree) =>
        degree.name.toLowerCase() === data.name.toLowerCase() &&
        degree.level === data.level
    );

    if (isDuplicate) {
      return {
        success: false,
        error: "A degree with this name and level already exists",
      };
    }

    await dbPostgres.insert(degree).values({
      name: data.name,
      level: data.level as any,
      sequence: data.sequence,
    });

    return {
      success: true,
      message: "Degree created successfully",
    };
  } catch (error) {
    console.error("Error creating degree:", error);
    return {
      success: false,
      error: "Failed to create degree",
    };
  }
}

export async function updateDegree(
  id: number,
  data: {
    name: string;
    level: string;
    sequence?: number;
  }
): Promise<AddDegreeResult> {
  try {
    if (!degreeLevelType.enumValues.includes(data.level as any)) {
      return {
        success: false,
        error: "Invalid degree level",
      };
    }

    // Check for duplicates excluding the current degree
    const existingDegrees = await dbPostgres
      .select()
      .from(degree)
      .where(eq(degree.disabled, false));

    const isDuplicate = existingDegrees.some(
      (degree) =>
        degree.id !== id &&
        degree.name.toLowerCase() === data.name.toLowerCase() &&
        degree.level === data.level
    );

    if (isDuplicate) {
      return {
        success: false,
        error: "A degree with this name and level already exists",
      };
    }

    await dbPostgres
      .update(degree)
      .set({
        name: data.name,
        level: data.level as any,
        sequence: data.sequence,
      })
      .where(eq(degree.id, id));

    return {
      success: true,
      message: "Degree updated successfully",
    };
  } catch (error) {
    console.error("Error updating degree:", error);
    return {
      success: false,
      error: "Failed to update degree",
    };
  }
}

export async function toggleDegreeStatus(id: number): Promise<AddDegreeResult> {
  try {
    const currentDegree = await getDegreeById(id);
    if (!currentDegree) {
      return {
        success: false,
        error: "Degree not found",
      };
    }

    await dbPostgres
      .update(degree)
      .set({
        disabled: !currentDegree.disabled,
      })
      .where(eq(degree.id, id));

    return {
      success: true,
      message: `Degree ${currentDegree.disabled ? "enabled" : "disabled"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling degree status:", error);
    return {
      success: false,
      error: "Failed to toggle degree status",
    };
  }
}
