import { NextResponse } from "next/server";
// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  createDegree,
  getAllDegrees,
  getDegreeById,
  updateDegree,
  toggleDegreeStatus,
} from "@/lib/services/degree.service";
import { createTtlCache } from "@/lib/utils/ttl-cache";

// See @/lib/utils/ttl-cache for scope/limitations (60s, per-instance).
// Note: /api/degrees/upload also writes degree rows via a bulk-import
// endpoint in a separate route module, so it cannot clear this cache
// instance directly - a bulk upload there can leave this list stale for up
// to the TTL. Left as-is since that route is out of scope for this change.
const listCache = createTtlCache<{ success: true; data: unknown }>(60_000);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await getDegreeById(parseInt(id));
      if (!result) {
        return NextResponse.json({ success: false, error: "Degree not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: result });
    }

    const cached = listCache.get();
    if (cached) {
      return NextResponse.json(cached);
    }
    const degrees = await getAllDegrees();
    const payload = { success: true as const, data: degrees };
    listCache.set(undefined, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in GET /api/degrees:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createDegree(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    listCache.clear();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/degrees:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const result = await updateDegree(parseInt(id), body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    listCache.clear();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/degrees:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const result = await toggleDegreeStatus(parseInt(id));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    listCache.clear();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PATCH /api/degrees:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
