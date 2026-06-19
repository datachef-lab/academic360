import { enqueueNotification } from "@/services/notificationClient.js";

export type LibraryNotificationEvent =
  | "LIBRARY_ISSUE_CONFIRMED"
  | "LIBRARY_DUE_IN_3_DAYS"
  | "LIBRARY_OVERDUE"
  | "LIBRARY_RETURN_CONFIRMED"
  | "LIBRARY_REISSUE_CONFIRMED"
  | "LIBRARY_HOLD_READY"
  | "LIBRARY_FINE_CHARGED"
  | "LIBRARY_FINE_PAID"
  | "LIBRARY_ACCOUNT_SUSPENDED"
  | "LIBRARY_CLOSED_TODAY";

export type LibraryNotificationPayload = {
  event: LibraryNotificationEvent;
  userId: number;
  variables?: Record<string, string | number | null | undefined>;
};

export async function emitLibraryNotification(
  payload: LibraryNotificationPayload,
): Promise<void> {
  try {
    await enqueueNotification({
      event: payload.event,
      userId: payload.userId,
      variables: payload.variables ?? {},
    } as unknown as Parameters<typeof enqueueNotification>[0]);
  } catch (err) {
    console.error("Failed to enqueue library notification", err);
  }
}

export const LIBRARY_NOTIFICATION_TEMPLATES: Array<{
  event: LibraryNotificationEvent;
  description: string;
}> = [
  { event: "LIBRARY_ISSUE_CONFIRMED", description: "Book issued confirmation" },
  { event: "LIBRARY_DUE_IN_3_DAYS", description: "Due in 3 days reminder" },
  { event: "LIBRARY_OVERDUE", description: "Overdue notice" },
  { event: "LIBRARY_RETURN_CONFIRMED", description: "Return confirmation" },
  { event: "LIBRARY_REISSUE_CONFIRMED", description: "Re-issue confirmation" },
  { event: "LIBRARY_HOLD_READY", description: "Reserved copy ready" },
  { event: "LIBRARY_FINE_CHARGED", description: "Fine assessed" },
  { event: "LIBRARY_FINE_PAID", description: "Fine paid receipt" },
  { event: "LIBRARY_ACCOUNT_SUSPENDED", description: "Account suspended" },
  { event: "LIBRARY_CLOSED_TODAY", description: "Library closed today" },
];
