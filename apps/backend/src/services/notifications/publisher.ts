import amqplib from "amqplib";

const EXCHANGE = "notifications";

export type NotificationChannel =
  | "notifications.email"
  | "notifications.whatsapp"
  | "notifications.push";

export interface NotificationRequested {
  notificationEventId: number;
  userId: number;
  templateKey?: string;
  params?: Record<string, any>;
  correlationId?: string;
}

export async function publishNotification(
  channel: NotificationChannel,
  payload: NotificationRequested,
) {
  const url = process.env.RABBITMQ_URL!;
  const conn = await amqplib.connect(url);
  const ch = await conn.createChannel();
  try {
    await ch.assertExchange(EXCHANGE, "topic", { durable: true });
    ch.publish(EXCHANGE, channel, Buffer.from(JSON.stringify(payload)), {
      contentType: "application/json",
      persistent: true,
      headers: { "x-correlation-id": payload.correlationId },
    });
  } finally {
    await ch.close();
    await conn.close();
  }
}
