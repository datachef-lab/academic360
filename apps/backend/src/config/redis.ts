import { createClient, type RedisClientType } from "redis";
import { RedisStore } from "connect-redis";
import { createLogger } from "@/config/logger.js";

const log = createLogger("redis");

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;
let sessionStore: RedisStore | null = null;
let connected = false;

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

function attachClientErrorHandlers(
  client: RedisClientType,
  label: string,
): void {
  client.on("error", (error: Error) => {
    log.error(`Redis ${label} client error`, { error });
  });
}

/**
 * Connect Redis before loading `app.ts` (sessions + Socket.IO adapter).
 * When REDIS_URL is unset, the app falls back to in-memory session and single-node sockets.
 */
export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    log.warn(
      "REDIS_URL is not set — using in-memory sessions and single-node Socket.IO",
    );
    return;
  }

  if (connected) return;

  pubClient = createClient({ url });
  subClient = pubClient.duplicate();

  attachClientErrorHandlers(pubClient, "pub");
  attachClientErrorHandlers(subClient, "sub");

  await Promise.all([pubClient.connect(), subClient.connect()]);

  sessionStore = new RedisStore({
    client: pubClient,
    prefix: process.env.REDIS_SESSION_PREFIX?.trim() || "sess:",
  });

  connected = true;
  log.info("Redis connected (sessions + Socket.IO adapter)");
}

export function getRedisPubSubClients(): {
  pubClient: RedisClientType;
  subClient: RedisClientType;
} | null {
  if (!pubClient || !subClient || !connected) return null;
  return { pubClient, subClient };
}

export function getRedisCommandClient(): RedisClientType | null {
  if (!pubClient || !connected) return null;
  return pubClient;
}

export function getSessionStore(): RedisStore | null {
  return sessionStore;
}

export function getRedisPubClient(): RedisClientType | null {
  return getRedisPubSubClients()?.pubClient ?? null;
}

export async function disconnectRedis(): Promise<void> {
  if (!connected) return;

  const closes: Promise<void>[] = [];
  if (subClient?.isOpen) closes.push(subClient.quit().then(() => undefined));
  if (pubClient?.isOpen) closes.push(pubClient.quit().then(() => undefined));

  await Promise.allSettled(closes);

  pubClient = null;
  subClient = null;
  sessionStore = null;
  connected = false;
  log.info("Redis disconnected");
}
