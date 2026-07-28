import { db } from "@/db/index.js";
import {
  declartionMasterModel,
  declartionMasterStatementModel,
  declartionMasterStatementFieldModel,
  declartionMasterStatementFieldOptionModel,
} from "@repo/db/schemas";
import type {
  DeclarationMasterDto,
  DeclarationMasterStatementDto,
} from "@repo/db/dtos/academics";
import { and, asc, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import { resolveTemplatesDir } from "@/features/notifications-console/services/notifications-console.service.js";

/**
 * Declaration masters are the admin-authored templates behind the student
 * declaration dialogs (e.g. the fee-due reminder). Shape:
 *
 *   declaration_masters                (one per context, `template` = EJS file)
 *     └── declaration_master_statements       (the checkboxes)
 *           └── declaration_master_statement_fields   (extra inputs)
 *                 └── ..._field_options               (choices for SELECT)
 *
 * Children always travel with their parent, so the read helpers below return
 * the fully nested DTO rather than making the caller stitch it together.
 */

export type DeclarationMasterRow = typeof declartionMasterModel.$inferSelect;
export type DeclarationMasterStatementRow =
  typeof declartionMasterStatementModel.$inferSelect;
export type DeclarationMasterStatementFieldRow =
  typeof declartionMasterStatementFieldModel.$inferSelect;
export type DeclarationMasterStatementFieldOptionRow =
  typeof declartionMasterStatementFieldOptionModel.$inferSelect;

/* --------------------------------- reads --------------------------------- */

/**
 * Loads the statements (+ fields + options) of a master in display order.
 * `activeOnly` is what the student-facing endpoints use so drafts/retired rows
 * never reach a student.
 */
async function loadStatements(
  declarationMasterId: number,
  activeOnly: boolean,
): Promise<DeclarationMasterStatementDto[]> {
  const statements = await db
    .select()
    .from(declartionMasterStatementModel)
    .where(
      and(
        eq(
          declartionMasterStatementModel.declarationMasterId,
          declarationMasterId,
        ),
        ...(activeOnly
          ? [eq(declartionMasterStatementModel.isActive, true)]
          : []),
      ),
    )
    .orderBy(
      asc(declartionMasterStatementModel.sequence),
      asc(declartionMasterStatementModel.id),
    );

  if (!statements.length) return [];

  const statementIds = statements.map((s) => s.id);

  const fields = await db
    .select()
    .from(declartionMasterStatementFieldModel)
    .where(
      activeOnly
        ? eq(declartionMasterStatementFieldModel.isActive, true)
        : undefined,
    )
    .orderBy(
      asc(declartionMasterStatementFieldModel.sequence),
      asc(declartionMasterStatementFieldModel.id),
    );

  const relevantFields = fields.filter((f) =>
    statementIds.includes(f.declarationMasterStatementId),
  );

  const options = relevantFields.length
    ? await db
        .select()
        .from(declartionMasterStatementFieldOptionModel)
        .where(
          activeOnly
            ? eq(declartionMasterStatementFieldOptionModel.isActive, true)
            : undefined,
        )
        .orderBy(
          asc(declartionMasterStatementFieldOptionModel.sequence),
          asc(declartionMasterStatementFieldOptionModel.id),
        )
    : [];

  return statements.map((statement) => ({
    ...statement,
    fields: relevantFields
      .filter((f) => f.declarationMasterStatementId === statement.id)
      .map((field) => ({
        ...field,
        options: options.filter(
          (o) => o.declarationMasterStatementFieldId === field.id,
        ),
      })),
  })) as DeclarationMasterStatementDto[];
}

export async function findAllDeclarationMasters(): Promise<
  DeclarationMasterDto[]
> {
  const masters = await db
    .select()
    .from(declartionMasterModel)
    .orderBy(asc(declartionMasterModel.id));

  return Promise.all(
    masters.map(async (master) => ({
      ...master,
      statements: await loadStatements(master.id, false),
    })),
  ) as Promise<DeclarationMasterDto[]>;
}

export async function findDeclarationMasterById(
  id: number,
  activeOnly = false,
): Promise<DeclarationMasterDto | null> {
  const [master] = await db
    .select()
    .from(declartionMasterModel)
    .where(eq(declartionMasterModel.id, id))
    .limit(1);

  if (!master) return null;

  return {
    ...master,
    statements: await loadStatements(master.id, activeOnly),
  } as DeclarationMasterDto;
}

/**
 * The student-facing lookup: the ACTIVE master for a context (FEES, EXAM, ...)
 * with only its active statements/fields/options.
 */
export async function findDeclarationMasterByContext(
  context: DeclarationMasterRow["context"],
): Promise<DeclarationMasterDto | null> {
  const [master] = await db
    .select()
    .from(declartionMasterModel)
    .where(
      and(
        eq(declartionMasterModel.context, context),
        eq(declartionMasterModel.isActive, true),
      ),
    )
    .orderBy(asc(declartionMasterModel.id))
    .limit(1);

  if (!master) return null;

  return {
    ...master,
    statements: await loadStatements(master.id, true),
  } as DeclarationMasterDto;
}

/* -------------------------------- preview -------------------------------- */

export type DeclarationMasterPreview =
  | { kind: "EMAIL"; html: string; templateKey: string | null }
  | { kind: "NONE"; templateKey: string | null; error?: string };

/**
 * Absolute URL of the declaration illustration, served by THIS app out of
 * `public/images` (app.ts mounts `public/` at `/`).
 *
 * It is deliberately not the student-console copy of the same PNG: outside
 * development that app sits behind a `/student-console` basePath, so a URL
 * derived from its origin 404s — and an email image cannot be relative.
 */
export function declarationIllustrationUrl(): string {
  const base = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");
  return base ? `${base}/images/fee-due-illustration.png` : "";
}

/**
 * Renders the master's own EJS template with SAMPLE data built from its real
 * statements/fields — unlike the generic notifications-console preview, which
 * feeds every placeholder in as the literal string "{{name}}" and so can never
 * show what the admin actually authored.
 *
 * Deterministic on purpose: the sample date is a fixed string, so opening the
 * preview twice produces byte-identical html.
 */
export async function previewDeclarationMaster(
  id: number,
): Promise<DeclarationMasterPreview | null> {
  const master = await findDeclarationMasterById(id, true);
  if (!master) return null;

  return renderDeclarationPreview({
    name: master.name ?? "",
    template: master.template ?? null,
    statements: (master.statements ?? []).map((statement) => ({
      statement: statement.statement,
      fields: (statement.fields ?? []).map((field) => ({
        label: field.label,
        firstOption: field.options?.[0]?.name ?? null,
      })),
    })),
  });
}

/** Unsaved master tree posted by the console's live preview. */
export interface DeclarationMasterPreviewDraft {
  name?: string | null;
  template?: string | null;
  statements?: Array<{
    statement?: string | null;
    isActive?: boolean | null;
    sequence?: number | null;
    fields?: Array<{
      label?: string | null;
      isActive?: boolean | null;
      sequence?: number | null;
      options?: Array<{
        name?: string | null;
        isActive?: boolean | null;
        sequence?: number | null;
      }> | null;
    }> | null;
  }> | null;
}

const bySequence = (
  a: { sequence?: number | null },
  b: { sequence?: number | null },
) =>
  (a.sequence ?? Number.MAX_SAFE_INTEGER) -
  (b.sequence ?? Number.MAX_SAFE_INTEGER);

/**
 * Same render as {@link previewDeclarationMaster}, but driven by an unsaved
 * draft so the console can show the email updating as the admin types —
 * nothing is read from or written to the database.
 *
 * Mirrors what students will actually see: inactive statements/fields are
 * dropped and the rest ordered by `sequence`, exactly as the read path does.
 */
export async function previewDeclarationMasterDraft(
  draft: DeclarationMasterPreviewDraft,
): Promise<DeclarationMasterPreview> {
  const statements = (draft.statements ?? [])
    .filter((s) => s.isActive !== false)
    .slice()
    .sort(bySequence)
    .map((s) => ({
      statement: (s.statement ?? "").trim(),
      fields: (s.fields ?? [])
        .filter((f) => f.isActive !== false)
        .slice()
        .sort(bySequence)
        .map((f) => ({
          label: (f.label ?? "").trim(),
          firstOption:
            (f.options ?? [])
              .filter((o) => o.isActive !== false)
              .sort(bySequence)[0]?.name ?? null,
        }))
        // A field with no label yet is noise while typing, not content.
        .filter((f) => f.label.length > 0),
    }))
    .filter((s) => s.statement.length > 0);

  return renderDeclarationPreview({
    name: draft.name ?? "",
    template: draft.template ?? null,
    statements,
  });
}

/** Shared by the saved-master and draft previews so both render identically. */
async function renderDeclarationPreview(input: {
  name: string;
  template: string | null;
  statements: Array<{
    statement: string;
    fields: Array<{ label: string; firstOption: string | null }>;
  }>;
}): Promise<DeclarationMasterPreview> {
  const templateKey = input.template?.trim() || null;
  const templatesDir = resolveTemplatesDir();
  const file =
    templateKey && templatesDir
      ? path.join(templatesDir, "email", `${templateKey}.ejs`)
      : null;

  if (!file || !fs.existsSync(file)) {
    return { kind: "NONE", templateKey };
  }

  const studentConsoleUrl = (
    process.env.VITE_APP_STUDENT_CONSOLE_URL ?? ""
  ).trim();

  const sample = {
    subject: input.name,
    // Flags the render as a console preview so the template can say so up
    // front: uid/semester/declaredOn below are stand-ins, filled in per
    // student on the real send path (notifyDeclaration), which never sets
    // this — so student emails carry no banner.
    isPreview: true,
    name: "Sample Student",
    uid: "BESC/2025/001",
    semester: "Semester II",
    declaredOn: "01 January 2025, 10:30 AM",
    studentConsoleUrl,
    illustrationUrl: declarationIllustrationUrl(),
    statements: input.statements.map((statement) => ({
      statement: statement.statement,
      fields: statement.fields.map((field) => ({
        label: field.label,
        // Placeholder values — a SELECT shows its first option so the preview
        // reads like a filled-in declaration.
        value: field.firstOption ?? "—",
      })),
    })),
  };

  const content = {
    ...sample,
    templateData: sample,
    dtoTemplateData: sample,
    subject: input.name,
  };

  try {
    const html = await ejs.renderFile(
      file,
      {
        notif: { variant: "EMAIL" },
        user: { name: sample.name, email: "student@example.com" },
        content,
      },
      { async: true },
    );
    return { kind: "EMAIL", html, templateKey };
  } catch (error) {
    // Surfaced (not swallowed) — the console shows it so template bugs are
    // debuggable instead of silently degrading to "no preview".
    return {
      kind: "NONE",
      templateKey,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* --------------------------------- writes -------------------------------- */

export async function createDeclarationMaster(
  data: typeof declartionMasterModel.$inferInsert,
): Promise<DeclarationMasterRow | null> {
  const [created] = await db
    .insert(declartionMasterModel)
    .values(data)
    .returning();
  return created ?? null;
}

export async function updateDeclarationMaster(
  id: number,
  data: Partial<typeof declartionMasterModel.$inferInsert>,
): Promise<DeclarationMasterRow | null> {
  const [updated] = await db
    .update(declartionMasterModel)
    .set(data)
    .where(eq(declartionMasterModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDeclarationMaster(id: number): Promise<boolean> {
  const deleted = await db
    .delete(declartionMasterModel)
    .where(eq(declartionMasterModel.id, id))
    .returning({ id: declartionMasterModel.id });
  return deleted.length > 0;
}

/* ------------------------------- statements ------------------------------ */

export async function findStatementsByMasterId(
  declarationMasterId: number,
): Promise<DeclarationMasterStatementRow[]> {
  return db
    .select()
    .from(declartionMasterStatementModel)
    .where(
      eq(
        declartionMasterStatementModel.declarationMasterId,
        declarationMasterId,
      ),
    )
    .orderBy(
      asc(declartionMasterStatementModel.sequence),
      asc(declartionMasterStatementModel.id),
    );
}

export async function createStatement(
  data: typeof declartionMasterStatementModel.$inferInsert,
): Promise<DeclarationMasterStatementRow | null> {
  const [created] = await db
    .insert(declartionMasterStatementModel)
    .values(data)
    .returning();
  return created ?? null;
}

export async function updateStatement(
  id: number,
  data: Partial<typeof declartionMasterStatementModel.$inferInsert>,
): Promise<DeclarationMasterStatementRow | null> {
  const [updated] = await db
    .update(declartionMasterStatementModel)
    .set(data)
    .where(eq(declartionMasterStatementModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteStatement(id: number): Promise<boolean> {
  const deleted = await db
    .delete(declartionMasterStatementModel)
    .where(eq(declartionMasterStatementModel.id, id))
    .returning({ id: declartionMasterStatementModel.id });
  return deleted.length > 0;
}

/* --------------------------------- fields -------------------------------- */

export async function findFieldsByStatementId(
  declarationMasterStatementId: number,
): Promise<DeclarationMasterStatementFieldRow[]> {
  return db
    .select()
    .from(declartionMasterStatementFieldModel)
    .where(
      eq(
        declartionMasterStatementFieldModel.declarationMasterStatementId,
        declarationMasterStatementId,
      ),
    )
    .orderBy(
      asc(declartionMasterStatementFieldModel.sequence),
      asc(declartionMasterStatementFieldModel.id),
    );
}

export async function createField(
  data: typeof declartionMasterStatementFieldModel.$inferInsert,
): Promise<DeclarationMasterStatementFieldRow | null> {
  const [created] = await db
    .insert(declartionMasterStatementFieldModel)
    .values(data)
    .returning();
  return created ?? null;
}

export async function updateField(
  id: number,
  data: Partial<typeof declartionMasterStatementFieldModel.$inferInsert>,
): Promise<DeclarationMasterStatementFieldRow | null> {
  const [updated] = await db
    .update(declartionMasterStatementFieldModel)
    .set(data)
    .where(eq(declartionMasterStatementFieldModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteField(id: number): Promise<boolean> {
  const deleted = await db
    .delete(declartionMasterStatementFieldModel)
    .where(eq(declartionMasterStatementFieldModel.id, id))
    .returning({ id: declartionMasterStatementFieldModel.id });
  return deleted.length > 0;
}

/* -------------------------------- options -------------------------------- */

export async function findOptionsByFieldId(
  declarationMasterStatementFieldId: number,
): Promise<DeclarationMasterStatementFieldOptionRow[]> {
  return db
    .select()
    .from(declartionMasterStatementFieldOptionModel)
    .where(
      eq(
        declartionMasterStatementFieldOptionModel.declarationMasterStatementFieldId,
        declarationMasterStatementFieldId,
      ),
    )
    .orderBy(
      asc(declartionMasterStatementFieldOptionModel.sequence),
      asc(declartionMasterStatementFieldOptionModel.id),
    );
}

export async function createOption(
  data: typeof declartionMasterStatementFieldOptionModel.$inferInsert,
): Promise<DeclarationMasterStatementFieldOptionRow | null> {
  const [created] = await db
    .insert(declartionMasterStatementFieldOptionModel)
    .values(data)
    .returning();
  return created ?? null;
}

export async function updateOption(
  id: number,
  data: Partial<typeof declartionMasterStatementFieldOptionModel.$inferInsert>,
): Promise<DeclarationMasterStatementFieldOptionRow | null> {
  const [updated] = await db
    .update(declartionMasterStatementFieldOptionModel)
    .set(data)
    .where(eq(declartionMasterStatementFieldOptionModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteOption(id: number): Promise<boolean> {
  const deleted = await db
    .delete(declartionMasterStatementFieldOptionModel)
    .where(eq(declartionMasterStatementFieldOptionModel.id, id))
    .returning({ id: declartionMasterStatementFieldOptionModel.id });
  return deleted.length > 0;
}
