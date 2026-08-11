import { db, pool } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { and, eq } from "drizzle-orm";
import {
  getBootMigrationMarker,
  setBootMigrationMarker,
} from "@/db/boot-migration-markers.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { libraryZoneModel } from "@repo/db/schemas/models/library/library-zone.model.js";

const log = createLogger("library-masters-seed");

const MARKER = "library-masters-seed-v1";
/**
 * Advisory lock for this seed.
 *
 * 918360001 boot-migration runner · 918360002 board-subject dedupe ·
 * 918360003 library IRP load · 918360004 = THIS seed.
 */
const LOCK_KEY = 918360004;

const DEFAULT_BRANCH = {
  name: "Main Library",
  code: "MAIN",
  remarks:
    "Seeded default branch. Rename or add branches under Library → Masters → Branches; existing books, copies and policies stay attached to this row.",
};

const PATRON_CATEGORIES = [
  { name: "Student", code: "STUDENT", description: "Enrolled students" },
  {
    name: "Staff",
    code: "STAFF",
    description: "Administrative and support staff",
  },
  { name: "Faculty", code: "FACULTY", description: "Teaching faculty" },
  {
    name: "Guest",
    code: "GUEST",
    description: "External / short-term patrons",
  },
];

const ITEM_CATEGORIES = [
  { name: "Textbook", code: "TEXTBOOK", description: "Course textbooks" },
  {
    name: "Reference",
    code: "REFERENCE",
    description: "Reference-only, not for loan",
  },
  { name: "Journal", code: "JOURNAL", description: "Periodicals and journals" },
  { name: "Fiction", code: "FICTION", description: "General fiction titles" },
  {
    name: "Non-Fiction",
    code: "NON_FICTION",
    description: "General non-fiction",
  },
  { name: "Rare", code: "RARE", description: "Rare and archival items" },
  {
    name: "Digital",
    code: "DIGITAL",
    description: "E-books and digital media",
  },
];

const ZONES = [
  { name: "Reading Hall", code: "READING_HALL", capacity: 60 },
  { name: "Reference Section", code: "REFERENCE_SECTION", capacity: 20 },
  { name: "Stack", code: "STACK", capacity: 40 },
];

/**
 * Circulation policy grid — safe, obvious defaults. Fine per day is 0 so a
 * fresh install cannot accidentally over-charge; staff must set a real fine
 * before it starts biting. All rows are `isActive = true` so lookups resolve;
 * Reference is loanDays = 0 to signal "not for loan" without needing a new
 * flag on the model.
 */
const POLICY_MATRIX: Array<{
  patronCode: string;
  itemCode: string;
  loanDays: number;
  renewalLimit: number;
  graceDays: number;
  finePerDay: number;
  maxCopiesAtOnce: number;
}> = [
  // Students
  {
    patronCode: "STUDENT",
    itemCode: "TEXTBOOK",
    loanDays: 14,
    renewalLimit: 2,
    graceDays: 3,
    finePerDay: 0,
    maxCopiesAtOnce: 3,
  },
  {
    patronCode: "STUDENT",
    itemCode: "REFERENCE",
    loanDays: 0,
    renewalLimit: 0,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 0,
  },
  {
    patronCode: "STUDENT",
    itemCode: "JOURNAL",
    loanDays: 3,
    renewalLimit: 1,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 2,
  },
  {
    patronCode: "STUDENT",
    itemCode: "FICTION",
    loanDays: 14,
    renewalLimit: 2,
    graceDays: 3,
    finePerDay: 0,
    maxCopiesAtOnce: 2,
  },
  {
    patronCode: "STUDENT",
    itemCode: "NON_FICTION",
    loanDays: 14,
    renewalLimit: 2,
    graceDays: 3,
    finePerDay: 0,
    maxCopiesAtOnce: 2,
  },
  {
    patronCode: "STUDENT",
    itemCode: "DIGITAL",
    loanDays: 21,
    renewalLimit: 2,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 5,
  },
  // Faculty — longer loans, more copies.
  {
    patronCode: "FACULTY",
    itemCode: "TEXTBOOK",
    loanDays: 30,
    renewalLimit: 3,
    graceDays: 7,
    finePerDay: 0,
    maxCopiesAtOnce: 10,
  },
  {
    patronCode: "FACULTY",
    itemCode: "REFERENCE",
    loanDays: 7,
    renewalLimit: 1,
    graceDays: 3,
    finePerDay: 0,
    maxCopiesAtOnce: 3,
  },
  {
    patronCode: "FACULTY",
    itemCode: "JOURNAL",
    loanDays: 7,
    renewalLimit: 2,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 5,
  },
  {
    patronCode: "FACULTY",
    itemCode: "FICTION",
    loanDays: 30,
    renewalLimit: 3,
    graceDays: 7,
    finePerDay: 0,
    maxCopiesAtOnce: 5,
  },
  {
    patronCode: "FACULTY",
    itemCode: "NON_FICTION",
    loanDays: 30,
    renewalLimit: 3,
    graceDays: 7,
    finePerDay: 0,
    maxCopiesAtOnce: 5,
  },
  {
    patronCode: "FACULTY",
    itemCode: "DIGITAL",
    loanDays: 60,
    renewalLimit: 3,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 10,
  },
  // Staff — like faculty but tighter.
  {
    patronCode: "STAFF",
    itemCode: "TEXTBOOK",
    loanDays: 21,
    renewalLimit: 2,
    graceDays: 5,
    finePerDay: 0,
    maxCopiesAtOnce: 5,
  },
  {
    patronCode: "STAFF",
    itemCode: "REFERENCE",
    loanDays: 0,
    renewalLimit: 0,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 0,
  },
  {
    patronCode: "STAFF",
    itemCode: "JOURNAL",
    loanDays: 7,
    renewalLimit: 1,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 3,
  },
  {
    patronCode: "STAFF",
    itemCode: "FICTION",
    loanDays: 21,
    renewalLimit: 2,
    graceDays: 5,
    finePerDay: 0,
    maxCopiesAtOnce: 3,
  },
  {
    patronCode: "STAFF",
    itemCode: "NON_FICTION",
    loanDays: 21,
    renewalLimit: 2,
    graceDays: 5,
    finePerDay: 0,
    maxCopiesAtOnce: 3,
  },
  // Guest — reading only.
  {
    patronCode: "GUEST",
    itemCode: "REFERENCE",
    loanDays: 0,
    renewalLimit: 0,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 0,
  },
  {
    patronCode: "GUEST",
    itemCode: "JOURNAL",
    loanDays: 0,
    renewalLimit: 0,
    graceDays: 0,
    finePerDay: 0,
    maxCopiesAtOnce: 0,
  },
];

export type LibraryMastersSeedResult =
  | { skipped: true; reason: string }
  | {
      inserted: {
        branches: number;
        patronCategories: number;
        itemCategories: number;
        zones: number;
        policies: number;
      };
    };

/**
 * Seed the empty library masters on a fresh database, ONCE.
 *
 * Rules the seed lives by:
 *  - **Never resurrects.** Marker-guarded; once written, the seed never fires
 *    again. A deleted seeded row stays deleted.
 *  - **Never overwrites an edit.** Every lookup is by `code`; if a matching
 *    code already exists, the row is left as it stands. Staff can rename,
 *    recolour, mark inactive — the seed will not fight them.
 *  - **Never duplicated across instances.** Held under
 *    `pg_try_advisory_lock(918360004)` for the whole run — losing instances
 *    skip and get on with their boot.
 *  - **Fine per day = 0 across the board.** A fresh install must not silently
 *    over-charge; staff opt in by editing the policies.
 *
 * Interaction with the ongoing legacy sync (`library-legacy-sync.service.ts`):
 * seeded rows have `legacy_<x>_id = NULL` because they were never in the IRP
 * source. The sync's delete step only removes rows with NON-NULL legacy IDs
 * that aren't in the source, so seeded rows are safe from resurrection AND
 * from deletion. If the loader later happens to encounter an IRP row whose
 * `code` matches a seeded row (e.g. a "MAIN" branch on both sides), the
 * find-or-create resolver attaches the legacy ID to the seeded row — that's
 * the intended merge, not a duplication.
 */
export async function runLibraryMastersSeed(opts?: {
  force?: boolean;
}): Promise<LibraryMastersSeedResult> {
  if (!opts?.force) {
    const marker = await getBootMigrationMarker(MARKER);
    if (marker) {
      return {
        skipped: true,
        reason: `already ran on ${marker.ran_at.toISOString()}`,
      };
    }
  }

  const lockClient = await pool.connect();
  let holdsLock = false;

  try {
    const lockRes = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [LOCK_KEY],
    );
    holdsLock = lockRes.rows[0]?.locked === true;
    if (!holdsLock) {
      return {
        skipped: true,
        reason: "another instance is running the library masters seed",
      };
    }

    const inserted = {
      branches: 0,
      patronCategories: 0,
      itemCategories: 0,
      zones: 0,
      policies: 0,
    };

    // -- Default branch -------------------------------------------------------
    const [existingBranch] = await db
      .select({ id: branchModel.id })
      .from(branchModel)
      .where(eq(branchModel.code, DEFAULT_BRANCH.code))
      .limit(1);
    let branchId: number;
    if (existingBranch) {
      branchId = existingBranch.id;
    } else {
      const [row] = await db
        .insert(branchModel)
        .values({ ...DEFAULT_BRANCH, isActive: true })
        .returning({ id: branchModel.id });
      branchId = row.id;
      inserted.branches++;
    }

    // -- Patron categories ---------------------------------------------------
    const patronIdByCode = new Map<string, number>();
    for (const cat of PATRON_CATEGORIES) {
      const [existing] = await db
        .select({ id: patronCategoryModel.id })
        .from(patronCategoryModel)
        .where(eq(patronCategoryModel.code, cat.code))
        .limit(1);
      if (existing) {
        patronIdByCode.set(cat.code, existing.id);
        continue;
      }
      const [row] = await db
        .insert(patronCategoryModel)
        .values({ ...cat, isActive: true })
        .returning({ id: patronCategoryModel.id });
      patronIdByCode.set(cat.code, row.id);
      inserted.patronCategories++;
    }

    // -- Item categories -----------------------------------------------------
    const itemIdByCode = new Map<string, number>();
    for (const cat of ITEM_CATEGORIES) {
      const [existing] = await db
        .select({ id: itemCategoryModel.id })
        .from(itemCategoryModel)
        .where(eq(itemCategoryModel.code, cat.code))
        .limit(1);
      if (existing) {
        itemIdByCode.set(cat.code, existing.id);
        continue;
      }
      const [row] = await db
        .insert(itemCategoryModel)
        .values({ ...cat, isActive: true })
        .returning({ id: itemCategoryModel.id });
      itemIdByCode.set(cat.code, row.id);
      inserted.itemCategories++;
    }

    // -- Zones (all attached to the default branch) --------------------------
    for (const z of ZONES) {
      const [existing] = await db
        .select({ id: libraryZoneModel.id })
        .from(libraryZoneModel)
        .where(
          and(
            eq(libraryZoneModel.branchId, branchId),
            eq(libraryZoneModel.code, z.code),
          ),
        )
        .limit(1);
      if (existing) continue;
      await db
        .insert(libraryZoneModel)
        .values({ ...z, branchId, isActive: true });
      inserted.zones++;
    }

    // -- Circulation policies ------------------------------------------------
    for (const p of POLICY_MATRIX) {
      const patronId = patronIdByCode.get(p.patronCode);
      const itemId = itemIdByCode.get(p.itemCode);
      if (!patronId || !itemId) continue;

      const [existing] = await db
        .select({ id: circulationPolicyModel.id })
        .from(circulationPolicyModel)
        .where(
          and(
            eq(circulationPolicyModel.patronCategoryId, patronId),
            eq(circulationPolicyModel.itemCategoryId, itemId),
          ),
        )
        .limit(1);
      if (existing) continue;

      await db.insert(circulationPolicyModel).values({
        patronCategoryId: patronId,
        itemCategoryId: itemId,
        loanDays: p.loanDays,
        renewalLimit: p.renewalLimit,
        graceDays: p.graceDays,
        finePerDay: p.finePerDay,
        maxCopiesAtOnce: p.maxCopiesAtOnce,
        skipHolidaysInFine: true,
        isActive: true,
      });
      inserted.policies++;
    }

    const result: LibraryMastersSeedResult = { inserted };
    await setBootMigrationMarker(MARKER, inserted);
    log.info(
      `seeded library masters: ${inserted.branches} branch, ${inserted.patronCategories} patron cats, ${inserted.itemCategories} item cats, ${inserted.zones} zones, ${inserted.policies} policies`,
    );
    return result;
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [LOCK_KEY])
        .catch(() => undefined);
    }
    lockClient.release();
  }
}

/**
 * Was the seed used on this database?
 *
 * Drives the dashboard's amber warning banner — as long as ANY seeded row is
 * still around (staff have not yet edited or replaced them), a banner asks the
 * admin to review the defaults. We check for the default branch code MAIN plus
 * one seeded patron category; a legitimate install that renamed/replaced them
 * will not trigger it.
 */
export async function readLibrarySeedStatus(): Promise<{
  seedRan: boolean;
  ranAt: string | null;
  defaultsPresent: {
    defaultBranch: boolean;
    seededPatronCategories: number;
    seededItemCategories: number;
    seededZones: number;
    seededPolicies: number;
  };
}> {
  const marker = await getBootMigrationMarker(MARKER);

  const [[branchRow], patronCount, itemCount, zoneCount, policyCount] =
    await Promise.all([
      db
        .select({ id: branchModel.id })
        .from(branchModel)
        .where(eq(branchModel.code, DEFAULT_BRANCH.code))
        .limit(1),
      db.select({ id: patronCategoryModel.id }).from(patronCategoryModel).where(
        eq(
          patronCategoryModel.code,
          // Any one of the seeded codes; a rename by staff clears the flag.
          "STUDENT",
        ),
      ),
      db
        .select({ id: itemCategoryModel.id })
        .from(itemCategoryModel)
        .where(eq(itemCategoryModel.code, "TEXTBOOK")),
      db.select({ id: libraryZoneModel.id }).from(libraryZoneModel),
      db.select({ id: circulationPolicyModel.id }).from(circulationPolicyModel),
    ]);

  return {
    seedRan: marker !== null,
    ranAt: marker?.ran_at.toISOString() ?? null,
    defaultsPresent: {
      defaultBranch: Boolean(branchRow),
      seededPatronCategories: patronCount.length,
      seededItemCategories: itemCount.length,
      seededZones: zoneCount.length,
      seededPolicies: policyCount.length,
    },
  };
}
