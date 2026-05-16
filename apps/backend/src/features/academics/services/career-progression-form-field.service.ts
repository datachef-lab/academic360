import { db } from "@/db/index.js";
import {
  careerProgressionFormCertificateModel,
  careerProgressionFormFieldModel,
  careerProgressionFormModel,
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  createCareerProgressionFormFieldSchema,
} from "@repo/db/schemas";
import { and, asc, eq } from "drizzle-orm";
import type { CareerProgressionFormFieldDto } from "@repo/db/dtos/academics";

async function rowToDto(
  row: typeof careerProgressionFormFieldModel.$inferSelect,
): Promise<CareerProgressionFormFieldDto | null> {
  const [master] = await db
    .select()
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, row.certificateFieldMasterId));

  if (!master) return null;

  let option: typeof certificateFieldOptionMasterModel.$inferSelect | null =
    null;
  if (row.certificateFieldOptionMasterId != null) {
    const [opt] = await db
      .select()
      .from(certificateFieldOptionMasterModel)
      .where(
        eq(
          certificateFieldOptionMasterModel.id,
          row.certificateFieldOptionMasterId,
        ),
      );
    if (opt) {
      if (opt.certificateFieldMasterId !== row.certificateFieldMasterId) {
        return null;
      }
      option = opt;
    }
  }

  return {
    id: row.id,
    careerProgressionFormCertificateId: row.careerProgressionFormCertificateId,
    value: row.value,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    certificateFieldMaster: master,
    certificateFieldOptionMaster: option,
  };
}

export async function findAllCareerProgressionFormFields(): Promise<
  CareerProgressionFormFieldDto[]
> {
  const rows = await db
    .select()
    .from(careerProgressionFormFieldModel)
    .orderBy(asc(careerProgressionFormFieldModel.id));

  const dtos: Array<CareerProgressionFormFieldDto | null> = await Promise.all(
    rows.map((r) => rowToDto(r)),
  );
  return dtos.filter((d): d is CareerProgressionFormFieldDto => d !== null);
}

export async function findCareerProgressionFormFieldsByFormId(
  careerProgressionFormId: number,
): Promise<CareerProgressionFormFieldDto[]> {
  const certificates = await db
    .select({ id: careerProgressionFormCertificateModel.id })
    .from(careerProgressionFormCertificateModel)
    .where(
      eq(
        careerProgressionFormCertificateModel.careerProgressionFormId,
        careerProgressionFormId,
      ),
    );

  if (certificates.length === 0) return [];

  const certificateIdSet = new Set(certificates.map((c) => c.id));
  const rows = await db
    .select()
    .from(careerProgressionFormFieldModel)
    .orderBy(asc(careerProgressionFormFieldModel.id));

  const filteredRows = rows.filter((r) =>
    certificateIdSet.has(r.careerProgressionFormCertificateId),
  );

  const dtos: Array<CareerProgressionFormFieldDto | null> = await Promise.all(
    filteredRows.map((r) => rowToDto(r)),
  );
  return dtos.filter((d): d is CareerProgressionFormFieldDto => d !== null);
}

export async function findCareerProgressionFormFieldsByCertificateId(
  careerProgressionFormCertificateId: number,
): Promise<CareerProgressionFormFieldDto[]> {
  const rows = await db
    .select()
    .from(careerProgressionFormFieldModel)
    .where(
      eq(
        careerProgressionFormFieldModel.careerProgressionFormCertificateId,
        careerProgressionFormCertificateId,
      ),
    )
    .orderBy(asc(careerProgressionFormFieldModel.id));

  const dtos: Array<CareerProgressionFormFieldDto | null> = await Promise.all(
    rows.map((r) => rowToDto(r)),
  );
  return dtos.filter((d): d is CareerProgressionFormFieldDto => d !== null);
}

export async function findCareerProgressionFormFieldById(
  id: number,
): Promise<CareerProgressionFormFieldDto | null> {
  const [row] = await db
    .select()
    .from(careerProgressionFormFieldModel)
    .where(eq(careerProgressionFormFieldModel.id, id));

  if (!row) return null;
  return rowToDto(row);
}

async function assertFormExists(
  careerProgressionFormId: number,
): Promise<boolean> {
  const [form] = await db
    .select({ id: careerProgressionFormModel.id })
    .from(careerProgressionFormModel)
    .where(eq(careerProgressionFormModel.id, careerProgressionFormId));
  return !!form;
}

async function assertCertificateExists(
  careerProgressionFormCertificateId: number,
): Promise<boolean> {
  const [certificate] = await db
    .select({ id: careerProgressionFormCertificateModel.id })
    .from(careerProgressionFormCertificateModel)
    .where(
      eq(
        careerProgressionFormCertificateModel.id,
        careerProgressionFormCertificateId,
      ),
    );
  return !!certificate;
}

async function assertFieldMasterExists(
  certificateFieldMasterId: number,
): Promise<boolean> {
  const [m] = await db
    .select({ id: certificateFieldMasterModel.id })
    .from(certificateFieldMasterModel)
    .where(eq(certificateFieldMasterModel.id, certificateFieldMasterId));
  return !!m;
}

async function assertOptionValidForMaster(
  certificateFieldMasterId: number,
  optionId: number,
): Promise<boolean> {
  const [opt] = await db
    .select()
    .from(certificateFieldOptionMasterModel)
    .where(
      and(
        eq(certificateFieldOptionMasterModel.id, optionId),
        eq(
          certificateFieldOptionMasterModel.certificateFieldMasterId,
          certificateFieldMasterId,
        ),
      ),
    );
  return !!opt;
}

export async function createCareerProgressionFormField(
  data: typeof createCareerProgressionFormFieldSchema._type,
): Promise<CareerProgressionFormFieldDto | null> {
  const okCertificate = await assertCertificateExists(
    data.careerProgressionFormCertificateId,
  );
  if (!okCertificate) return null;

  const okMaster = await assertFieldMasterExists(data.certificateFieldMasterId);
  if (!okMaster) return null;

  if (data.certificateFieldOptionMasterId != null) {
    const okOpt = await assertOptionValidForMaster(
      data.certificateFieldMasterId,
      data.certificateFieldOptionMasterId,
    );
    if (!okOpt) return null;
  }

  const [created] = await db
    .insert(careerProgressionFormFieldModel)
    .values(data)
    .returning();

  if (!created) return null;
  return rowToDto(created);
}

export async function updateCareerProgressionFormField(
  id: number,
  data: Partial<typeof createCareerProgressionFormFieldSchema._type>,
): Promise<CareerProgressionFormFieldDto | null> {
  const [existing] = await db
    .select()
    .from(careerProgressionFormFieldModel)
    .where(eq(careerProgressionFormFieldModel.id, id));

  if (!existing) return null;

  const nextMasterId =
    data.certificateFieldMasterId ?? existing.certificateFieldMasterId;
  const nextOptionId =
    data.certificateFieldOptionMasterId !== undefined
      ? data.certificateFieldOptionMasterId
      : existing.certificateFieldOptionMasterId;

  if (data.careerProgressionFormCertificateId != null) {
    const okCertificate = await assertCertificateExists(
      data.careerProgressionFormCertificateId,
    );
    if (!okCertificate) return null;
  }

  if (data.certificateFieldMasterId != null) {
    const okMaster = await assertFieldMasterExists(
      data.certificateFieldMasterId,
    );
    if (!okMaster) return null;
  }

  if (nextOptionId != null) {
    const okOpt = await assertOptionValidForMaster(nextMasterId, nextOptionId);
    if (!okOpt) return null;
  }

  const [updated] = await db
    .update(careerProgressionFormFieldModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(careerProgressionFormFieldModel.id, id))
    .returning();

  if (!updated) return null;
  return rowToDto(updated);
}

export async function deleteCareerProgressionFormField(
  id: number,
): Promise<boolean> {
  const deleted = await db
    .delete(careerProgressionFormFieldModel)
    .where(eq(careerProgressionFormFieldModel.id, id))
    .returning({ id: careerProgressionFormFieldModel.id });

  return deleted.length > 0;
}
