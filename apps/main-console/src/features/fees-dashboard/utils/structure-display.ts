import type { FeeStructureDto } from "@repo/db/dtos/fees";

type ComponentWithSlab = FeeStructureDto["components"][number] & {
  feeSlab?: { name?: string } | null;
  feeSlabId?: number;
};

export type StructureSlabAmount = {
  slabKey: string;
  slabLabel: string;
  /** Sum of component amounts for this fee slab within the structure */
  amount: number;
};

/** Group components by fee slab; amount = sum per slab (not sum of all heads flat). */
export function getStructureSlabAmounts(structure: FeeStructureDto): StructureSlabAmount[] {
  const components = (structure.components || []) as ComponentWithSlab[];
  const bySlab = new Map<string, StructureSlabAmount>();

  for (const c of components) {
    const slabId = c.feeSlabId;
    const slabKey = slabId != null ? `id:${slabId}` : `name:${c.feeSlab?.name ?? "unknown"}`;
    const slabLabel = c.feeSlab?.name?.trim() || (slabId != null ? `Slab #${slabId}` : "—");
    const existing = bySlab.get(slabKey);
    const amount = Number(c.amount ?? 0);
    if (existing) {
      existing.amount += amount;
    } else {
      bySlab.set(slabKey, { slabKey, slabLabel, amount });
    }
  }

  return [...bySlab.values()].sort((a, b) => a.slabLabel.localeCompare(b.slabLabel));
}

export type StructureTableRow = {
  structure: FeeStructureDto;
  slab: StructureSlabAmount | null;
};

/** One table row per structure × fee slab (amount is slab total only). */
export function flattenStructuresBySlab(structures: FeeStructureDto[]): StructureTableRow[] {
  const rows: StructureTableRow[] = [];
  for (const structure of structures) {
    const slabs = getStructureSlabAmounts(structure);
    if (slabs.length === 0) {
      rows.push({ structure, slab: null });
      continue;
    }
    for (const slab of slabs) {
      rows.push({ structure, slab });
    }
  }
  return rows;
}
