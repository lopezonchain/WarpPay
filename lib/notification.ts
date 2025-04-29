import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { getRedis } from "./redis";

const notificationServiceKey =
  process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ?? "minikit";

function getUserNotificationDetailsKey(fid: number): string {
  return `${notificationServiceKey}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number,
): Promise<FrameNotificationDetails | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return await redis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid),
  );
}

export async function getAllUserNotificationDetails(): Promise<
  { fid: number; notificationDetails: FrameNotificationDetails }[]
> {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  const pattern = `${notificationServiceKey}:user:*`;
  const result: { fid: number; notificationDetails: FrameNotificationDetails }[] = [];

  // Use SCAN to iterate through keys matching the pattern
  let cursor = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(nextCursor);

    if (keys.length > 0) {
      const values = await redis.mget<FrameNotificationDetails[]>(...keys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          const fid = parseInt(key.split(":").pop() || "0", 10);
          result.push({ fid, notificationDetails: value });
        }
      });
    }
  } while (cursor !== 0);

  return result;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails,
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  await redis.del(getUserNotificationDetailsKey(fid));
}
