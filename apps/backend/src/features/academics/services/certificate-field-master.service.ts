import { db } from "@/db/index.js";
import {
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  createCertificateFieldMasterSchema,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";
import type { CertificateFieldMasterDto } from "@repo/db/dtos/academics";

async function rowToDto(
  row: typeof certificateFieldMasterModel.$inferSelect,
): Promise<CertificateFieldMasterDto | null> {
  const options = await db
    .select()
    .from(certificateFieldOptionMasterModel)
    .where(
      eq(certificateFieldOptionMasterModel.certificateFieldMasterId, row.id),
    )
    .orderBy(asc(certificateFieldOptionMasterModel.sequence));

  return {
    ...(row as any),
    options: options as any,
  };
}

export async function findAllCertificateFieldMasters(): Promise<
  CertificateFieldMasterDto[]
> {
  const rows = await db
    .select()
    .from(certificateFieldMasterModel)
    .orderBy(asc(certificateFieldMasterModel.sequence));

  const dtos = await Promise.all(rows.map((r) => rowToDto(r)));
  return dtos.filter((d): d is CertificateFieldMasterDto => d !== null);
}

export async function findCertificateFieldMastersByCertificateMasterId(
  certificateMasterId: number,
): Promise<CertificateFieldMasterDto[]> {
  const rows = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(
      eq(certificateFieldMasterModel.certificateMasterId, certificateMasterId),
    )
    .orderBy(asc(certificateFieldMasterModel.sequence));

  const dtos = await Promise.all(rows.map((r) => rowToDto(r)));
  return dtos.filter((d): d is CertificateFieldMasterDto => d !== null);
}

export async function findCertificateFieldMasterById(
  id: number,
): Promise<CertificateFieldMasterDto | null> {
  const [row] = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, id));

  if (!row) return null;
  return rowToDto(row);
}

export async function createCertificateFieldMaster(
  data: typeof createCertificateFieldMasterSchema._type,
): Promise<CertificateFieldMasterDto | null> {
  const [created] = await db
    .insert(certificateFieldMasterModel)
    .values(data)
    .returning();

  if (!created) return null;
  return rowToDto(created);
}

export async function updateCertificateFieldMaster(
  id: number,
  data: Partial<typeof createCertificateFieldMasterSchema._type>,
): Promise<CertificateFieldMasterDto | null> {
  const [existing] = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, id));

  if (!existing) return null;

  const [updated] = await db
    .update(certificateFieldMasterModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(certificateFieldMasterModel.id, id))
    .returning();

  if (!updated) return null;
  return rowToDto(updated);
}

export async function deleteCertificateFieldMaster(
  id: number,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, id));

  if (!existing) return false;

  // If FK is NO ACTION, delete children first.
  await db
    .delete(certificateFieldOptionMasterModel)
    .where(eq(certificateFieldOptionMasterModel.certificateFieldMasterId, id));

  const deleted = await db
    .delete(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, id))
    .returning({ id: certificateFieldMasterModel.id });

  return deleted.length > 0;
}
