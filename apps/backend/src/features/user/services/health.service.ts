import { HealthType } from "@/types/user/health.js";
import {
  Health,
  healthModel,
  createHealthSchema,
} from "@repo/db/schemas/models/user";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { findBloodGroupById } from "@/features/resources/services/bloodGroup.service.js";
import { bloodGroupModel } from "@/features/resources/models/bloodGroup.model.js";
import { BloodGroupType } from "@/types/resources/blood-group.js";

interface DateObject {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

// Helper function to ensure we have proper Date objects
const ensureDateObjects = (obj: DateObject): DateObject => {
  if (!obj) return obj;
  const result = { ...obj };
  if (typeof result.createdAt === "string") {
    result.createdAt = new Date(result.createdAt);
  }
  if (typeof result.updatedAt === "string") {
    result.updatedAt = new Date(result.updatedAt);
  }
  return result;
};

// Validate input using Zod schema
function validateHealthInput(data: Omit<HealthType, "id">) {
  const parseResult = createHealthSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-expect-error
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

export async function addHealth(
  health: HealthType,
): Promise<HealthType | null> {
  try {
    const { bloodGroup, ...props } = health;
    // Validate input (excluding nested objects)
    validateHealthInput(props);
    // Ensure we have proper Date objects
    const sanitizedProps = ensureDateObjects(props);
    // Set dates if not provided
    if (!sanitizedProps.createdAt) {
      sanitizedProps.createdAt = new Date();
    }
    if (!sanitizedProps.updatedAt) {
      sanitizedProps.updatedAt = new Date();
    }

    // Prepare insert data without bloodGroupId
    const insertData = {
      ...sanitizedProps,
      createdAt: sanitizedProps.createdAt as Date,
      updatedAt: sanitizedProps.updatedAt as Date,
      bloodGroupId: bloodGroup?.id || null,
    };

    // Insert the new health record
    const [newHealth] = await db
      .insert(healthModel)
      .values(insertData)
      .returning();

    if (!newHealth) {
      return null;
    }
    // Now fetch the complete health record with blood group
    return findHealthById(newHealth.id);
  } catch (error) {
    console.error("Error in addHealth service:", error);
    return null;
  }
}

export async function findHealthById(id: number): Promise<HealthType | null> {
  try {
    // Perform a join with the blood group table to get ALL blood group fields
    const result = await db
      .select({
        health: healthModel,
        bloodGroup: {
          id: bloodGroupModel.id,
          type: bloodGroupModel.type,
          sequence: bloodGroupModel.sequence,
          disabled: bloodGroupModel.disabled,
          createdAt: bloodGroupModel.createdAt,
          updatedAt: bloodGroupModel.updatedAt,
        },
      })
      .from(healthModel)
      .leftJoin(
        bloodGroupModel,
        eq(healthModel.bloodGroupId, bloodGroupModel.id),
      )
      .where(eq(healthModel.id, id));
    if (!result || result.length === 0) {
      return null;
    }
    const { health, bloodGroup } = result[0];
    const { bloodGroupId, ...healthProps } = health;

    // Convert string dates to Date objects in bloodGroup
    let sanitizedBloodGroup: BloodGroupType | null = null;
    if (bloodGroup?.id) {
      const sanitized = ensureDateObjects(bloodGroup);
      sanitizedBloodGroup = {
        id: sanitized.id as number,
        type: sanitized.type as string,
        sequence: sanitized.sequence as number | null,
        disabled: sanitized.disabled as boolean,
        createdAt: sanitized.createdAt as Date,
        updatedAt: sanitized.updatedAt as Date,
      };
    }

    const sanitizedHealthProps = ensureDateObjects(healthProps);
    const formattedHealth: HealthType = {
      ...sanitizedHealthProps,
      createdAt: sanitizedHealthProps.createdAt as Date,
      updatedAt: sanitizedHealthProps.updatedAt as Date,
      bloodGroup: sanitizedBloodGroup,
    };
    return formattedHealth;
  } catch (error) {
    console.error("Error in findHealthById service:", error);
    return null;
  }
}

export async function findHealthByStudentId(
  studentId: number,
): Promise<HealthType | null> {
  try {
    const result = await db
      .select({
        health: healthModel,
        bloodGroup: {
          id: bloodGroupModel.id,
          type: bloodGroupModel.type,
          sequence: bloodGroupModel.sequence,
          disabled: bloodGroupModel.disabled,
          createdAt: bloodGroupModel.createdAt,
          updatedAt: bloodGroupModel.updatedAt,
        },
      })
      .from(healthModel)
      .leftJoin(
        bloodGroupModel,
        eq(healthModel.bloodGroupId, bloodGroupModel.id),
      );

    if (!result || result.length === 0) {
      return null;
    }
    const { health, bloodGroup } = result[0];
    const { bloodGroupId, ...healthProps } = health;

    // Convert string dates to Date objects in bloodGroup
    let sanitizedBloodGroup: BloodGroupType | null = null;
    if (bloodGroup?.id) {
      const sanitized = ensureDateObjects(bloodGroup);
      sanitizedBloodGroup = {
        id: sanitized.id as number,
        type: sanitized.type as string,
        sequence: sanitized.sequence as number | null,
        disabled: sanitized.disabled as boolean,
        createdAt: sanitized.createdAt as Date,
        updatedAt: sanitized.updatedAt as Date,
      };
    }

    const sanitizedHealthProps = ensureDateObjects(healthProps);
    const formattedHealth: HealthType = {
      ...sanitizedHealthProps,
      createdAt: sanitizedHealthProps.createdAt as Date,
      updatedAt: sanitizedHealthProps.updatedAt as Date,
      bloodGroup: sanitizedBloodGroup,
    };
    return formattedHealth;
  } catch (error) {
    console.error("Error in findHealthByStudentId service:", error);
    return null;
  }
}

export async function updateHealth(
  id: number,
  health: HealthType,
): Promise<HealthType | null> {
  try {
    const { bloodGroup, ...props } = health;
    // Validate input (excluding nested objects)
    // validateHealthInput({ ...props, studentId });
    // Ensure we have proper Date objects
    const sanitizedProps = ensureDateObjects({ ...props });
    sanitizedProps.updatedAt = new Date();
    // Update the health record
    const [updatedHealth] = await db
      .update(healthModel)
      .set({
        ...sanitizedProps,
        createdAt: sanitizedProps.createdAt as Date,
        updatedAt: sanitizedProps.updatedAt as Date,
        bloodGroupId: bloodGroup?.id,
      })
      .where(eq(healthModel.id, id))
      .returning();
    if (!updatedHealth) {
      return null;
    }
    return findHealthById(updatedHealth.id);
  } catch (error) {
    console.error("Error in updateHealth service:", error);
    return null;
  }
}

export async function removeHealth(id: number): Promise<boolean | null> {
  try {
    const [foundHealth] = await db
      .select()
      .from(healthModel)
      .where(eq(healthModel.id, id));
    if (!foundHealth) {
      return null;
    }
    const [deletedHealth] = await db
      .delete(healthModel)
      .where(eq(healthModel.id, id))
      .returning();
    if (!deletedHealth) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in removeHealth service:", error);
    return false;
  }
}

export async function removeHealthByStudentId(
  studentId: number,
): Promise<boolean | null> {
  try {
    // const [deletedHealth] = await db.delete(healthModel).where(eq(healthModel.studentId, studentId)).returning();
    // if (!deletedHealth) {
    //     return false;
    // }
    return false;
  } catch (error) {
    console.error("Error in removeHealthByStudentId service:", error);
    return false;
  }
}

export async function healthResponseFormat(
  health: Health,
): Promise<HealthType | null> {
  try {
    if (!health) {
      return null;
    }
    const { bloodGroupId, ...props } = health;
    const sanitizedProps = ensureDateObjects(props);

    const formattedHealth: HealthType = {
      ...sanitizedProps,
      createdAt: sanitizedProps.createdAt as Date,
      updatedAt: sanitizedProps.updatedAt as Date,
    };

    // Always include bloodGroup in the response, even if null
    if (bloodGroupId) {
      const bloodGroup = await findBloodGroupById(bloodGroupId);
      if (bloodGroup) {
        const sanitized = ensureDateObjects(bloodGroup);
        formattedHealth.bloodGroup = {
          id: sanitized.id as number,
          type: sanitized.type as string,
          sequence: sanitized.sequence as number | null,
          disabled: sanitized.disabled as boolean,
          createdAt: sanitized.createdAt as Date,
          updatedAt: sanitized.updatedAt as Date,
        };
      } else {
        formattedHealth.bloodGroup = null;
      }
    } else {
      formattedHealth.bloodGroup = null;
    }
    return formattedHealth;
  } catch (error) {
    console.error("Error in healthResponseFormat service:", error);
    return null;
  }
}

export async function getAllHealths(): Promise<Health[]> {
  const healths = await db.select().from(healthModel);
  return healths;
}
