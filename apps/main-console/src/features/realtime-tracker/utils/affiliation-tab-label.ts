export type AffiliationForTabLabel = {
  id: number;
  name: string;
  shortName?: string | null;
};

export function affiliationDisplayCode(affiliation: AffiliationForTabLabel): string {
  const short = affiliation.shortName?.trim();
  if (short) return short;
  return affiliation.name.trim();
}

/** e.g. "CU Registration" when a single affiliation (selected or only one in list) has shortName CU. */
export function resolveAffiliationTabLabel(
  affiliationIds: number[] | undefined,
  affiliations: AffiliationForTabLabel[],
): string {
  const ids = affiliationIds ?? [];
  if (ids.length === 1) {
    const aff = affiliations.find((a) => a.id === ids[0]);
    if (aff) return `${affiliationDisplayCode(aff)} Registration`;
  }
  if (ids.length === 0 && affiliations.length === 1) {
    const sole = affiliations[0];
    if (sole) return `${affiliationDisplayCode(sole)} Registration`;
  }
  return "Affiliation Registration";
}
