import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  IdentityMaster,
  IdentityMasterT,
  identityMasterModel,
} from "@repo/db/schemas/models/administration";

function normaliseIdentityMasterPayload<
  T extends Partial<IdentityMaster | IdentityMasterT>,
>(data: T) {
  const clone = { ...data };

  if (clone.firstName && typeof clone.firstName === "string") {
    clone.firstName = clone.firstName.trim() as T["firstName"];
  }

  if (
    clone.middleName !== undefined &&
    clone.middleName !== null &&
    typeof clone.middleName === "string"
  ) {
    clone.middleName = clone.middleName.trim() as T["middleName"];
  }

  if (
    clone.lastName !== undefined &&
    clone.lastName !== null &&
    typeof clone.lastName === "string"
  ) {
    clone.lastName = clone.lastName.trim() as T["lastName"];
  }

  if (
    clone.email !== undefined &&
    clone.email !== null &&
    typeof clone.email === "string"
  ) {
    clone.email = clone.email.trim() as T["email"];
  }

  if (
    clone.alternativeEmail !== undefined &&
    clone.alternativeEmail !== null &&
    typeof clone.alternativeEmail === "string"
  ) {
    clone.alternativeEmail =
      clone.alternativeEmail.trim() as T["alternativeEmail"];
  }

  if (
    clone.phone !== undefined &&
    clone.phone !== null &&
    typeof clone.phone === "string"
  ) {
    clone.phone = clone.phone.trim() as T["phone"];
  }

  if (
    clone.whatsappNumber !== undefined &&
    clone.whatsappNumber !== null &&
    typeof clone.whatsappNumber === "string"
  ) {
    clone.whatsappNumber = clone.whatsappNumber.trim() as T["whatsappNumber"];
  }

  return clone;
}

export async function createIdentityMaster(data: IdentityMaster) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as IdentityMasterT;

  const payload = normaliseIdentityMasterPayload(rest);

  if (!payload.firstName) {
    throw new Error("First name is required.");
  }

  if (!payload.sesionId) {
    throw new Error("Session is required.");
  }

  const [created] = await db
    .insert(identityMasterModel)
    .values(payload)
    .returning();

  return created;
}

export async function getAllIdentityMasters() {
  return db.select().from(identityMasterModel);
}

export async function findIdentityMasterById(id: number) {
  const [found] = await db
    .select()
    .from(identityMasterModel)
    .where(eq(identityMasterModel.id, id));

  return found ?? null;
}

export async function updateIdentityMaster(
  id: number,
  data: Partial<IdentityMasterT> | Partial<IdentityMaster>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<IdentityMasterT>;

  const payload = normaliseIdentityMasterPayload(rest);

  const [updated] = await db
    .update(identityMasterModel)
    .set(payload)
    .where(eq(identityMasterModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteIdentityMasterSafe(id: number) {
  const [found] = await db
    .select()
    .from(identityMasterModel)
    .where(eq(identityMasterModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(identityMasterModel)
    .where(eq(identityMasterModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Identity master deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete identity master.",
    records: [],
  };
}
