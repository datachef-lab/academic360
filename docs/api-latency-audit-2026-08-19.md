# Backend-wide API Latency Audit — 2026-08-19

Goal (per Harsh): **every API — including PDF/Excel downloads and generation — responds in milliseconds.**
Method: full route inventory (crawler following barrel re-exports and nested mounts) → **1,247 live routes (583 GET) across 59 routers** — plus the student-console's own 56 Next.js BFF routes; live timing of ~150 endpoints against a local prod-copy DB; five parallel code-tracing audits (subject-selection, CU-registration, exports/PDF, remaining backend families, student-console BFF). Debug first — this document records findings and the fix plan; **no fixes implemented yet**.

Raw data: `route-inventory.json`, `timing-pass1.json`, `timing-generation.json`, `timing-ss-cureg.json` (session scratchpad).

---

## 1. Measured results (local prod-copy; prod adds network + concurrency)

### Tier 0 — crashes / wedges the process
| Endpoint | Measured | Root cause |
|---|---|---|
| `GET /api/library/entry-exit/download` | >120s → **OOM killed the process** | NO row cap (65,870 rows) + `Promise.all` firing one preview-query-chain **per row** (≈65k concurrent queries) + full in-memory ExcelJS workbook |
| `GET /api/library/copy-details/download` | >120s → OOM | `.limit(100_000)` vs 100,332 live rows (cap saturated) + in-memory workbook + per-cell border-object allocation |
| `GET /api/library/book-circulation/download` | >120s → OOM | 48k rows × 4-table join, same in-memory pattern |
| `GET /api/library/books/download` | >120s → OOM | 23k rows, same pattern |
| `GET /api/idcard/reports/excel`, `GET /api/library/journals/download` | >120s / 90s | **collateral**: small datasets (≤880/121 rows) OOM'd because all exports share one V8 heap |
| `GET /api/v1/fees/student-mappings` | ≥45s, **starves every other request** | loads all ~48k mappings then unbounded `Promise.all(modelToDto)` — ~6 queries/row ⇒ ~290k queries/request. Frontend hook exists but is currently unused (live landmine) |
| `GET /api/users/export/students` | 150s+ (timed out) | serial N+1: `for` loop awaiting `getCompleteStudentData` per student × 14,527. No console caller — dead route, live landmine |

### Tier 1 — seconds; console-hot paths
| Endpoint | Measured | Root cause |
|---|---|---|
| `GET /api/subject-selection/student-subject-selection/meta/:studentId` | **8.9s** | runs the whole `findSubjectsSelections` pipeline **twice** per request |
| `GET /api/subject-selection/students/:id/selections` (both consoles' form loader) | **5.1s** | `findSubjectsSelections`: 13 sequential hierarchy lookups + nested `for` loops awaiting `paperService.modelToDetailedDto` (9 sequential queries per paper) ⇒ 200–400 sequential round trips |
| `GET /api/subject-selection/dynamic-subjects/:id` (student-console) | **4.8s** | same pipeline, once |
| `GET /api/academics/career-progression-forms/export` | 16.9s | whole-cohort export, in-memory Excel |
| `GET /api/library/dashboard/consistency-check` | 15.9s | ~25 COUNT(*) pairs incl. remote legacy-MySQL + 9 orphan scans; no console caller (ops-only) |
| `GET /api/notifications-console/export` | 4.5s | capped at 10k rows but in-memory workbook |
| Subject-selection **save** (POST) | blocks seconds | awaits `emitMisTableUpdates` → **uncached** whole-student-body affiliation aggregation (cached wrapper exists and is unused here) + debug `SELECT * FROM subject_selection_meta` with no WHERE |
| CU-reg **PUT/declarations/submit-with-documents** (student submit) | blocks seconds | transaction → PDF gen+S3 → **2 sequential** notification HTTP calls → **uncached** MIS aggregation → 4-query modelToDto; file loop strictly sequential (up to 10 files) |
| CU-reg `PATCH mark-physical-done` (front-desk click) | blocks seconds | same uncached MIS aggregation per click |
| CU-reg bulk zips `download{,-pdfs,-documents}/:year/:regulationType` | minutes + OOM class | sequential S3 GET per file, full JSZip in memory, **unpaginated ListObjectsV2 silently truncates >1000 files**, combined handler calls `res.send()` twice (bug) |
| `GET /api/user-statuses/student/:id{,/promotions}` (Overview tab) | RTT-bound | up to **7 sequential queries per promotion**, no batching, no Promise.all |

### Tier 2 — sub-second today, degrading by design
| Endpoint | Measured | Root cause |
|---|---|---|
| `GET /api/notifications-console/dashboard` | 0.95s | 14 joined aggregate queries over `notifications` (~158k rows) — **zero non-PK indexes on the table**; no caching |
| `GET /api/subject-selection/metas` | 0.56s | no LIMIT + 5-query fan-out per meta |
| `GET /api/library/reports/*` (batch-usage/holdings/footfall/stock) | 0.3–0.6s | full-scan aggregates, no cache (library dashboard stats now cached by the perf hotfix) |
| CU-reg list endpoints | n/a locally (schema drift) | `modelToDto` = 4 queries/row ⇒ up to 400 queries at limit=100; `student-uid` lookup uses unindexable double `ilike` |
| `GET /api/admissions/dashboard` | 0.20s | 17 aggregate queries per call, no caching (spine indexed — safe for now) |
| `GET /api/subject-selection/restricted-grouping-mains` (both consoles) | fast today | no LIMIT + ~3 queries/row fan-out — grows with config |
| `GET /api/users?type=STUDENT&pageSize=100` | not blind-fired | student `modelToDto` fans out 20–40+ queries/row ⇒ thousands per page |
| CU-reg `export` | n/a | one **unscoped full-table mailing-address query** regardless of filters |
| ~95 other parameterless GETs | ≤0.2s | acceptable — many already improved by the perf-hotfix indexes |

### Student-console BFF (its own Next.js API — 56 routes; not proxies: direct MySQL/Postgres/FS)
| Endpoint | Root cause |
|---|---|
| `GET /api/admissions/[year]` | 12+ **sequential** round trips (7 un-parallelized counts in stats + list with 4 correlated subqueries/row) |
| `GET /api/docs` | hardcoded `sleep(100ms)` every request + sequential FS walk + full-buffer file reads, no size cap |
| `GET /api/download` | full-buffer read, no streaming/size cap, weak path validation |
| `GET /api/batches` | N+1 count query per batch in a loop |
| `POST /api/otp/generate`, `/api/notifications` | synchronously await external email/WhatsApp APIs, no timeout |
| 13 reference-data GETs (categories, religions, nationalities…) | zero caching on static lookup data |
| Also found (not latency): string-interpolated SQL (injection surface) in batch/library/exam/nationality/student services; several broken/stubbed routes; 6 frontend-called routes that don't exist (404s) |

---

## 2. The five recurring root-cause patterns

1. **Per-row `modelToDto` N+1** — the single most common defect: fees student-mappings (~6 q/row), fees category-promotion-mappings (identical twin), CU-reg (4 q/row), subject-selection (8 q/row), users→student (20–40 q/row), document-uploads (1 q/row). Correct in-repo counter-pattern to copy: `fee-structure.service.ts getAllFeeStructures` (collect ids → bulk `inArray` fetches → Map).
2. **Sequential awaits for independent lookups** — user-statuses overview (7/promotion), `findPromotionByStudentId` + `findHierarchy` (13 combined), paper `modelToDetailedDto` (9), BFF admissions stats (7 counts), CU-reg submit loops.
3. **In-memory file generation with no caps/streaming** — ExcelJS `writeBuffer` everywhere (streaming `WorkbookWriter` unused repo-wide), JSZip full-buffer zips; job queue exists (`report_jobs`, 24 generators, Postgres bytea, multi-instance-safe) and the library job descriptors already have caps + batched joins + event-loop yields — **but the entity-page Download buttons still call the legacy sync routes**. Best-in-repo streaming pattern: admit-card zip (`exam-schedule.controller.ts:673-730`, archiver piped to res).
4. **Uncached whole-table aggregations on hot/mutation paths** — MIS/affiliation aggregation called uncached from subject-selection saves, CU-reg mark-done/final-submit, metrics/table (the cached wrapper from the perf hotfix exists in the same file); notifications dashboard; admissions dashboard; BFF reference data.
5. **Missing indexes** — `notifications` (~158k rows): zero non-PK indexes despite status/variant/userId/masterId/createdAt being filtered/joined everywhere; `notification_queue` likewise (worker polls it).

Route hygiene: `app.ts` mounts several routers twice (users, cu-reg, subject-selection); debug endpoints live in prod routers (`/debug/minor3-conditions`); many unused-but-live heavy routes.

---

## 3. Fix plan (phased; each phase independently shippable; nothing merged without Harsh's word)

### Phase 1 — extinguish the crashers (backend)
1. Point the five library entity-page Download buttons at the **already-built job-queue descriptors** (`report-generators.ts`: library-holdings / copy-details / book-circulation / entry-exit); add a journals descriptor; retire/410 the legacy sync `/download` routes. (Removes the OOM class with almost no new code.)
2. `GET /api/v1/fees/student-mappings` + `fee-category-promotion-mappings`: mandatory pagination + batched `inArray` DTO assembly (copy the fee-structure pattern). Same rewrite for `GET /api/users` student enrichment.
3. Disable or job-queue `GET /api/users/export/students` (dead route, serial N+1) and `career-progression-forms/export`; cap `cu-registration-correction-requests/export` and fix its unscoped mailing-address query.
4. CU-reg bulk zips: paginate ListObjectsV2 (fixes silent truncation), parallelize S3 GETs with bounded concurrency, stream via archiver (copy admit-card pattern), remove the double `res.send()`; keep job-queued.

### Phase 2 — make the student-facing seconds into ms
5. `findSubjectsSelections` rewrite: batch all papers' components/topics/subject/affiliation/etc. via `inArray` joins (kills the 9-query-per-paper loop); `Promise.all` the hierarchy lookups; result: `/students/:id/selections`, `/dynamic-subjects/:id` → tens of ms. De-duplicate the double call in `/meta/:studentId`.
6. Subject-selection saves + CU-reg mark-done/final-submit: swap `getMisTableData`→ the **cached** affiliation wrapper, and fire `emitMisTableUpdates` after the response (setImmediate), never blocking the user. Remove the debug full-table meta SELECT on the save path.
7. CU-reg submit: parallelize the per-file loop (bounded concurrency), run PDF + notifications post-response (or via job) with status surfaced over the existing socket channel; parallelize the two notification sends; cache `notification_masters` lookups (existing `notificationMastersCache`).
8. `modelToDto` batch rewrites for CU-reg + subject-selection list/active/history endpoints (bounded but chatty).
9. user-statuses overview: single batched query set (`inArray` + Promise.all).

### Phase 3 — indexes + caching (uses the perf-hotfix snapshot cache)
10. Migration: indexes on `notifications(status, variant, user_id_fk, notification_master_id_fk, created_at)` + `notification_queue(notification_id_fk, is_processing partial)`; review `payments(fee_student_mapping_id_fk, is_linked)` for the fees DTO path.
11. `getCachedSnapshot` wrappers (epoch-invalidated, already proven): notifications-console dashboard, admissions dashboard, metrics/live, library operational/analytics reports; consistency-check → 10-min TTL or on-demand-only.
12. Trigram index for CU-reg `student-uid` `ilike` lookup (or exact-match fast path first).

### Phase 4 — student-console BFF
13. Remove the 100ms sleep in `/api/docs`; stream file responses with size caps; parallelize FS walks.
14. Parallelize `admissions/[year]` counts (one `Promise.all` or one grouped query); fix `/api/batches` N+1.
15. `revalidate`/in-memory cache for the 13 reference-data routes; timeouts (AbortController) on OTP/notification external calls.
16. Separately (correctness, not latency): parameterize the string-interpolated MySQL queries; delete or implement the stubbed/broken routes; add the 6 missing upload/download routes or remove their frontend buttons.

### Phase 5 — hygiene
17. De-duplicate double router mounts in `app.ts`; remove debug routes from prod routers; decide fate of unused heavy routes (meta/:studentId, metrics/live, history/audit endpoints) — bound or delete.

### What "ms" honestly means for generation endpoints
Query-backed APIs (everything in Tiers 1–2) genuinely reach milliseconds via the fixes above. Multi-thousand-row Excel/PDF/zip generation cannot compute in ms — the ms-goal is met by the job pattern the repo already has: the *request* returns in ms (job started / cached artifact URL), generation happens off the request path with progress over sockets, and repeat downloads are served from the stored artifact instantly.

---

## 4. Verification approach (per phase)
- Re-run the timing harness (same scripts) after each phase; publish before/after per endpoint.
- For every rewritten query: `EXPLAIN (ANALYZE)` before/after on the prod-copy.
- Crash-class endpoints: heap profiling under `--max-old-space-size` matching prod containers; confirm exports complete under cap with stable RSS.
- No behavior changes to payload shapes (DTO-compatible batch rewrites), verified by response-diffing old vs new on sample data.
