import fetch from "node-fetch";
import type { NotificationDto } from "@repo/db/dtos/notifications";

export async function enqueueNotification(dto: NotificationDto) {
  console.log("🚨 [notif-client] enqueueNotification function called!");
  const base =
    process.env.BACKEND_SELF_BASE ||
    `http://localhost:${process.env.NOTIFICATION_SYSTEM_PORT || 8080}`;
  const url = `${base}/api/notifications/enqueue`;
  // Debug log (safe summary only)
  console.log("[notif-client] enqueue ->", {
    url,
    userId: dto.userId,
    variant: dto.variant,
    type: dto.type,
    hasMasterId: Boolean(dto.notificationMasterId),
    contentLength: dto.content?.length || 0,
    bodyValuesLength: (dto.notificationEvent as any)?.bodyValues?.length || 0,
  });

  // Add stack trace to see where this is being called from
  console.log(
    "[notif-client] enqueue called from:",
    new Error().stack?.split("\n")[2]?.trim(),
  );
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  console.log("[notif-client] enqueue <-", res.status);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`enqueueNotification failed: ${res.status} ${text}`);
  }
  return res.json();
}
