import type { NewAcademicSessionDraft } from "./types";
import { DRAFT_STORAGE_KEY } from "./types";

function mapOldWizardStep(s: number): 1 | 2 | 3 {
  if (s <= 3) return 1;
  if (s === 4) return 2;
  return 3;
}

function migrateV1ToV2(raw: Record<string, unknown>): NewAcademicSessionDraft | null {
  if (raw.version !== 1) return null;
  const oldStep = typeof raw.step === "number" ? raw.step : 1;
  const oldFurthest = typeof raw.furthestStep === "number" ? raw.furthestStep : oldStep;
  const step = mapOldWizardStep(oldStep);
  const furthestStep = Math.max(mapOldWizardStep(oldFurthest), step) as 1 | 2 | 3;
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    step,
    furthestStep,
    academicYearId: raw.academicYearId as number | null | undefined,
    academicYearLabel: raw.academicYearLabel as string | undefined,
    isCurrentYear: raw.isCurrentYear as boolean | undefined,
    promotionDraft: raw.promotionDraft as NewAcademicSessionDraft["promotionDraft"],
    promotionReviewAcknowledged: raw.promotionReviewAcknowledged as boolean | undefined,
  };
}

export function loadDraft(): NewAcademicSessionDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown> & { version?: number };
    if (parsed.version === 1) {
      return migrateV1ToV2(parsed);
    }
    if (parsed.version !== 2) return null;
    const d = parsed as unknown as NewAcademicSessionDraft;
    if (d.step < 1 || d.step > 3) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveDraft(draft: NewAcademicSessionDraft): void {
  try {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore quota */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Default step 2 = Promotion (per product request). */
export function defaultDraft(step: NewAcademicSessionDraft["step"] = 2): NewAcademicSessionDraft {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    step,
    furthestStep: step,
  };
}
