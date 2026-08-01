import { io } from "@/app.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("library-realtime");

/**
 * Library realtime events.
 *
 * The Redis adapter is already wired ([app.ts:400]), so every emit reaches
 * clients on every EC2 instance through pub/sub — the emitter and the receiver
 * do not have to be on the same node.
 *
 * The payload is always a HINT ({ what, ids }), never the row itself. Clients
 * receive it and invalidate their React Query cache; the refetch that follows
 * hits the same authoritative endpoint as the initial load, so we cannot ship
 * stale or wrong data through the socket.
 *
 * Rooms:
 *   - `library`               — every page in the module (dashboard, lists)
 *   - `library:user:<userId>` — a specific patron's history
 *   - `library:book:<bookId>` — a specific book's copies & circulation
 */

export type LibraryEventName =
  | "library:circulation:updated"
  | "library:copy:updated"
  | "library:book:updated"
  | "library:entry-exit:updated"
  | "library:fine:updated"
  | "library:master:updated"
  | "library:load:progress";

type EmitOptions = {
  bookId?: number | null;
  userId?: number | null;
  /** Free-form payload; keep small, no PII. */
  detail?: Record<string, unknown>;
};

function targets(opts: EmitOptions): string[] {
  const rooms = ["library"];
  if (opts.bookId != null) rooms.push(`library:book:${opts.bookId}`);
  if (opts.userId != null) rooms.push(`library:user:${opts.userId}`);
  return rooms;
}

/** Fire-and-forget: never let a socket failure fail a domain mutation. */
export function emitLibraryEvent(
  event: LibraryEventName,
  opts: EmitOptions = {},
): void {
  try {
    const payload = { at: new Date().toISOString(), ...opts.detail };
    const rooms = targets(opts);
    for (const room of rooms) io.to(room).emit(event, payload);
    // Log every fired event so we can see it in the backend terminal — the
    // last debugging round ended at "no visible trace" and it wasn't clear
    // whether the emit was firing at all.
    log.info(
      `emit ${event} -> rooms [${rooms.join(", ")}] payload=${JSON.stringify(payload).slice(0, 200)}`,
    );
  } catch (err) {
    log.warn(`emit ${event} failed`, { error: err });
  }
}

/**
 * Human-readable labels for each legacy table the IRP loader processes.
 * The internal names (`issuereturn`, `latype`, `holidaystudentsub`) are
 * meaningless to the operator watching progress — this maps every one to
 * plain English before it hits the dashboard.
 */
export const LIBRARY_LOAD_TABLE_LABELS: Record<string, string> = {
  issuereturn: "Book circulation (issue/return)",
  holidaymain: "Holidays",
  holidaystudentsub: "Class holidays",
  author: "Authors",
  authordetailsub: "Book–author links",
  authortype: "Author types",
  procurementvendordetailmaintab: "Vendors",
  language: "Languages",
  series: "Series",
  publisher: "Publishers",
  subjectgroup: "Subject groups",
  enclosetype: "Enclosures",
  entrymode: "Entry modes",
  journaltype: "Journal types",
  status: "Statuses",
  rack: "Racks",
  shelf: "Shelves",
  bindingtype: "Binding types",
  periodpojo: "Periods",
  latype: "Article types",
  documenttypelist: "Document types",
  borrowingtype: "Borrowing types",
  journalmaster: "Journals",
  bookentry: "Books",
  copydetailsub: "Book copies",
  libentryexit: "Library entry/exit",
};

/**
 * The IRP loader fires this from whichever instance holds the advisory lock —
 * every dashboard on every instance sees it and refetches. Throttled at the
 * caller so a 200k-row load does not become 200k emits.
 *
 * The payload now carries a friendly `label` and a `percent` (0–100) so the
 * dashboard banner can show "Loading Book copies — 34%" instead of an
 * inscrutable "copydetailsub".
 */
export function emitLibraryLoadProgress(detail: {
  table: string;
  loaded: number;
  failed: number;
  total: number;
  done?: boolean;
  /** Cumulative across all tables, 0–100. */
  percent?: number;
  /** Which layer this table lives in (1-based) and how many layers total. */
  layer?: number;
  layerTotal?: number;
  /**
   * All internal table names running in parallel in the current layer — feeds
   * the "loading X, Y, Z in parallel" line in the banner.
   */
  currentLayerTables?: string[];
  /**
   * Internal table names from the previous layer this one depends on. Lets the
   * banner say "circulation depends on copies, which depend on books" instead
   * of showing an opaque layer number.
   */
  dependsOn?: string[];
  /** How many tables have finished so far, across every layer. */
  tablesDone?: number;
  /** Total number of tables the loader will process end-to-end. */
  tablesTotal?: number;
  /** Cumulative rows processed across every table so far. Feeds the client's
   *  recent-rate ETA fit. */
  rowsProcessed?: number;
  /** Planned total rows across every table (from the planning phase). */
  rowsTotal?: number;
}): void {
  const label = LIBRARY_LOAD_TABLE_LABELS[detail.table] ?? detail.table;
  const currentLayerLabels = (detail.currentLayerTables ?? []).map(
    (t) => LIBRARY_LOAD_TABLE_LABELS[t] ?? t,
  );
  const dependsOnLabels = (detail.dependsOn ?? []).map(
    (t) => LIBRARY_LOAD_TABLE_LABELS[t] ?? t,
  );
  // startedAt anchors the client-side ETA: with a known load start the client
  // can project remaining time from the very first emit (elapsedFromStart
  // combined with current percent), instead of waiting for percent to move
  // after it joins.
  const startedAt = currentLoadStartedAtISO ?? new Date().toISOString();
  const enriched = {
    ...detail,
    label,
    currentLayerLabels,
    dependsOnLabels,
    startedAt,
  };
  currentLoadSnapshot = {
    ...enriched,
    at: new Date().toISOString(),
    running: (detail.percent ?? 0) < 100,
  };
  emitLibraryEvent("library:load:progress", { detail: enriched });
}

/**
 * Latest progress fact kept in memory so a dashboard opening AFTER an emit
 * can still catch up. The socket only carries events forward from the moment
 * a client joins, which meant a dashboard refresh during a fast layer (layer 1
 * fires 19 tables in ~6s) never saw a banner. Fetching this on mount seeds
 * the banner with whatever the loader has done so far.
 *
 * Per-instance memory — that's fine: the load runs on ONE instance (advisory
 * lock), and any dashboard on any other instance still gets the live emits via
 * the Redis adapter. This snapshot is a fallback for the "missed the emit"
 * case, and the instance holding the lock is the one that also serves the
 * fastest reads to whoever hits it.
 */
export type LibraryLoadSnapshot =
  | (ReturnType<typeof formatSnapshot> & { running: boolean })
  | null;

let currentLoadSnapshot:
  | (Parameters<typeof emitLibraryLoadProgress>[0] & {
      label: string;
      currentLayerLabels: string[];
      dependsOnLabels: string[];
      startedAt: string;
      at: string;
      running: boolean;
    })
  | null = null;

/**
 * ISO timestamp of when the current run's loader was flagged running. Written
 * by `markLoadRunning(true)`, read from every subsequent emit so the client
 * always sees the same startedAt across every progress event of this run.
 * Reset on `markLoadRunning(false)`.
 */
let currentLoadStartedAtISO: string | null = null;

function formatSnapshot(
  s: NonNullable<typeof currentLoadSnapshot>,
): NonNullable<typeof currentLoadSnapshot> {
  return s;
}

export function readCurrentLoadSnapshot() {
  return currentLoadSnapshot;
}

/** Called by the loader on start and on final done — bookends the snapshot. */
export function markLoadRunning(running: boolean): void {
  if (running) {
    const startedAt = new Date().toISOString();
    currentLoadStartedAtISO = startedAt;
    currentLoadSnapshot = {
      table: "",
      loaded: 0,
      failed: 0,
      total: 0,
      percent: 0,
      label: "Starting…",
      currentLayerLabels: [],
      dependsOnLabels: [],
      startedAt,
      at: startedAt,
      running: true,
    };
  } else if (currentLoadSnapshot) {
    currentLoadSnapshot = {
      ...currentLoadSnapshot,
      running: false,
      percent: 100,
    };
    currentLoadStartedAtISO = null;
  }
}
