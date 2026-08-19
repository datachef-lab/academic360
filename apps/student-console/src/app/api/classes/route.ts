import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { findAllClasses } from "@/lib/services/class.service";
import { createTtlCache } from "@/lib/utils/ttl-cache";

// See @/lib/utils/ttl-cache for scope/limitations (60s, per-instance).
// No POST/PUT/DELETE handlers exist in this route, so there is nothing to
// invalidate the cache on - classes are managed elsewhere.
const listCache = createTtlCache<unknown>(60_000);

export async function GET() {
  try {
    const cached = listCache.get();
    if (cached) {
      return NextResponse.json(cached);
    }
    const classes = await findAllClasses();
    listCache.set(undefined, classes);
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
