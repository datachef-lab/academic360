import { db } from "@/db/index.js";
import {
  declartionMasterModel,
  declartionMasterStatementModel,
  declartionMasterStatementFieldModel,
  declartionMasterStatementFieldOptionModel,
  declartionStatementModel,
  declartionStatementFieldModel,
} from "@repo/db/schemas";
import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import { resolveTemplatesDir } from "@/features/notifications-console/services/notifications-console.service.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("declaration-master");

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

/* --------------------------------- usage --------------------------------- */

/**
 * A master row that has already been declared against is HISTORY: the wording
 * (and its fields/options) is what past students agreed to, so it must not be
 * rewritten in place. `usageCount` is how many student submissions point at the
 * row — the console greys the row out, and {@link assertStatementEditable} &
 * friends below enforce the same rule server-side.
 */
export interface WithUsage {
  usageCount: number;
}

export type DeclarationMasterStatementFieldOptionWithUsage =
  DeclarationMasterStatementFieldOptionRow & WithUsage;

export type DeclarationMasterStatementFieldWithUsage =
  DeclarationMasterStatementFieldRow &
    WithUsage & {
      options: DeclarationMasterStatementFieldOptionWithUsage[];
    };

export type DeclarationMasterStatementWithUsage =
  DeclarationMasterStatementRow &
    WithUsage & {
      fields: DeclarationMasterStatementFieldWithUsage[];
    };

export type DeclarationMasterWithUsage = DeclarationMasterRow & {
  statements: DeclarationMasterStatementWithUsage[];
};

/** Grouped COUNT keyed by master-row id — one query per level, never per row. */
async function countByKey<T extends number>(
  rows: Array<{ key: T | null; count: number }>,
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  for (const row of rows) {
    if (row.key === null) continue;
    map.set(row.key, Number(row.count));
  }
  return map;
}

/** How many `declaration_statements` rows reference each master statement. */
async function statementUsage(ids: number[]): Promise<Map<number, number>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({
      key: declartionStatementModel.declarationMasterStatementId,
      count: sql<number>`count(*)::int`,
    })
    .from(declartionStatementModel)
    .where(inArray(declartionStatementModel.declarationMasterStatementId, ids))
    .groupBy(declartionStatementModel.declarationMasterStatementId);
  return countByKey(rows);
}

/** How many `declaration_statement_fields` answers reference each master field. */
async function fieldUsage(ids: number[]): Promise<Map<number, number>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({
      key: declartionStatementFieldModel.declarationMasterStatementFieldId,
      count: sql<number>`count(*)::int`,
    })
    .from(declartionStatementFieldModel)
    .where(
      inArray(
        declartionStatementFieldModel.declarationMasterStatementFieldId,
        ids,
      ),
    )
    .groupBy(declartionStatementFieldModel.declarationMasterStatementFieldId);
  return countByKey(rows);
}

/** How many answers picked each option (SELECT fields store the option id). */
async function optionUsage(ids: number[]): Promise<Map<number, number>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({
      key: declartionStatementFieldModel.declarationMasterStatementFieldOptionId,
      count: sql<number>`count(*)::int`,
    })
    .from(declartionStatementFieldModel)
    .where(
      and(
        isNotNull(
          declartionStatementFieldModel.declarationMasterStatementFieldOptionId,
        ),
        inArray(
          declartionStatementFieldModel.declarationMasterStatementFieldOptionId,
          ids,
        ),
      ),
    )
    .groupBy(
      declartionStatementFieldModel.declarationMasterStatementFieldOptionId,
    );
  return countByKey(rows);
}

export async function getStatementUsageCount(id: number): Promise<number> {
  return (await statementUsage([id])).get(id) ?? 0;
}

export async function getFieldUsageCount(id: number): Promise<number> {
  return (await fieldUsage([id])).get(id) ?? 0;
}

export async function getOptionUsageCount(id: number): Promise<number> {
  return (await optionUsage([id])).get(id) ?? 0;
}

/* --------------------------------- reads --------------------------------- */

/**
 * Loads the statements (+ fields + options) of a master in display order,
 * each row carrying its `usageCount` (0 when nothing references it).
 * `activeOnly` is what the student-facing endpoints use so drafts/retired rows
 * never reach a student.
 */
async function loadStatements(
  declarationMasterId: number,
  activeOnly: boolean,
): Promise<DeclarationMasterStatementWithUsage[]> {
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

  // Three grouped COUNTs for the whole tree — no per-row queries.
  const [statementCounts, fieldCounts, optionCounts] = await Promise.all([
    statementUsage(statementIds),
    fieldUsage(relevantFields.map((f) => f.id)),
    optionUsage(options.map((o) => o.id)),
  ]);

  return statements.map((statement) => ({
    ...statement,
    usageCount: statementCounts.get(statement.id) ?? 0,
    fields: relevantFields
      .filter((f) => f.declarationMasterStatementId === statement.id)
      .map((field) => ({
        ...field,
        usageCount: fieldCounts.get(field.id) ?? 0,
        options: options
          .filter((o) => o.declarationMasterStatementFieldId === field.id)
          .map((option) => ({
            ...option,
            usageCount: optionCounts.get(option.id) ?? 0,
          })),
      })),
  }));
}

export async function findAllDeclarationMasters(): Promise<
  DeclarationMasterWithUsage[]
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
  );
}

export async function findDeclarationMasterById(
  id: number,
  activeOnly = false,
): Promise<DeclarationMasterWithUsage | null> {
  const [master] = await db
    .select()
    .from(declartionMasterModel)
    .where(eq(declartionMasterModel.id, id))
    .limit(1);

  if (!master) return null;

  return {
    ...master,
    statements: await loadStatements(master.id, activeOnly),
  };
}

/**
 * The student-facing lookup: the ACTIVE master for a context (FEES, EXAM, ...)
 * with only its active statements/fields/options.
 */
export async function findDeclarationMasterByContext(
  context: DeclarationMasterRow["context"],
): Promise<DeclarationMasterWithUsage | null> {
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
  };
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
    if (!templateKey) return { kind: "NONE", templateKey };
    // Distinguish "no templates dir on this host" (the production Docker
    // failure mode) from "that template name doesn't exist" — a bare NONE
    // made this undiagnosable from the console.
    const error = !templatesDir
      ? "Notification EJS templates directory not found on the server. Set NOTIFICATION_TEMPLATES_DIR or rebuild the backend image so the templates are bundled."
      : `Template file not found: ${file}`;
    log.warn("declaration preview unavailable", {
      templateKey,
      templatesDir,
      cwd: process.cwd(),
      error,
    });
    return { kind: "NONE", templateKey, error };
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
    const message = error instanceof Error ? error.message : String(error);
    log.warn("declaration preview render failed", {
      templateKey,
      file,
      error: message,
    });
    return { kind: "NONE", templateKey, error: message };
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

/* ------------------------------- immutability ----------------------------- */

export type DeclarationUsageLevel = "STATEMENT" | "FIELD" | "OPTION";

/**
 * Raised when an admin tries to rewrite (or delete) a master row that students
 * have already declared against. Carries everything the console needs to
 * explain itself; the controller turns it into a 409 whose `httpStatus` and
 * `payload.code` are both `DECLARATION_IN_USE`.
 */
export class DeclarationInUseError extends Error {
  readonly code = "DECLARATION_IN_USE" as const;
  constructor(
    readonly level: DeclarationUsageLevel,
    readonly targetId: number,
    readonly usageCount: number,
    readonly action: "UPDATE" | "DELETE",
    /** Which submitted keys the request tried to change (empty for DELETE). */
    readonly blockedFields: string[],
    message: string,
  ) {
    super(message);
    this.name = "DeclarationInUseError";
  }
}

/**
 * True when `data` carries a key whose value actually DIFFERS from the row on
 * disk. The console saves the whole master tree on "Save master", so untouched
 * rows are re-sent verbatim — a no-op PUT must never 409.
 */
function changedKeys<T extends Record<string, unknown>>(
  current: T,
  data: Partial<T>,
  keys: Array<keyof T & string>,
): string[] {
  return keys.filter(
    (key) => data[key] !== undefined && data[key] !== current[key],
  );
}

const inUseMessage = (
  level: DeclarationUsageLevel,
  usageCount: number,
  action: "UPDATE" | "DELETE",
) => {
  const n = `${usageCount} student${usageCount === 1 ? "" : "s"}`;
  if (level === "STATEMENT") {
    return action === "UPDATE"
      ? `This statement has already been declared by ${n}. Deactivate it and add a new statement instead — editing it would change what those students agreed to.`
      : `This statement has already been declared by ${n}. Deleting it would erase their declarations — deactivate it and add a new statement instead.`;
  }
  if (level === "FIELD") {
    return action === "UPDATE"
      ? `This field has already been filled in by ${n}. Deactivate it and add a new field instead — editing it would change what those students submitted.`
      : `This field has already been filled in by ${n}. Deleting it would erase their answers — deactivate it and add a new field instead.`;
  }
  return action === "UPDATE"
    ? `This option has already been chosen by ${n}. Deactivate it and add a new option instead — renaming it would change what those students selected.`
    : `This option has already been chosen by ${n}. Deleting it would erase their answers — deactivate it and add a new option instead.`;
};

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

/**
 * MEANING of a declared statement is frozen: `statement` text and `isRequired`
 * cannot change once a student has agreed to it. `isActive` and `sequence`
 * stay editable — deactivating and reordering are the sanctioned escape hatch
 * and rewrite no history.
 */
export async function updateStatement(
  id: number,
  data: Partial<typeof declartionMasterStatementModel.$inferInsert>,
): Promise<DeclarationMasterStatementRow | null> {
  const [current] = await db
    .select()
    .from(declartionMasterStatementModel)
    .where(eq(declartionMasterStatementModel.id, id))
    .limit(1);
  if (!current) return null;

  const blocked = changedKeys(current, data, ["statement", "isRequired"]);
  if (blocked.length) {
    const usageCount = await getStatementUsageCount(id);
    if (usageCount > 0) {
      throw new DeclarationInUseError(
        "STATEMENT",
        id,
        usageCount,
        "UPDATE",
        blocked,
        inUseMessage("STATEMENT", usageCount, "UPDATE"),
      );
    }
  }

  const [updated] = await db
    .update(declartionMasterStatementModel)
    .set(data)
    .where(eq(declartionMasterStatementModel.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Blocked once declared: `declaration_statements.declaration_master_statement_id_fk`
 * is ON DELETE CASCADE, so removing the statement would silently delete the
 * student rows (and their `declaration_statement_fields` answers) with it.
 */
export async function deleteStatement(id: number): Promise<boolean> {
  const usageCount = await getStatementUsageCount(id);
  if (usageCount > 0) {
    throw new DeclarationInUseError(
      "STATEMENT",
      id,
      usageCount,
      "DELETE",
      [],
      inUseMessage("STATEMENT", usageCount, "DELETE"),
    );
  }

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

/** `label`/`type` are frozen once answered; `isActive`/`sequence` are not. */
export async function updateField(
  id: number,
  data: Partial<typeof declartionMasterStatementFieldModel.$inferInsert>,
): Promise<DeclarationMasterStatementFieldRow | null> {
  const [current] = await db
    .select()
    .from(declartionMasterStatementFieldModel)
    .where(eq(declartionMasterStatementFieldModel.id, id))
    .limit(1);
  if (!current) return null;

  const blocked = changedKeys(current, data, ["label", "type"]);
  if (blocked.length) {
    const usageCount = await getFieldUsageCount(id);
    if (usageCount > 0) {
      throw new DeclarationInUseError(
        "FIELD",
        id,
        usageCount,
        "UPDATE",
        blocked,
        inUseMessage("FIELD", usageCount, "UPDATE"),
      );
    }
  }

  const [updated] = await db
    .update(declartionMasterStatementFieldModel)
    .set(data)
    .where(eq(declartionMasterStatementFieldModel.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Blocked once answered: `decl_stmt_field_master_field_fk` is ON DELETE
 * CASCADE, so this would delete the students' submitted values.
 */
export async function deleteField(id: number): Promise<boolean> {
  const usageCount = await getFieldUsageCount(id);
  if (usageCount > 0) {
    throw new DeclarationInUseError(
      "FIELD",
      id,
      usageCount,
      "DELETE",
      [],
      inUseMessage("FIELD", usageCount, "DELETE"),
    );
  }

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

/** `name` is frozen once chosen; `isActive`/`sequence` are not. */
export async function updateOption(
  id: number,
  data: Partial<typeof declartionMasterStatementFieldOptionModel.$inferInsert>,
): Promise<DeclarationMasterStatementFieldOptionRow | null> {
  const [current] = await db
    .select()
    .from(declartionMasterStatementFieldOptionModel)
    .where(eq(declartionMasterStatementFieldOptionModel.id, id))
    .limit(1);
  if (!current) return null;

  const blocked = changedKeys(current, data, ["name"]);
  if (blocked.length) {
    const usageCount = await getOptionUsageCount(id);
    if (usageCount > 0) {
      throw new DeclarationInUseError(
        "OPTION",
        id,
        usageCount,
        "UPDATE",
        blocked,
        inUseMessage("OPTION", usageCount, "UPDATE"),
      );
    }
  }

  const [updated] = await db
    .update(declartionMasterStatementFieldOptionModel)
    .set(data)
    .where(eq(declartionMasterStatementFieldOptionModel.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Blocked once chosen: `decl_stmt_field_option_fk` is ON DELETE CASCADE, and
 * it cascades the WHOLE `declaration_statement_fields` row (not just the option
 * reference) — the student's answer would vanish, not merely lose its label.
 */
export async function deleteOption(id: number): Promise<boolean> {
  const usageCount = await getOptionUsageCount(id);
  if (usageCount > 0) {
    throw new DeclarationInUseError(
      "OPTION",
      id,
      usageCount,
      "DELETE",
      [],
      inUseMessage("OPTION", usageCount, "DELETE"),
    );
  }

  const deleted = await db
    .delete(declartionMasterStatementFieldOptionModel)
    .where(eq(declartionMasterStatementFieldOptionModel.id, id))
    .returning({ id: declartionMasterStatementFieldOptionModel.id });
  return deleted.length > 0;
}
