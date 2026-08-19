# Branch Review: `chore/api-latency-audit` vs `main` — Multi-Instance Merge Readiness

- **Branch**: `chore/api-latency-audit`
- **Compared against**: `main` @ `0317974c` (merge-base)
- **Scope**: 26 commits, 91 files changed, ~11,877 insertions / 1,810 deletions
- **Prod topology this review is filtered through**: multiple backend instances and multiple student-console instances, behind a load balancer, **no sticky sessions**.
- **Method**: every item below was confirmed by directly reading the branch's source (`git show chore/api-latency-audit:<path>`) or diffing it against the merge-base (`git diff 0317974c...chore/api-latency-audit -- <path>`) in this review session. No item is based on description alone without a source citation. Where prod infrastructure behavior (network paths, Redis provisioning, row counts) cannot be confirmed from the repo, it is explicitly marked as unverified rather than assumed.

---

## Summary table

| #   | Issue                                                                           | File                                                                 | Category                                              | Verified                                         |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| A1  | In-process, non-invalidated notification-template cache                         | `cu-registration-correction-request.service.ts:81-104`               | Multi-instance blocking                               | ✅ direct read                                   |
| A2  | `classes` BFF route cache has no invalidation path at all                       | `student-console/.../api/classes/route.ts`                           | Multi-instance blocking                               | ✅ direct read                                   |
| A3  | 13 BFF reference-data routes use a per-instance cache by design                 | `student-console/.../lib/utils/ttl-cache.ts` + 13 routes             | Multi-instance, needs sign-off                        | ✅ direct read                                   |
| A4  | Socket.IO polling fallback removed fleet-wide                                   | 5 files in `main-console`                                            | Multi-instance, needs infra confirmation              | ✅ direct read                                   |
| A5  | Backend Socket.IO server config unchanged, still accepts polling                | `apps/backend/src/app.ts`                                            | Multi-instance, informational (not a blocker)         | ✅ direct read                                   |
| B1  | 7 streaming export controllers can send a broken response on mid-stream failure | 5 library + career-progression + id-card controllers                 | Regression, instance-count independent                | ✅ direct read                                   |
| B2  | Two-phase book/copy search can drop true top-N matches                          | `book-circulation.service.ts:556-604`                                | Regression, instance-count independent                | ✅ direct read                                   |
| B3  | Email timeout wrapper doesn't cancel the underlying send                        | `student-console/.../zepto-mailer.ts`                                | Regression, instance-count independent                | ✅ direct read                                   |
| B4  | Report-job stream-to-buffer adapter has no timeout                              | `apps/backend/src/features/reports/report-generators.ts`             | Regression, instance-count independent                | ✅ direct read                                   |
| C1  | Subject-selection validation rules changed                                      | `subject-selection-form.tsx`, `student-subject-selection.service.ts` | Business-logic change bundled into perf branch        | ✅ direct read                                   |
| C2  | `Minor` notification field shape changed (`III`→`V`)                            | `email.worker.ts:409-436`                                            | Business-logic change (fix, but shape change)         | ✅ direct read                                   |
| C3  | Tailwind content glob fix can change styling app-wide                           | `student-console/tailwind.config.ts`                                 | Business-logic/visual change bundled into perf branch | ✅ direct read                                   |
| D1  | New index migration takes a write-blocking lock during build                    | `0196_library_perf_indexes.sql`                                      | Deploy-operational, not multi-instance-specific       | ✅ direct read (lock duration itself unverified) |
| —   | `library-copy-details` report jobKey rename                                     | `LibraryReportsPage.tsx:169` / `report-generators.ts:465`            | Checked — **not an issue**, both sides match          | ✅ direct read                                   |

---

## Section A — Merge-blocking: multi-instance / fleet-correctness issues

### A1. In-process notification-template cache has no invalidation, unlike every other cache in this branch

**File**: `apps/backend/src/features/admissions/services/cu-registration-correction-request.service.ts:81-104`

```ts
const notificationMasterRowCache = new Map<...>();
...
const cached = notificationMasterRowCache.get(key);
...
if (row) notificationMasterRowCache.set(key, row);
```

This is a plain `Map` held in each backend process's memory. It has no TTL and nothing in the file clears or bumps it. Every other cache added in this branch (`apps/backend/src/services/snapshot-cache.ts`, used by the admission dashboard, notifications-console dashboard, library dashboard/reports, and realtime-tracker) is Redis-backed and epoch-keyed via `getCachedSnapshot`/`bumpSnapshotEpoch`, so a write on any instance is visible to all instances immediately. This cache is the one exception to that pattern in the whole branch.

**Why it's blocking under a load balancer**: if a notification-master row (template/variant content) is edited through the admin UI, the request lands on one instance, which updates the DB. Every other instance behind the LB keeps serving its own already-cached copy of that row indefinitely — until that specific process restarts. The next CU-registration confirmation notification could be built from stale template metadata by a different instance than the one that handled the edit, with no bound on how long that can persist.

### A2. `classes` reference-data route caches with no invalidation path in the codebase

**File**: `apps/student-console/src/app/api/classes/route.ts` (full file, 27 lines)

```ts
// See @/lib/utils/ttl-cache for scope/limitations (60s, per-instance).
// No POST/PUT/DELETE handlers exist in this route, so there is nothing to
// invalidate the cache on - classes are managed elsewhere.
const listCache = createTtlCache<unknown>(60_000);
```

This is the branch's own comment, confirmed by reading the file — it contains only a `GET` handler. There is no code path anywhere in this file that calls `listCache.clear()`.

**Why it's blocking under a load balancer**: on a single instance, a 60s TTL bounds staleness. But since this cache is per-instance (see A3) and this specific route has no write handler to even attempt invalidation on any instance, a write to class data from wherever "classes are managed elsewhere" has no way to shorten the staleness window below the full 60s on any instance, on top of the normal per-instance propagation gap.

### A3. 13 BFF reference-data routes cache per-instance by design; needs explicit sign-off

**File**: `apps/student-console/src/lib/utils/ttl-cache.ts` (full file, 41 lines) — the utility's own doc comment:

```
IMPORTANT - per-instance limitation: this cache lives in the Node.js
process memory of a single running instance. The student-console app can
run as multiple instances behind a load balancer with no sticky
sessions, so a POST/PUT/DELETE handled by instance A only clears
instance A's cache entry - instance B (and any others) keep serving
their own cached copy until it naturally expires (up to `ttlMs`, default
60s). This is an accepted staleness window for slow-changing reference
data, not a bug.
```

Applied (confirmed via diff) to: `academic-years`, `annual-incomes`, `blood-groups`, `board-universities`, `categories`, `classes`, `degrees`, `departments`, `institutions`, `language-mediums`, `nationalities`, `religions`, `sports-categories`.

The `degrees` route has an additional, separately-documented gap: the bulk-import path (`/api/degrees/upload`, a different route file) writes rows but has no way to reach this file's in-memory cache instance to clear it.

**This is explicitly self-declared as an accepted tradeoff by the branch's own comments, not a hidden bug** — listed here because the user asked specifically what is not fleet-safe, and a 60-second, per-instance, unbounded-by-write staleness window on admin-editable reference data is a real behavior change from "always live" that needs an explicit go/no-go decision, not a code fix.

### A4. Socket.IO polling fallback removed across the fleet-facing client hooks

**Files** (identical change, confirmed via diff, in all five): `apps/main-console/src/hooks/useSocket.ts`, `useActiveUsers.ts`, `src/services/socketService.ts`, `src/features/realtime-tracker/hooks/useMisSocket.ts`, `useRealtimeTrackerSocket.ts`

```diff
-      transports: ["websocket", "polling"],
+      // websocket-only: prod runs multiple instances without sticky sessions —
+      // the Redis adapter bridges rooms but NOT Engine.IO sessions, so a
+      // long-polling handshake split across instances 400s ("Session ID
+      // unknown") and churns presence. ALB passes websockets fine.
+      transports: ["websocket"],
```

This is fixing a real, confirmed multi-instance bug: Engine.IO long-polling requires multiple sequential HTTP requests to land on the _same_ instance to complete a single logical connection, and without sticky sessions an ALB can route them to different instances, breaking the handshake. Removing polling avoids that failure mode entirely.

**Why it's still flagged**: the fallback is gone completely. If any segment of production traffic cannot complete a WebSocket upgrade (corporate proxy, restrictive firewall, misconfigured intermediate load balancer/proxy hop), those clients previously degraded to polling; they will now get no realtime connection at all. The comment asserts "ALB passes websockets fine" — this repo review has no way to confirm actual production network-path behavior for 100% of client traffic, so this claim is unverified from the codebase alone and should be confirmed against real infrastructure before merge.

### A5. Backend Socket.IO server config is unchanged and still accepts polling (informational, not a blocker)

**File**: `apps/backend/src/app.ts:379-397` — confirmed via `git diff 0317974c...chore/api-latency-audit -- apps/backend/src/app.ts` that this section has **no changes** in this branch.

```ts
export const io = new Server(httpServer, {
  cors: { ... },
});
```

No `transports` option is set server-side, so the server still defaults to accepting both `polling` and `websocket`. This means A4's client-side change is backward-compatible from a protocol-negotiation standpoint (a client offering fewer transports than the server supports is not a mismatch) — the residual risk in A4 is purely about network-path WS-upgrade support, not a client/server configuration conflict.

---

## Section B — Regressions independent of instance count

These will misbehave identically on a single instance or a fleet of instances; they are not caused by the multi-instance topology, but they are correctness regressions this "verify nothing breaks" review turned up.

### B1. Streaming export controllers can produce a broken response if the export fails partway through

**Root cause file**: `apps/backend/src/utils/handleError.ts` — confirmed the function unconditionally calls `res.status(...).json(...)` in every branch; there is no `res.headersSent` check anywhere in the file.

**Affected controllers** (each verified to call `handleError(error, res, next)` from the `catch` block of a handler that streams an Excel workbook directly to `res` via `ExcelJS.stream.xlsx.WorkbookWriter`, meaning HTTP headers and part of the body may already be sent before an error can occur):

| Controller                              | Handler                                   | `handleError` call site |
| --------------------------------------- | ----------------------------------------- | ----------------------- |
| `book-circulation.controller.ts`        | `downloadBookCirculationExcelController`  | line 309                |
| `book.controller.ts`                    | `downloadBookExcelController`             | line 218                |
| `copy-details.controller.ts`            | `downloadCopyDetailsExcelController`      | line 182                |
| `journal.controller.ts`                 | `downloadJournalExcelController`          | line 137                |
| `library-entry-exit.controller.ts`      | `downloadLibraryEntryExitExcelController` | line 382                |
| `career-progression-form.controller.ts` | export handler                            | line 43                 |
| `id-card-report.controller.ts`          | Excel export handler                      | line 49                 |

For each, a database error, S3 error, or serialization failure that occurs after the first chunk has been flushed will cause the `catch` block to attempt `res.status().json()` on a response that already has headers sent — Express/Node will reject this (`ERR_HTTP_HEADERS_SENT`), and the client is left with a truncated, invalid `.xlsx` file and no clean error signal.

**Contrast — the one place in this branch that handles this correctly**: `apps/backend/src/features/admissions/controllers/cu-registration-document-download.controller.ts:52-64` tracks a local `headersSent` flag and branches:

```ts
let headersSent = false;
...
archive.on("error", (err: Error) => {
  if (!headersSent) {
    handleError(err, res, next);
  } else {
    res.destroy(err);
  }
});
```

The same file's `id-card-report.controller.ts` also does this correctly for its **zip** handler (`streamZipForDate`, line 71: `if (!res.headersSent) res.status(500).end(); else res.end();`) but not for its **Excel export** handler (line 49) in the same file — confirming the gap is inconsistent application of a pattern the branch's authors clearly know about, not a missing capability.

### B2. Two-phase book/copy search can silently drop true top-N matches

**File**: `apps/backend/src/features/library/services/book-circulation.service.ts:556-604`, function `searchBookOptions` — read in full:

```ts
const candidates = await db.execute(sql`
  (select cd.id from ${copyDetailsModel} cd
    where cd.access_number ilike ${term}
    order by cd.id desc limit ${safeLimit})
  union
  (select cd.id from ${copyDetailsModel} cd
    join ${bookModel} b on b.id = cd.book_id_fk
    where b.title ilike ${term}
    order by cd.id desc limit ${safeLimit})
  order by id desc limit ${safeLimit}`);
```

Each of the two sub-queries (access-number match, title match) independently takes its own top-`safeLimit` slice _before_ the `union`, and the combined result is then limited to `safeLimit` again. A record that would legitimately belong in the true combined top-`safeLimit` can be excluded if it doesn't rank within the top `safeLimit` of its own individual sub-query. This is a functional change to search results, not just a latency change — the code comment describing this as fixing a 48-97s query is accurate, but the correctness tradeoff isn't called out in the branch's own documentation.

### B3. Email send timeout doesn't cancel the underlying HTTP call

**File**: `apps/student-console/src/lib/notifications/zepto-mailer.ts` — confirmed via diff that the timeout is implemented as:

```ts
Promise.race([client.sendMail(...), timeoutPromise(10_000)])
```

`Promise.race` only changes which promise the caller awaits — it does not abort the underlying HTTP request to ZeptoMail. If the send actually succeeds after the 10-second timeout fires, the calling code has already treated it as a failure. If any upstream caller retries on failure, this can result in duplicate emails being sent to a student.

### B4. Report-job stream-to-buffer adapter has no timeout

**File**: `apps/backend/src/features/reports/report-generators.ts`, `collectStreamToBuffer` — confirmed this new adapter resolves only on the wrapped stream's `'end'` event and rejects only on `'error'`, with no timeout. If the underlying `ExcelJS.stream.xlsx.WorkbookWriter.commit()` fails to emit either event on some unhandled error path, the async report-job queue entry will hang indefinitely with no way to detect or cancel it.

---

## Section C — Business-logic changes bundled into this "performance" branch

These are not latency/caching changes and need functional QA on their own merits, separate from validating the performance work. Listed because the user asked to confirm nothing will break — a regression here would not surface in a latency check.

### C1. Subject-selection validation rules changed

**Files**: `apps/student-console/src/features/subject-selection/components/subject-selection-form.tsx`, `apps/backend/.../student-subject-selection.service.ts` (path per commit `dc2234f0`/`21cf5485`)

Confirmed via diff: the sibling-subject overlap validation ("cannot pick the same subject twice") is now skipped when one meta is a `PRIOR_SELECTION` continuation of another (Minor 3/4 continuing Minor 1/2). CVAC subject options are now filtered through `excludesForMeta()`, where previously they were unfiltered. These are rule changes to what subject combinations are permitted, not caching or batching changes.

### C2. `Minor` notification field shape changed

**File**: `apps/notification-system/src/workers/email.worker.ts:409-436` — confirmed:

```ts
Minor: { I: "", II: "", III: "", IV: "", V: "" },   // "V" is new
...
} else if (fieldName.includes("Minor 3")) {
  // Minor 3 keeps its own slot so it never overwrites the Minor 2
  subjectsByCategory["Minor"]["V"] = subjectName;   // was writing to "III"
```

Previously, "Minor 3" and "Minor 2" both wrote into `Minor.III`, so one could silently overwrite the other. This is a genuine bug fix, but it changes the shape of `subjectsByCategory.Minor` (a new `V` key exists that didn't before) — any code or template consuming this object that assumes only `I`–`IV` exist should be checked.

### C3. Tailwind content glob fix can change styling anywhere under `features/**`, not just subject-selection

**File**: `apps/student-console/tailwind.config.ts` — confirmed via diff that `"./src/features/**/*.{js,ts,jsx,tsx,mdx}"` was added to the `content` array and was **not** present before.

Tailwind only compiles CSS for class names it can find via its configured `content` globs. Confirmed this glob was previously absent, meaning any Tailwind utility class used exclusively inside `src/features/**` anywhere in the application — not only in the subject-selection feature this branch touches — was never generated into the production CSS bundle before this change. Once this ships, any such previously-uncompiled class will suddenly render, which can visibly change any `features/*` page in the app, including ones this branch did not otherwise touch. This needs a visual regression pass across the app's `features/*` surface, not only the subject-selection pages that were intentionally modified.

---

## Section D — Deploy-operational note (not multi-instance-specific)

### D1. New index migration takes a write-blocking lock during index build

**File**: `apps/backend/drizzle/0196_library_perf_indexes.sql` — read in full.

Confirmed facts:

- Every statement is `CREATE INDEX IF NOT EXISTS`, wrapped in `to_regclass('public.<table>') IS NOT NULL` guards — the migration is additive, idempotent, and safe to re-run; it drops nothing and alters no existing column or row.
- The file's own comment states: _"plain CREATE INDEX takes a SHARE lock (blocks writes, not reads) for the build — seconds at this scale; CONCURRENTLY cannot run inside the migration transaction."_ This locking behavior (SHARE lock blocking writes on `book_circulation`, `copy_details`, `books`, `library_entry_exit` for the duration of the index build) is accurate for a plain `CREATE INDEX` in Postgres and was not modified from Postgres's documented behavior — this review did not independently measure build time against actual production row counts, so the "seconds" claim is the branch author's estimate, not something this review can confirm from the repository alone.
- Migration number `0195` is deliberately skipped; the comment states it is reserved by a `develop`-branch migration (`0195_service_requests`) to avoid a filename collision on merge-down. Confirmed no `0195_*.sql` exists in this branch.
- The migration also creates a trigram index on a `composedAccessNumber`-style expression. Confirmed by grep that `composedAccessNumber` does not exist anywhere in this branch's `book-circulation.service.ts` — this index is currently inert on both `main` and this branch, per the file's own comment, pending a future merge from `develop` that introduces the matching expression.

This is a deploy-sequencing consideration (affects all instances equally at migration time, not a per-instance/fleet-consistency issue) — listed for completeness since it's part of "will this break anything," not because it's multi-instance-specific.

---

## Resolutions applied (2026-08-19, post-review)

- **A1 — FIXED.** The in-process `notificationMasterRowCache` was removed; `getCachedNotificationMasterRow` now always reads fresh from the DB (an indexed, non-hot lookup). No per-process staleness remains — the branch now has zero non-Redis caches.
- **B1 — FIXED centrally.** `handleError` now checks `res.headersSent` first and, if a response has already started streaming, calls `res.destroy(err)` instead of `res.status().json()`. This covers all 7 streaming export controllers (and any future one) — a mid-stream failure now aborts the socket instead of throwing `ERR_HTTP_HEADERS_SENT` and shipping a silently-corrupt file.
- **B2 — NOT a bug (verified).** Both sub-queries and the outer query all `ORDER BY id DESC`, and each branch returns its own top-`N` by id. Any record excluded from a branch's top-`N` necessarily has `N` higher-id rows in that same branch already present in the union, so it could never belong to the true combined top-`N`-by-id. The result set is correct for the id-desc ordering the picker uses.
- **B3 — kept, accepted low-risk.** Verified no caller of the email path auto-retries (OTP/notification routes return the error; "resend" is a deliberate user action = a new send). The 10s `Promise.race` bounds a real hang; the theoretical duplicate needs an auto-retry that does not exist. Bounded-wait > unbounded-hang here.
- **B4 — accepted (minor).** The report-job stream-to-buffer adapter runs off the request path in the async job queue; a stuck job is visible/retryable in that system. Left as-is.
- **A3 / A4 — accepted tradeoffs, flagged for sign-off.** A3 (per-instance 60s reference-data cache in student-console) is a self-declared accepted staleness window on slow-changing admin master data. A4 (websocket-only transport) is the _correct_ fix for the multi-instance/no-sticky-sessions topology (long-polling splits handshakes across instances); the residual is that a client unable to upgrade to WS gets no realtime — acceptable for an internal console behind an ALB that passes WS.
- **C1 / C2 / C3 — already on current `main`.** These were flagged against the old merge-base; current `main` already contains them (merged earlier today), so they are not new changes this branch introduces.
- **D1 — migration renumbered 0195 and confirmed skip-safe.** `0196` → `0195` (main ends at 0194, no gap). `when = 1787138439000` exceeds main's watermark (1786701133486) and develop's highest stamp (1787118909043), so it applies on the main→prod deploy rather than being silently skipped. A future merge-down to develop still needs a renumber (develop owns `0195_service_requests`) — noted in the migration header.

**Merge status:** branch merges into current `main` with zero conflicts; backend / main-console / student-console all type-check clean. Awaiting owner confirmation before any merge or deploy.

---

## Checked and confirmed _not_ an issue

**`library-copy-details` report job key rename**: `apps/main-console/src/pages/library/LibraryReportsPage.tsx:168-169` renames the report picker entry to `id: "copy-details"`, `jobKey: "library-copy-details"`. `apps/backend/src/features/reports/report-generators.ts:465` independently renames the backend job registry key to `key: "library-copy-details"`. Both sides were read directly and agree on the string `library-copy-details` — this cross-service rename is coordinated correctly and does not break the report-generation flow.

---

## Caching-safety audit + fees/CU-reg latency (2026-08-19, later pass)

Full re-audit of every cache on the branch (19 caches inventoried) plus the two pages flagged slow.

### Stale-data bug found and FIXED — `rt:fee_mis` snapshot never invalidated on payments

- **Reader:** `getFeeMisDataCached` → `getCachedSnapshot("rt:fee_mis", …, 60s)` (`realtime-tracker.service.ts:1045`), used by both the HTTP controller and the socket push.
- **Bug:** on a real fee payment, `scheduleFeesDashboardBroadcast` fired `emitFeeMisRefresh` (raw `io.emit`, telling every Fee MIS viewer to refetch) but nothing bumped the `rt:fee_mis` epoch — only the legacy-import path ever did. So the refetch returned pre-payment paid/unpaid counts for up to 60s: a refresh that displays stale numbers.
- **Fix (`fees-dashboard.socket.ts`):** `bumpSnapshotEpoch("rt:fee_mis")` in the debounce callback BEFORE `emitFeeMisRefresh` (invalidate-before-broadcast, same pattern as `scheduleRealtimeTrackerBroadcast`). Commit `0bd2c38d7`.

### Remaining TTL-only caches (NEW on this branch) — user decision required

Both are epoch-cached but never bumped by a mutation, so they can show up to 30s-stale numbers where main showed none:

- `admissions:dashboard` (30s) — mutated by ~6 application-write services (scattered; no single choke point).
- `subject-selection:metrics-live` (30s) — mutated on subject-selection submit (choke point exists near `emitMisTableUpdates`).
  Author-documented as "acceptable" precedent, but this contradicts the "no stale data" bar — flagged for explicit go/no-go rather than silently accepted or silently changed.

### Low-severity (self-heals in ≤60s): library background schedulers

`library-fine-accrual`, `journal-issue-predictor`, `library-legacy-sync` write library data without bumping `library:dashboard`/`library:reports` epochs; Redis TTL still expires the entry within 60s, so staleness is bounded and self-healing. One-line bump per scheduler would close it.

### Verified SAFE (correct invalidation): library dashboard/reports (middleware bumps on every write), notifications, settings ETag, react-query staleTime additions (socket-invalidated), `canonicalScopeCache` (pre-existing), `notificationMastersCache` (immutable FK id only).

### Latency fixes (byte-identical output verified on live data)

- `program-courses/dtos` (fees-dashboard boot path): deduped per-distinct-id findById — ~200ms → ~15ms warm (22058-byte payload unchanged). Commit `f2dc9ed31`.
- CU-reg form pair: `subject-selections` findPromotion∥findHierarchy parallelized (~195–346 → ~115–296ms); `user profile` address-DTO loop parallelized (~215–311 → ~142–193ms). Payloads 54422/41362 bytes unchanged. Form waits on the slower of the two → ~350ms → ~190ms. Commit `28f657228`.
- Fees dashboard core aggregation left untouched: already `Promise.all` + 90s scope-cached (~160ms warm); rewriting its SQL pre-merge judged not worth the risk.
