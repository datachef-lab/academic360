import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, eq, gte, lte, sum } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { journalSubscriptionModel } from "@repo/db/schemas/models/library/journal-subscription.model.js";

export type LibraryReportPayload = {
  academicYear: string;
  totals: {
    titles: number;
    copies: number;
    journalSubscriptions: number;
  };
  circulation: {
    issuesInYear: number;
    finesCollectedInYear: number;
  };
  spend: {
    journalSubscriptionAnnualCost: number;
  };
};

const yearRange = (academicYear: string): { start: Date; end: Date } => {
  const [a, b] = academicYear.split("-");
  const startYear = Number(a);
  if (Number.isNaN(startYear))
    throw new ApiError(400, "Invalid year; use YYYY or YYYY-YY.");
  const endYear = b ? 2000 + Number(b) : startYear + 1;
  return {
    start: new Date(Date.UTC(startYear, 5, 1)),
    end: new Date(Date.UTC(endYear, 4, 31, 23, 59, 59)),
  };
};

export async function buildLibraryReport(
  academicYear: string,
): Promise<LibraryReportPayload> {
  if (!academicYear?.trim())
    throw new ApiError(400, "academicYear is required.");
  const { start, end } = yearRange(academicYear);

  const [titlesAgg] = await db.select({ c: count() }).from(bookModel);
  const [copiesAgg] = await db.select({ c: count() }).from(copyDetailsModel);
  const [subsAgg] = await db
    .select({ c: count() })
    .from(journalSubscriptionModel);
  const [issuesAgg] = await db
    .select({
      c: count(),
      fines: sum(bookCirculationModel.fineAmount).mapWith(Number),
    })
    .from(bookCirculationModel)
    .where(
      and(
        gte(bookCirculationModel.issueTimestamp, start),
        lte(bookCirculationModel.issueTimestamp, end),
      ),
    );
  const [spendAgg] = await db
    .select({
      annual: sum(journalSubscriptionModel.costPerYear).mapWith(Number),
    })
    .from(journalSubscriptionModel);

  return {
    academicYear: academicYear.trim(),
    totals: {
      titles: Number(titlesAgg?.c ?? 0),
      copies: Number(copiesAgg?.c ?? 0),
      journalSubscriptions: Number(subsAgg?.c ?? 0),
    },
    circulation: {
      issuesInYear: Number(issuesAgg?.c ?? 0),
      finesCollectedInYear: Number(issuesAgg?.fines ?? 0),
    },
    spend: {
      journalSubscriptionAnnualCost: Number(spendAgg?.annual ?? 0),
    },
  };
}

export function formatNaac(p: LibraryReportPayload) {
  return {
    framework: "NAAC",
    criterion: "4.2 - Library as Learning Resource",
    academicYear: p.academicYear,
    metrics: {
      "4.2.1 Library Automation": "Fully automated (ILMS)",
      "4.2.2 Total Books (titles)": p.totals.titles,
      "4.2.2 Total Volumes (copies)": p.totals.copies,
      "4.2.3 Total e-Journals / Subscriptions": p.totals.journalSubscriptions,
      "4.2.4 Annual Subscription Spend (INR)":
        p.spend.journalSubscriptionAnnualCost,
      "4.2.5 Usage - Issues in Year": p.circulation.issuesInYear,
      "4.2.5 Fines Collected (INR)": p.circulation.finesCollectedInYear,
    },
  };
}

export function formatNirf(p: LibraryReportPayload) {
  return {
    framework: "NIRF",
    academicYear: p.academicYear,
    libraryResources: {
      books: p.totals.titles,
      copies: p.totals.copies,
      eJournals: p.totals.journalSubscriptions,
      annualLibrarySpend: p.spend.journalSubscriptionAnnualCost,
      annualCirculation: p.circulation.issuesInYear,
    },
  };
}

export function formatAishe(p: LibraryReportPayload) {
  return {
    framework: "AISHE",
    academicYear: p.academicYear,
    library: {
      booksAvailable: p.totals.titles,
      volumesAvailable: p.totals.copies,
      journalsSubscribed: p.totals.journalSubscriptions,
      annualSubscriptionSpend: p.spend.journalSubscriptionAnnualCost,
    },
  };
}
