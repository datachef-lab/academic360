import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { vendorModel } from "@repo/db/schemas/models/library/vendor.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type VendorListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type VendorListRow = {
  id: number;
  legacyVendorId: number | null;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  personOfContact: string | null;
  personOfContactEmail: string | null;
  personOfContactPhone: string | null;
  pan: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VendorListResult = {
  rows: VendorListRow[];
  total: number;
  page: number;
  limit: number;
};

export type VendorUpsertInput = {
  name: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  personOfContact?: string | null;
  personOfContactEmail?: string | null;
  personOfContactPhone?: string | null;
  pan?: string | null;
};

const buildListWhere = (
  filters: Omit<VendorListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(vendorModel.name, term),
      ilike(vendorModel.code, term),
      ilike(vendorModel.email, term),
      ilike(vendorModel.phone, term),
      ilike(vendorModel.personOfContact, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

const VENDOR_LIST_COLUMNS = {
  id: vendorModel.id,
  legacyVendorId: vendorModel.legacyVendorId,
  name: vendorModel.name,
  code: vendorModel.code,
  email: vendorModel.email,
  phone: vendorModel.phone,
  website: vendorModel.website,
  personOfContact: vendorModel.personOfContact,
  personOfContactEmail: vendorModel.personOfContactEmail,
  personOfContactPhone: vendorModel.personOfContactPhone,
  pan: vendorModel.pan,
  createdAt: vendorModel.createdAt,
  updatedAt: vendorModel.updatedAt,
};

export async function findVendorsPaginated(
  filters: VendorListFilters,
): Promise<VendorListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(vendorModel)
    .where(whereClause);

  const rows = await db
    .select(VENDOR_LIST_COLUMNS)
    .from(vendorModel)
    .where(whereClause)
    .orderBy(desc(vendorModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getVendorById(id: number): Promise<VendorListRow | null> {
  const [row] = await db
    .select(VENDOR_LIST_COLUMNS)
    .from(vendorModel)
    .where(eq(vendorModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalizeUpsert = (input: VendorUpsertInput) => ({
  name: input.name.trim(),
  code: input.code?.trim() ? input.code.trim() : null,
  email: input.email?.trim() ? input.email.trim() : null,
  phone: input.phone?.trim() ? input.phone.trim() : null,
  website: input.website?.trim() ? input.website.trim() : null,
  personOfContact: input.personOfContact?.trim()
    ? input.personOfContact.trim()
    : null,
  personOfContactEmail: input.personOfContactEmail?.trim()
    ? input.personOfContactEmail.trim()
    : null,
  personOfContactPhone: input.personOfContactPhone?.trim()
    ? input.personOfContactPhone.trim()
    : null,
  pan: input.pan?.trim() ? input.pan.trim() : null,
});

export async function createVendor(input: VendorUpsertInput): Promise<number> {
  await assertUniqueLibraryName({
    table: vendorModel,
    nameColumn: vendorModel.name,
    idColumn: vendorModel.id,
    value: input.name,
    label: "Vendor",
  });
  const [inserted] = await db
    .insert(vendorModel)
    .values(normalizeUpsert(input))
    .returning({ id: vendorModel.id });
  return inserted.id;
}

export async function updateVendor(
  id: number,
  input: VendorUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: vendorModel,
    nameColumn: vendorModel.name,
    idColumn: vendorModel.id,
    value: input.name,
    label: "Vendor",
    excludeId: id,
  });
  await db
    .update(vendorModel)
    .set({ ...normalizeUpsert(input), updatedAt: new Date() })
    .where(eq(vendorModel.id, id));
}

export async function deleteVendor(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.vendorId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This vendor cannot be deleted because it is linked to ${linkedCount} copy detail record(s).`,
    );
  }

  await db.delete(vendorModel).where(eq(vendorModel.id, id));
}
