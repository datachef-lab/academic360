import { db } from "@/db/index.js";
import {
  getBootMigrationMarker,
  setBootMigrationMarker,
} from "@/db/boot-migration-markers.js";
import {
  declartionMasterModel,
  declartionMasterStatementModel,
  notificationMasterModel,
} from "@repo/db/schemas";
import { and, eq } from "drizzle-orm";

/**
 * Seeds the FEES declaration used by the student-console fee-due dialog, plus
 * its email notification master.
 *
 * Runs EXACTLY ONCE per database, guarded by a boot marker — deliberately NOT
 * "insert if missing on every boot". Once an admin owns these rows they may
 * legitimately edit the statements, deactivate the master, or delete it
 * entirely; re-seeding would silently resurrect content they removed. The
 * marker means the seed is a one-time bootstrap, never a background writer.
 *
 * The template slug is also the EJS file name
 * (apps/notification-system/src/templates/email/<slug>.ejs), which is how one
 * declaration master maps to exactly one confirmation email.
 */
const SEED_MARKER = "declaration-masters-seed-v1";
const FEE_DUE_TEMPLATE = "fee-due-declaration";

const FEE_DUE_STATEMENTS = [
  {
    statement:
      "I acknowledge that my Semester enrolment fee is currently pending.",
    isRequired: true,
    sequence: 1,
  },
  {
    statement: "I confirm I will clear this amount at the earliest.",
    isRequired: true,
    sequence: 2,
  },
];

export async function seedDeclarationMasters(opts?: {
  force?: boolean;
}): Promise<{
  skipped?: true;
  notificationMaster?: "created" | "exists";
  declarationMaster?: "created" | "exists";
  statementsInserted?: number;
}> {
  // Already bootstrapped on this DB → never touch admin-owned rows again.
  if (!opts?.force) {
    const marker = await getBootMigrationMarker(SEED_MARKER);
    if (marker) return { skipped: true };
  }

  // 1) Notification master — must share the template key with the declaration
  //    master so notifyDeclaration() can find it.
  const [existingNotification] = await db
    .select({ id: notificationMasterModel.id })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.template, FEE_DUE_TEMPLATE))
    .limit(1);

  if (!existingNotification) {
    await db.insert(notificationMasterModel).values({
      name: "Fee Due Declaration",
      variant: "EMAIL",
      template: FEE_DUE_TEMPLATE,
      isActive: true,
      // Code-triggered: the console may toggle isActive but not rename it.
      isSystemTriggered: true,
    });
  }

  // 2) Declaration master
  const [existingMaster] = await db
    .select({ id: declartionMasterModel.id })
    .from(declartionMasterModel)
    .where(eq(declartionMasterModel.template, FEE_DUE_TEMPLATE))
    .limit(1);

  let masterId = existingMaster?.id;
  if (!masterId) {
    const [created] = await db
      .insert(declartionMasterModel)
      .values({
        name: "Fee Due Declaration",
        context: "FEES",
        template: FEE_DUE_TEMPLATE,
        isActive: true,
      })
      .returning({ id: declartionMasterModel.id });
    masterId = created.id;
  }

  // 3) Statements — only inserted when the master has none, so admin edits in
  //    the console are never overwritten on a later boot.
  const existingStatements = await db
    .select({ id: declartionMasterStatementModel.id })
    .from(declartionMasterStatementModel)
    .where(
      and(eq(declartionMasterStatementModel.declarationMasterId, masterId)),
    );

  let statementsInserted = 0;
  if (existingStatements.length === 0) {
    await db.insert(declartionMasterStatementModel).values(
      FEE_DUE_STATEMENTS.map((s) => ({
        declarationMasterId: masterId as number,
        statement: s.statement,
        isRequired: s.isRequired,
        sequence: s.sequence,
        isActive: true,
      })),
    );
    statementsInserted = FEE_DUE_STATEMENTS.length;
  }

  const result = {
    notificationMaster: (existingNotification ? "exists" : "created") as
      | "created"
      | "exists",
    declarationMaster: (existingMaster ? "exists" : "created") as
      | "created"
      | "exists",
    statementsInserted,
  };

  await setBootMigrationMarker(SEED_MARKER, result);
  return result;
}
