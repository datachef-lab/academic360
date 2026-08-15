# Library circulation policy + fines — manual smoke checklist

Branch: `feat/library-circulation-policy-enforcement`. Run against a locally
running backend + main-console after `drizzle-kit migrate` (migration 0193).
Automated coverage: `pnpm --filter backend verify:library-fines` (21 checks).

## Pre-req

- [ ] Migration applied: `library_fine_mappings`, `library_fine_settings` exist; `SELECT accrual_go_live_date FROM library_fine_settings` returns the deploy moment.
- [ ] Item categories backfilled: `SELECT count(*) FROM books WHERE item_category_id_fk IS NOT NULL` ≈ 18.5k locally.
- [ ] Set a non-zero rate for testing in Main-console → Library → Circulation Policies (e.g. Student × Textbook: ₹2/day, grace 3) — remember rates ship as 0 by design until the librarian configures them.

## Issue

- [ ] Book Circulation → pick a **student** → add a Textbook copy: staged row shows the policy line ("14d loan · 2 renewals · ₹2/day after 3d grace") and the due date prefills issue + 14 days (not +7).
- [ ] Pick a **staff** user → same book: due date prefills +21 days (staff policy, proves the patron-code fix).
- [ ] Add the same copy for a second user while it is still out → Save → dialog "Policy check failed … already issued". Cancel.
- [ ] Issue books past the copy cap → Save → cap rejection → "Force issue" → saves, row carries forced flag.
- [ ] Try a copy whose `issue_type` is "Not to be issued" → rejected even via Force issue.

## Reissue

- [ ] Re-issue (date change) works up to the policy's renewal limit; the next attempt is rejected with "Renewal limit reached (N)".

## Fines

- [ ] Create an overdue loan (issue date backdated, due date in the past, after go-live). Restart backend or wait for the nightly tick → fine appears on the row (₹rate × late days beyond grace); `library_fine_mappings` has the row.
- [ ] Run the sweep twice (restart twice) → fine unchanged (no double fine).
- [ ] A book overdue since **before** go-live shows fine counted only from go-live.
- [ ] Return a late book at the desk → fine finalizes at return; Pay Fine / Cash / Waive buttons enable.

## Collection

- [ ] **Waive**: partial waiver reduces net fine; reason stored; waiver blocked after payment.
- [ ] **Cash**: records a SUCCESS CASH payment (manual entry, recordedBy = logged-in staff), net fine goes to 0, second attempt → "already has a payment".
- [ ] **Pay Fine (online)**: with Paytm configured, opens hosted checkout in a new tab; without it, falls back to order-id toast and the manual settle endpoint still works.

## Regression

- [ ] Existing preview/list/Excel still render (fine column reads the mirrored amount).
- [ ] Student-console library page unaffected.
- [ ] `pnpm exec turbo build --filter=backend --filter=main-console` green.
