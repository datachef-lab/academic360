import { getRedisCommandClient, isRedisEnabled } from "@/config/redis.js";

const REDIS_PREFIX = "pwdreset:";
const TTL_SECONDS = 15 * 60;

export type PasswordResetTokenRecord = {
  email: string;
  expiresAt: Date;
};

const memoryTokens = new Map<string, PasswordResetTokenRecord>();

function redisKey(token: string): string {
  return `${REDIS_PREFIX}${token}`;
}

export async function savePasswordResetToken(
  token: string,
  record: PasswordResetTokenRecord,
): Promise<void> {
  const redis = getRedisCommandClient();
  if (isRedisEnabled() && redis) {
    await redis.set(redisKey(token), JSON.stringify(record), {
      EX: TTL_SECONDS,
    });
    return;
  }
  memoryTokens.set(token, record);
}

export async function getPasswordResetToken(
  token: string,
): Promise<PasswordResetTokenRecord | null> {
  const redis = getRedisCommandClient();
  if (isRedisEnabled() && redis) {
    const raw = await redis.get(redisKey(token));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { email: string; expiresAt: string };
      return {
        email: parsed.email,
        expiresAt: new Date(parsed.expiresAt),
      };
    } catch {
      return null;
    }
  }

  return memoryTokens.get(token) ?? null;
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  const redis = getRedisCommandClient();
  if (isRedisEnabled() && redis) {
    await redis.del(redisKey(token));
    return;
  }
  memoryTokens.delete(token);
}

export async function cleanupExpiredPasswordResetTokens(): Promise<void> {
  if (isRedisEnabled()) return;

  const now = new Date();
  for (const [token, data] of memoryTokens.entries()) {
    if (now > data.expiresAt) {
      memoryTokens.delete(token);
    }
  }
}
