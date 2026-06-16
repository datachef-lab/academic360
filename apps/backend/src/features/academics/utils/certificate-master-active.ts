import {
  certificateFieldMasterModel,
  certificateFieldOptionMasterModel,
  certificateMasterModel,
} from "@repo/db/schemas";
import { and, eq, sql, type SQL } from "drizzle-orm";

type ActiveFlagRow = {
  isActive?: boolean | null;
};

export function isCertificateMasterActive(
  row: ActiveFlagRow | null | undefined,
): boolean {
  return row != null && row.isActive !== false;
}

export function isCertificateFieldMasterActive(
  row: ActiveFlagRow | null | undefined,
): boolean {
  return row != null && row.isActive !== false;
}

export function isCertificateFieldOptionActive(
  row: ActiveFlagRow | null | undefined,
): boolean {
  return row != null && row.isActive !== false;
}

export const ACTIVE_CERTIFICATE_MASTER_SQL = sql`COALESCE(${certificateMasterModel.isActive}, true) = true`;
export const ACTIVE_CERTIFICATE_FIELD_SQL = sql`COALESCE(${certificateFieldMasterModel.isActive}, true) = true`;
export const ACTIVE_CERTIFICATE_OPTION_SQL = sql`COALESCE(${certificateFieldOptionMasterModel.isActive}, true) = true`;

export function activeCertificateMasterIdWhere(id: number): SQL {
  return and(eq(certificateMasterModel.id, id), ACTIVE_CERTIFICATE_MASTER_SQL)!;
}

export function activeCertificateFieldMasterIdWhere(id: number): SQL {
  return and(
    eq(certificateFieldMasterModel.id, id),
    ACTIVE_CERTIFICATE_FIELD_SQL,
  )!;
}

export function activeCertificateOptionForFieldWhere(
  certificateFieldMasterId: number,
  optionId: number,
): SQL {
  return and(
    eq(certificateFieldOptionMasterModel.id, optionId),
    eq(
      certificateFieldOptionMasterModel.certificateFieldMasterId,
      certificateFieldMasterId,
    ),
    ACTIVE_CERTIFICATE_OPTION_SQL,
  )!;
}
