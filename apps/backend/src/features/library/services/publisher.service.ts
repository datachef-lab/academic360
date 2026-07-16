import { db } from "@/db/index.js";
import { PublisherDto } from "@repo/db/dtos/library";
import { Publisher, publisherModel } from "@repo/db/schemas";
import { addressModel } from "@repo/db/schemas/models/user/address.model.js";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type PublisherAddressInput = {
  addressLine?: string | null;
  countryId?: number | null;
  stateId?: number | null;
  cityId?: number | null;
  pincode?: string | null;
  landmark?: string | null;
};

export type PublisherAddress = PublisherAddressInput & { id: number | null };

type PublisherListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type PublisherListResult = {
  rows: PublisherDto[];
  total: number;
  page: number;
  limit: number;
};

const modelToDto = (model: Publisher): PublisherDto => ({
  ...model,
  address: null,
});

export async function findPublisherById(
  id: number,
): Promise<PublisherDto | null> {
  const [publisher] = await db
    .select()
    .from(publisherModel)
    .where(eq(publisherModel.id, id));

  return publisher ? modelToDto(publisher) : null;
}

export async function findPublisherByName(
  name: string,
  excludeId?: number,
): Promise<Publisher | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(publisherModel.name, name.trim()),
          ne(publisherModel.id, excludeId),
        )
      : ilike(publisherModel.name, name.trim());

  const [publisher] = await db.select().from(publisherModel).where(whereClause);
  return publisher ?? null;
}

export async function findPublishersPaginated(
  filters: PublisherListFilters,
): Promise<PublisherListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(publisherModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(publisherModel)
    .where(whereClause)
    .orderBy(desc(publisherModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(publisherModel)
    .where(whereClause);

  return {
    rows: rows.map(modelToDto),
    total,
    page,
    limit,
  };
}

export async function createPublisher(
  data: Omit<Publisher, "id">,
): Promise<PublisherDto> {
  await assertUniqueLibraryName({
    table: publisherModel,
    nameColumn: publisherModel.name,
    idColumn: publisherModel.id,
    value: data.name,
    label: "Publisher",
  });
  const [created] = await db.insert(publisherModel).values(data).returning();
  return modelToDto(created);
}

export async function updatePublisher(
  id: number,
  data: Partial<Omit<Publisher, "id">>,
): Promise<PublisherDto | null> {
  if (data.name != null) {
    await assertUniqueLibraryName({
      table: publisherModel,
      nameColumn: publisherModel.name,
      idColumn: publisherModel.id,
      value: data.name,
      label: "Publisher",
      excludeId: id,
    });
  }
  const [updated] = await db
    .update(publisherModel)
    .set(data)
    .where(eq(publisherModel.id, id))
    .returning();

  return updated ? modelToDto(updated) : null;
}

export async function deletePublisher(
  id: number,
): Promise<PublisherDto | null> {
  const [deleted] = await db
    .delete(publisherModel)
    .where(eq(publisherModel.id, id))
    .returning();

  return deleted ? modelToDto(deleted) : null;
}

/** The publisher's place/address (the first address row linked to the publisher). */
export async function getPublisherAddress(
  publisherId: number,
): Promise<PublisherAddress> {
  const [row] = await db
    .select({
      id: addressModel.id,
      addressLine: addressModel.addressLine,
      countryId: addressModel.countryId,
      stateId: addressModel.stateId,
      cityId: addressModel.cityId,
      pincode: addressModel.pincode,
      landmark: addressModel.landmark,
    })
    .from(addressModel)
    .where(eq(addressModel.publisherId, publisherId))
    .limit(1);
  return (
    row ?? {
      id: null,
      addressLine: null,
      countryId: null,
      stateId: null,
      cityId: null,
      pincode: null,
      landmark: null,
    }
  );
}

/** Creates or updates the publisher's address (one address row per publisher). */
export async function upsertPublisherAddress(
  publisherId: number,
  input: PublisherAddressInput,
): Promise<PublisherAddress> {
  const values = {
    addressLine: input.addressLine?.trim() || null,
    countryId: input.countryId ?? null,
    stateId: input.stateId ?? null,
    cityId: input.cityId ?? null,
    pincode: input.pincode?.trim() || null,
    landmark: input.landmark?.trim() || null,
  };
  const [existing] = await db
    .select({ id: addressModel.id })
    .from(addressModel)
    .where(eq(addressModel.publisherId, publisherId))
    .limit(1);
  if (existing) {
    await db
      .update(addressModel)
      .set(values)
      .where(eq(addressModel.id, existing.id));
  } else {
    await db.insert(addressModel).values({ ...values, publisherId });
  }
  return getPublisherAddress(publisherId);
}
