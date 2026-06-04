/** Institutional email domain for derived student login emails. */
export const STUDENT_INSTITUTIONAL_EMAIL_DOMAIN = "thebges.edu.in";

export type ExamDisplayIdentityInput = {
  currentUid: string;
  previousUid?: string | null;
  currentEmail?: string | null;
  promotionStartDate?: Date | string | null;
  promotionEndDate?: Date | string | null;
  promotionIsDeprecated?: boolean | null;
  examCommencementDate?: Date | string | null;
};

export type ExamDisplayIdentity = {
  uid: string;
  email: string | null;
  usedPreviousUid: boolean;
};

function parseExamIdentityDate(
  value: Date | string | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Calendar date `YYYY-MM-DD` for SQL date comparisons (avoids timezone drift). */
export function examCommencementDateOnly(
  examCommencementDate: Date | string | null | undefined,
): string | null {
  const d = parseExamIdentityDate(examCommencementDate);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/** Same window used when picking promotions for an exam group. */
export function promotionCoversExamCommencement(
  promotionStartDate: Date | string | null | undefined,
  promotionEndDate: Date | string | null | undefined,
  examCommencementDate: Date | string | null | undefined,
): boolean {
  const commencement = examCommencementDateOnly(examCommencementDate);
  if (!commencement) return true;

  const start = examCommencementDateOnly(promotionStartDate);
  const end = examCommencementDateOnly(promotionEndDate);

  if (start && start > commencement) return false;
  if (end && end < commencement) return false;
  return true;
}

export function isHistoricalPromotionRow(
  promotionEndDate: Date | string | null | undefined,
  promotionIsDeprecated?: boolean | null,
): boolean {
  if (promotionIsDeprecated === true) return true;
  return parseExamIdentityDate(promotionEndDate) != null;
}

/**
 * After shift change, exam_candidates keep the closed promotion id; student.uid becomes the new value.
 * For reports/PDFs tied to that promotion + exam commencement, show previousUid (not persisted on user email).
 */
export function shouldUsePreviousUidForExamContext(
  input: ExamDisplayIdentityInput,
): boolean {
  const previousUid = input.previousUid?.trim();
  if (!previousUid) return false;

  if (
    !isHistoricalPromotionRow(
      input.promotionEndDate,
      input.promotionIsDeprecated,
    )
  ) {
    return false;
  }

  return promotionCoversExamCommencement(
    input.promotionStartDate,
    input.promotionEndDate,
    input.examCommencementDate,
  );
}

export function institutionalEmailFromUid(uid: string): string {
  return `${uid.trim().toLowerCase()}@${STUDENT_INSTITUTIONAL_EMAIL_DOMAIN}`;
}

export function resolveExamDisplayIdentity(
  input: ExamDisplayIdentityInput,
): ExamDisplayIdentity {
  const currentUid = input.currentUid?.trim() ?? "";
  if (shouldUsePreviousUidForExamContext(input)) {
    const uid = input.previousUid!.trim();
    return {
      uid,
      email: institutionalEmailFromUid(uid),
      usedPreviousUid: true,
    };
  }

  const email =
    input.currentEmail?.trim() ||
    (currentUid ? institutionalEmailFromUid(currentUid) : null);

  return {
    uid: currentUid,
    email,
    usedPreviousUid: false,
  };
}

/** Apply exam-context UID/email onto a query row (mutates uid + optional email fields). */
export function applyExamDisplayIdentityToRow<
  T extends {
    uid?: string | null;
    email?: string | null;
    userEmail?: string | null;
    previousUid?: string | null;
    promotionStartDate?: Date | string | null;
    promotionEndDate?: Date | string | null;
    promotionIsDeprecated?: boolean | null;
    examCommencementDate?: Date | string | null;
  },
>(row: T): T {
  const currentUid = row.uid?.trim();
  if (!currentUid) return row;

  const identity = resolveExamDisplayIdentity({
    currentUid,
    previousUid: row.previousUid,
    currentEmail: row.email ?? row.userEmail,
    promotionStartDate: row.promotionStartDate,
    promotionEndDate: row.promotionEndDate,
    promotionIsDeprecated: row.promotionIsDeprecated,
    examCommencementDate: row.examCommencementDate,
  });

  const next = { ...row, uid: identity.uid };
  if ("email" in row) next.email = identity.email;
  if ("userEmail" in row) next.userEmail = identity.email;
  return next;
}

export function applyExamDisplayIdentityToRows<
  T extends Parameters<typeof applyExamDisplayIdentityToRow>[0],
>(rows: T[]): T[] {
  return rows.map((row) => applyExamDisplayIdentityToRow(row));
}
