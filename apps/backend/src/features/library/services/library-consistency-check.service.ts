import { db, mysqlConnection } from "@/db/index.js";
import { sql } from "drizzle-orm";

/**
 * Post-load sanity report — proves the library import is internally consistent
 * against IRP and internally coherent inside the new DB. Runs read-only; safe
 * to call any time. All queries run in parallel — the whole report finishes in
 * one round trip per side.
 *
 * Four families of checks:
 *
 *   1. Count comparison — for every legacy table we import, count rows on
 *      each side. A source-count > new-count difference is missing data; a
 *      new-count > source-count difference is orphan/double-writes we must
 *      inspect.
 *   2. Orphan FK — books/copies/circulation pointing at a parent id that
 *      does not exist locally.
 *   3. Fine sanity — active loans with a fine (bad state, only returned rows
 *      should carry one) and paid rows whose fineAmount is zero (paid £0 is
 *      not a real thing).
 *   4. Circulation sanity — issue timestamp after return timestamp, returned
 *      rows without actualReturnTimestamp.
 */

const COUNT_PAIRS: Array<{
  label: string;
  legacyTable: string;
  legacySql?: string; // custom filter to match the loader's SQL
  newSql: ReturnType<typeof sql>;
}> = [
  {
    label: "publisher",
    legacyTable: "publisher",
    newSql: sql`SELECT COUNT(*)::int AS n FROM publishers`,
  },
  {
    label: "author",
    legacyTable: "author",
    newSql: sql`SELECT COUNT(*)::int AS n FROM authors`,
  },
  {
    label: "author_type",
    legacyTable: "authortype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM author_types`,
  },
  {
    label: "author_details",
    legacyTable: "authordetailsub",
    newSql: sql`SELECT COUNT(*)::int AS n FROM author_details`,
  },
  {
    label: "vendor",
    legacyTable: "procurementvendordetailmaintab",
    newSql: sql`SELECT COUNT(*)::int AS n FROM vendors`,
  },
  {
    label: "series",
    legacyTable: "series",
    newSql: sql`SELECT COUNT(*)::int AS n FROM series`,
  },
  {
    label: "language",
    legacyTable: "language",
    newSql: sql`SELECT COUNT(*)::int AS n FROM language_medium WHERE legacy_language_id IS NOT NULL`,
  },
  {
    label: "enclosure",
    legacyTable: "enclosetype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM enclosures`,
  },
  {
    label: "entry_mode",
    legacyTable: "entrymode",
    newSql: sql`SELECT COUNT(*)::int AS n FROM entry_modes`,
  },
  {
    label: "journal_type",
    legacyTable: "journaltype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM journal_types`,
  },
  {
    label: "status",
    legacyTable: "status",
    newSql: sql`SELECT COUNT(*)::int AS n FROM library_statuses`,
  },
  {
    label: "rack",
    legacyTable: "rack",
    newSql: sql`SELECT COUNT(*)::int AS n FROM racks`,
  },
  {
    label: "shelf",
    legacyTable: "shelf",
    newSql: sql`SELECT COUNT(*)::int AS n FROM shelfs`,
  },
  {
    label: "binding_type",
    legacyTable: "bindingtype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM binding_types`,
  },
  {
    label: "period",
    legacyTable: "periodpojo",
    newSql: sql`SELECT COUNT(*)::int AS n FROM library_periods`,
  },
  {
    label: "library_article",
    legacyTable: "latype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM library_articles`,
  },
  {
    label: "library_document_type",
    legacyTable: "documenttypelist",
    newSql: sql`SELECT COUNT(*)::int AS n FROM library_document_types`,
  },
  {
    label: "borrowing_type",
    legacyTable: "borrowingtype",
    newSql: sql`SELECT COUNT(*)::int AS n FROM borrowing_types`,
  },
  {
    label: "journal",
    legacyTable: "journalmaster",
    newSql: sql`SELECT COUNT(*)::int AS n FROM journals`,
  },
  {
    label: "book",
    legacyTable: "bookentry",
    newSql: sql`SELECT COUNT(*)::int AS n FROM books`,
  },
  {
    label: "copy",
    legacyTable: "copydetailsub",
    newSql: sql`SELECT COUNT(*)::int AS n FROM copy_details`,
  },
  {
    label: "holiday",
    legacyTable: "holidaymain",
    newSql: sql`SELECT COUNT(*)::int AS n FROM holidays WHERE legacy_holiday_id IS NOT NULL`,
  },
  {
    label: "class_holiday",
    legacyTable: "holidaystudentsub",
    newSql: sql`SELECT COUNT(*)::int AS n FROM class_holidays WHERE legacy_holiday_student_mapping_id IS NOT NULL`,
  },
  // issuereturn + libentryexit use the loader's WHERE filter so counts match
  // what the load actually selected.
  {
    label: "circulation",
    legacyTable: "issuereturn (loader-filtered)",
    legacySql: `
      SELECT COUNT(DISTINCT i.id) AS n
      FROM issuereturn i
      LEFT JOIN historicalrecord h ON h.parent_id=i.userId AND i.userTypeId='Student'
      LEFT JOIN currentsessionmaster sess ON sess.id=h.sessionid
      WHERE i.userId IS NOT NULL AND i.userTypeId IS NOT NULL
        AND (i.userTypeId IN ('Staff','Teacher')
             OR (i.userTypeId='Student' AND h.id IS NOT NULL AND sess.id > 17 AND h.classId = 4))`,
    newSql: sql`SELECT COUNT(*)::int AS n FROM book_circulation`,
  },
  {
    label: "entry_exit",
    legacyTable: "libentryexit (loader-filtered)",
    legacySql: `
      SELECT COUNT(DISTINCT l.id) AS n
      FROM libentryexit l
      LEFT JOIN historicalrecord h ON h.parent_id=l.usrid AND l.usrtype='Student'
      LEFT JOIN currentsessionmaster sess ON sess.id=h.sessionid
      WHERE l.usrid IS NOT NULL AND l.usrtype IS NOT NULL
        AND (l.usrtype IN ('Staff','Teacher')
             OR (l.usrtype='Student' AND h.id IS NOT NULL AND sess.id > 17 AND h.classId = 4))`,
    newSql: sql`SELECT COUNT(*)::int AS n FROM library_entry_exit`,
  },
];

export type LibraryConsistencyReport = {
  ranAt: string;
  counts: Array<{
    label: string;
    legacy: number;
    now: number;
    delta: number;
    verdict: "match" | "missing" | "extra" | "n/a";
  }>;
  orphans: {
    copiesWithoutBook: number;
    circulationWithoutCopy: number;
    circulationWithoutUser: number;
    entryExitWithoutUser: number;
  };
  fineSanity: {
    activeWithFine: number; // isReturned = false but fineAmount > 0
    paidWithZeroFine: number; // paymentId not null but fineAmount = 0
    waiverGreaterThanFine: number; // fineWaiver > fineAmount
  };
  circulationSanity: {
    issueAfterReturn: number; // issueTimestamp > returnTimestamp
    returnedWithoutActualReturn: number; // isReturned = true but actualReturnTimestamp NULL
  };
};

async function countLegacy(
  entry: (typeof COUNT_PAIRS)[number],
): Promise<number> {
  try {
    const sqlText =
      entry.legacySql ?? `SELECT COUNT(*) AS n FROM \`${entry.legacyTable}\``;
    const [[r]] = (await mysqlConnection.query(sqlText)) as [
      { n: number }[],
      unknown,
    ];
    return Number(r?.n ?? 0);
  } catch {
    return -1;
  }
}

async function countNew(entry: (typeof COUNT_PAIRS)[number]): Promise<number> {
  try {
    const r = (await db.execute(entry.newSql)).rows[0] as
      | { n: number }
      | undefined;
    return Number(r?.n ?? 0);
  } catch {
    return -1;
  }
}

export async function runLibraryConsistencyCheck(): Promise<LibraryConsistencyReport> {
  // Every count query in parallel — the whole report is one round trip per
  // side. Two pools involved (Postgres + MySQL) so bounded concurrency isn't
  // a concern here.
  const countResults = await Promise.all(
    COUNT_PAIRS.map(async (p) => {
      const [legacy, now] = await Promise.all([countLegacy(p), countNew(p)]);
      const delta = now - legacy;
      const verdict: "match" | "missing" | "extra" | "n/a" =
        legacy < 0 || now < 0
          ? "n/a"
          : delta === 0
            ? "match"
            : delta < 0
              ? "missing"
              : "extra";
      return { label: p.label, legacy, now, delta, verdict };
    }),
  );

  const [
    [{ copiesWithoutBook }],
    [{ circulationWithoutCopy }],
    [{ circulationWithoutUser }],
    [{ entryExitWithoutUser }],
    [{ activeWithFine }],
    [{ paidWithZeroFine }],
    [{ waiverGreaterThanFine }],
    [{ issueAfterReturn }],
    [{ returnedWithoutActualReturn }],
  ] = (await Promise.all([
    db.execute(
      sql`SELECT COUNT(*)::int AS "copiesWithoutBook" FROM copy_details c LEFT JOIN books b ON b.id = c.book_id_fk WHERE b.id IS NULL`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "circulationWithoutCopy" FROM book_circulation bc LEFT JOIN copy_details c ON c.id = bc.copy_details_id_fk WHERE c.id IS NULL`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "circulationWithoutUser" FROM book_circulation bc LEFT JOIN users u ON u.id = bc.user_id_fk WHERE u.id IS NULL`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "entryExitWithoutUser" FROM library_entry_exit e LEFT JOIN users u ON u.id = e.user_id_fk WHERE u.id IS NULL`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "activeWithFine" FROM book_circulation WHERE is_returned = false AND COALESCE(fine_amount, 0) > 0`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "paidWithZeroFine" FROM book_circulation WHERE payment_id_fk IS NOT NULL AND COALESCE(fine_amount, 0) = 0`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "waiverGreaterThanFine" FROM book_circulation WHERE COALESCE(fine_waiver, 0) > COALESCE(fine_amount, 0)`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "issueAfterReturn" FROM book_circulation WHERE issue_timestamp > return_timestamp`,
    ),
    db.execute(
      sql`SELECT COUNT(*)::int AS "returnedWithoutActualReturn" FROM book_circulation WHERE is_returned = true AND actual_return_timestamp IS NULL`,
    ),
  ]).then((results) => results.map((r) => r.rows))) as unknown as Array<
    Array<Record<string, number>>
  >;

  return {
    ranAt: new Date().toISOString(),
    counts: countResults,
    orphans: {
      copiesWithoutBook: Number(copiesWithoutBook),
      circulationWithoutCopy: Number(circulationWithoutCopy),
      circulationWithoutUser: Number(circulationWithoutUser),
      entryExitWithoutUser: Number(entryExitWithoutUser),
    },
    fineSanity: {
      activeWithFine: Number(activeWithFine),
      paidWithZeroFine: Number(paidWithZeroFine),
      waiverGreaterThanFine: Number(waiverGreaterThanFine),
    },
    circulationSanity: {
      issueAfterReturn: Number(issueAfterReturn),
      returnedWithoutActualReturn: Number(returnedWithoutActualReturn),
    },
  };
}
