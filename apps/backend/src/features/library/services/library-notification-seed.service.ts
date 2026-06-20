import { db } from "@/db/index.js";
import { eq, and } from "drizzle-orm";
import { notificationMasterModel } from "@repo/db/schemas/models/notifications/notification-master.model.js";
import { notificationEventModel } from "@repo/db/schemas/models/notifications/notification-event.model.js";

type SeedRow = {
  event: string;
  description: string;
  variant: "EMAIL" | "WHATSAPP" | "SMS" | "WEB";
  template: string;
};

const ROWS: SeedRow[] = [
  {
    event: "LIBRARY_ISSUE_CONFIRMED",
    description: "Book issued confirmation",
    variant: "EMAIL",
    template: "library/issue-confirmed.html",
  },
  {
    event: "LIBRARY_DUE_IN_3_DAYS",
    description: "Due in 3 days reminder",
    variant: "EMAIL",
    template: "library/due-in-3-days.html",
  },
  {
    event: "LIBRARY_OVERDUE",
    description: "Overdue notice",
    variant: "EMAIL",
    template: "library/overdue.html",
  },
  {
    event: "LIBRARY_RETURN_CONFIRMED",
    description: "Return confirmation",
    variant: "EMAIL",
    template: "library/return-confirmed.html",
  },
  {
    event: "LIBRARY_REISSUE_CONFIRMED",
    description: "Reissue confirmation",
    variant: "EMAIL",
    template: "library/reissue-confirmed.html",
  },
  {
    event: "LIBRARY_HOLD_READY",
    description: "Reserved copy ready",
    variant: "EMAIL",
    template: "library/hold-ready.html",
  },
  {
    event: "LIBRARY_FINE_CHARGED",
    description: "Fine assessed",
    variant: "EMAIL",
    template: "library/fine-charged.html",
  },
  {
    event: "LIBRARY_FINE_PAID",
    description: "Fine paid receipt",
    variant: "EMAIL",
    template: "library/fine-paid.html",
  },
  {
    event: "LIBRARY_ACCOUNT_SUSPENDED",
    description: "Account suspended",
    variant: "EMAIL",
    template: "library/account-suspended.html",
  },
  {
    event: "LIBRARY_CLOSED_TODAY",
    description: "Library closed today",
    variant: "EMAIL",
    template: "library/closed-today.html",
  },
];

export async function seedLibraryNotificationTemplates(): Promise<{
  inserted: number;
  skipped: number;
}> {
  let inserted = 0;
  let skipped = 0;

  for (const row of ROWS) {
    const [existingMaster] = await db
      .select({ id: notificationMasterModel.id })
      .from(notificationMasterModel)
      .where(eq(notificationMasterModel.template, row.template))
      .limit(1);

    let masterId = existingMaster?.id;
    if (!masterId) {
      const [m] = await db
        .insert(notificationMasterModel)
        .values({
          name: row.event,
          variant: row.variant,
          template: row.template,
          isActive: true,
        })
        .returning({ id: notificationMasterModel.id });
      masterId = m.id;
      inserted++;
    } else {
      skipped++;
    }

    const [existingEvent] = await db
      .select({ id: notificationEventModel.id })
      .from(notificationEventModel)
      .where(
        and(
          eq(notificationEventModel.name, row.event),
          eq(notificationEventModel.notificationMasterId, masterId),
        ),
      )
      .limit(1);
    if (!existingEvent) {
      await db.insert(notificationEventModel).values({
        name: row.event,
        description: row.description,
        notificationMasterId: masterId,
      });
    }
  }

  return { inserted, skipped };
}
