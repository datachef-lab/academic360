import { db } from "@/db/index.js";
import { enqueueNotification } from "@/services/notificationClient.js";
import {
  classModel,
  declartionMasterModel,
  declartionMasterStatementFieldModel,
  declartionMasterStatementFieldOptionModel,
  declartionMasterStatementModel,
  declartionModel,
  declartionStatementFieldModel,
  declartionStatementModel,
  notificationMasterModel,
  promotionModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  declarationIllustrationUrl,
  findDeclarationMasterByContext,
} from "./declaration-master.service.js";

type DeclarationContext =
  (typeof declartionMasterModel.$inferSelect)["context"];

export interface SubmitDeclarationFieldInput {
  declarationMasterStatementFieldId: number;
  declarationMasterStatementFieldOptionId?: number | null;
  value?: string;
}

export interface SubmitDeclarationStatementInput {
  declarationMasterStatementId: number;
  isAgreed: boolean;
  fields?: SubmitDeclarationFieldInput[];
}

export interface SubmitDeclarationInput {
  promotionId: number;
  declarationMasterId: number;
  statements: SubmitDeclarationStatementInput[];
}

/** Thrown when a required statement was not agreed to. */
export class DeclarationValidationError extends Error {}

/**
 * The student's declaration for a promotion (exam cycle), if it exists.
 * The student-console uses this to decide whether to show the dialog at all —
 * it replaces the old localStorage flag, so the "already declared" state is
 * device-independent and resets naturally when the student is promoted.
 */
export async function findDeclarationByPromotion(
  promotionId: number,
  declarationMasterId: number,
) {
  const [declaration] = await db
    .select()
    .from(declartionModel)
    .where(
      and(
        eq(declartionModel.promotionId, promotionId),
        eq(declartionModel.declarationMasterId, declarationMasterId),
      ),
    )
    .limit(1);

  if (!declaration) return null;

  const statements = await db
    .select()
    .from(declartionStatementModel)
    .where(eq(declartionStatementModel.declarationId, declaration.id))
    .orderBy(asc(declartionStatementModel.id));

  return { ...declaration, statements };
}

/** Same as above but resolves the master from a context (e.g. "FEES"). */
export async function findDeclarationByPromotionAndContext(
  promotionId: number,
  context: DeclarationContext,
) {
  const master = await findDeclarationMasterByContext(context);
  if (!master?.id) return { master: null, declaration: null };

  const declaration = await findDeclarationByPromotion(promotionId, master.id);
  return { master, declaration };
}

/**
 * Records a student's declaration.
 *
 * Idempotent per (master, promotion) — the DB has a unique constraint, and a
 * repeat call returns the existing row instead of erroring, so the CU-form
 * page (which re-shows the dialog on every submit attempt) never creates
 * duplicates and never sends a second email.
 */
export async function submitDeclaration(input: SubmitDeclarationInput) {
  const { promotionId, declarationMasterId, statements } = input;

  const [master] = await db
    .select()
    .from(declartionMasterModel)
    .where(eq(declartionMasterModel.id, declarationMasterId))
    .limit(1);
  if (!master) {
    throw new DeclarationValidationError("Declaration master not found");
  }

  // Every REQUIRED + active statement of this master must be agreed to.
  const masterStatements = await db
    .select()
    .from(declartionMasterStatementModel)
    .where(
      and(
        eq(
          declartionMasterStatementModel.declarationMasterId,
          declarationMasterId,
        ),
        eq(declartionMasterStatementModel.isActive, true),
      ),
    );

  const agreedIds = new Set(
    statements
      .filter((s) => s.isAgreed)
      .map((s) => s.declarationMasterStatementId),
  );
  const missing = masterStatements.filter(
    (ms) => ms.isRequired && !agreedIds.has(ms.id),
  );
  if (missing.length > 0) {
    throw new DeclarationValidationError(
      "All required declarations must be agreed to before proceeding.",
    );
  }

  const existing = await findDeclarationByPromotion(
    promotionId,
    declarationMasterId,
  );
  if (existing) return { declaration: existing, created: false };

  const declaration = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(declartionModel)
      .values({ declarationMasterId, promotionId })
      .returning();

    for (const statement of statements) {
      const [createdStatement] = await tx
        .insert(declartionStatementModel)
        .values({
          declarationId: created.id,
          declarationMasterStatementId: statement.declarationMasterStatementId,
          isAgreed: statement.isAgreed,
        })
        .returning();

      for (const field of statement.fields ?? []) {
        await tx.insert(declartionStatementFieldModel).values({
          declarationStatementId: createdStatement.id,
          declarationMasterStatementFieldId:
            field.declarationMasterStatementFieldId,
          declarationMasterStatementFieldOptionId:
            field.declarationMasterStatementFieldOptionId ?? null,
          value: field.value ?? "",
        });
      }
    }

    return created;
  });

  // Best-effort confirmation email — never block or fail the submission.
  try {
    await notifyDeclaration(declaration.id);
  } catch (error) {
    console.error("[declaration] notify failed (non-fatal):", error);
  }

  return {
    declaration: await findDeclarationByPromotion(
      promotionId,
      declarationMasterId,
    ),
    created: true,
  };
}

/**
 * Sends the declaration confirmation email.
 *
 * The declaration master's `template` IS the EJS file name, and the matching
 * notification master is looked up by the same key — so one master means one
 * template means exactly one email per submission.
 */
export async function notifyDeclaration(declarationId: number) {
  const [row] = await db
    .select({
      declarationId: declartionModel.id,
      createdAt: declartionModel.createdAt,
      template: declartionMasterModel.template,
      context: declartionMasterModel.context,
      userId: userModel.id,
      name: userModel.name,
      uid: studentModel.uid,
      semester: classModel.name,
    })
    .from(declartionModel)
    .innerJoin(
      declartionMasterModel,
      eq(declartionMasterModel.id, declartionModel.declarationMasterId),
    )
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, declartionModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .where(eq(declartionModel.id, declarationId))
    .limit(1);

  if (!row?.template) return;

  const [emailMaster] = await db
    .select()
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.template, row.template))
    .limit(1);

  if (!emailMaster) {
    console.warn(
      `[declaration] no notification master for template "${row.template}" — email skipped`,
    );
    return;
  }

  // The statements the student actually agreed to, in display order.
  const agreed = await db
    .select({
      id: declartionStatementModel.id,
      statement: declartionMasterStatementModel.statement,
      isAgreed: declartionStatementModel.isAgreed,
      sequence: declartionMasterStatementModel.sequence,
    })
    .from(declartionStatementModel)
    .innerJoin(
      declartionMasterStatementModel,
      eq(
        declartionMasterStatementModel.id,
        declartionStatementModel.declarationMasterStatementId,
      ),
    )
    .where(eq(declartionStatementModel.declarationId, declarationId))
    .orderBy(asc(declartionMasterStatementModel.sequence));

  const agreedStatements = agreed.filter((s) => s.isAgreed);

  // The values the student typed/picked, labelled by their master field.
  // A SELECT field stores the chosen option, so prefer the option name and
  // fall back to the free-text value.
  const statementIds = agreedStatements.map((s) => s.id);
  const fieldRows = statementIds.length
    ? await db
        .select({
          declarationStatementId:
            declartionStatementFieldModel.declarationStatementId,
          label: declartionMasterStatementFieldModel.label,
          sequence: declartionMasterStatementFieldModel.sequence,
          value: declartionStatementFieldModel.value,
          optionName: declartionMasterStatementFieldOptionModel.name,
        })
        .from(declartionStatementFieldModel)
        .innerJoin(
          declartionMasterStatementFieldModel,
          eq(
            declartionMasterStatementFieldModel.id,
            declartionStatementFieldModel.declarationMasterStatementFieldId,
          ),
        )
        .leftJoin(
          declartionMasterStatementFieldOptionModel,
          eq(
            declartionMasterStatementFieldOptionModel.id,
            declartionStatementFieldModel.declarationMasterStatementFieldOptionId,
          ),
        )
        .where(
          inArray(
            declartionStatementFieldModel.declarationStatementId,
            statementIds,
          ),
        )
        .orderBy(asc(declartionMasterStatementFieldModel.sequence))
    : [];

  const emailStatements = agreedStatements.map((s) => ({
    statement: s.statement,
    fields: fieldRows
      .filter((f) => f.declarationStatementId === s.id)
      .map((f) => ({
        label: f.label ?? "",
        value: (f.optionName ?? "") || (f.value ?? ""),
      })),
  }));

  const studentConsoleUrl = (
    process.env.VITE_APP_STUDENT_CONSOLE_URL ?? ""
  ).trim();
  // Served by this app from public/images — deliberately NOT the student
  // console copy, whose URL carries a /student-console basePath outside dev.
  const illustrationUrl = declarationIllustrationUrl();

  const envPrefix =
    process.env.NODE_ENV === "development"
      ? "[DEV] "
      : process.env.NODE_ENV === "staging"
        ? "[STAGE] "
        : "";
  const subject = `${envPrefix}Declaration Confirmation`;

  enqueueNotification({
    userId: row.userId,
    adminStaffUserId: null,
    variant: "EMAIL" as const,
    type: "FEE" as const,
    message: "Declaration Confirmation",
    notificationMasterId: emailMaster.id,
    notificationEvent: {
      templateData: {
        subject,
        name: row.name ?? "",
        uid: row.uid ?? "",
        semester: row.semester ?? "",
        declaredOn: (row.createdAt ?? new Date()).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        statements: emailStatements,
        studentConsoleUrl,
        illustrationUrl,
      },
    },
  } as Parameters<typeof enqueueNotification>[0]);
}
