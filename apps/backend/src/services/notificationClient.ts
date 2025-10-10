import fetch from "node-fetch";

export type NotificationDto = {
  userId: number;
  applicationFormId?: number | null;
  variant: "EMAIL" | "WHATSAPP" | "WEB" | "SMS" | "IN_APP";
  type: string;
  message: string;
  notificationMasterId?: number;
  notificationEvent?: {
    id?: number;
    emailTemplate?: string | null;
    subject?: string | null;
    templateData?: Record<string, string>;
    meta?: { devOnly?: boolean };
  };
  content?: Array<{ whatsappFieldId: number; content: string }>; // one row per field
};

export async function enqueueNotification(dto: NotificationDto) {
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
  });
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
