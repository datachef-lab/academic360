/**
 * Small pill at the top of the library dashboard describing the delta-sync
 * scheduler. Reads `/api/library/dashboard/sync-status` (state is DB-backed
 * so this is correct on any instance behind the load balancer). Auto-refreshes
 * on the `library:sync-status:updated` socket event via `useLibraryRealtime`.
 *
 * When a tick is running: shows a live elapsed timer + expected total
 *   (from the last tick's duration).
 * When idle: shows "Last synced N min ago · Next sync in ~M min".
 * After the tick lands: adds a short summary of what changed.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { getLibrarySyncStatus, type LibrarySyncStatus } from "@/services/library-dashboard.service";

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const totalMin = Math.floor(s / 60);
  const restSec = s % 60;
  if (totalMin < 60) {
    return restSec === 0 ? `${totalMin}m` : `${totalMin}m ${restSec}s`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function humaniseAgo(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function humaniseCountdown(iso: string | null): string {
  if (!iso) return "";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "any moment";
  const mins = Math.ceil(diffMs / 60_000);
  if (mins <= 1) return "under a minute";
  return `~${mins} min`;
}

/**
 * Tick a Date.now() counter every second while `running` so the elapsed
 * time in the banner updates smoothly. Frozen when idle to avoid needless
 * re-renders.
 */
function useElapsedTicker(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

export function LibrarySyncBanner() {
  const { data, isLoading } = useQuery<LibrarySyncStatus | null | undefined>({
    queryKey: ["library-sync-status"],
    queryFn: getLibrarySyncStatus,
    staleTime: 30_000,
    // Fallback poll — socket event is the primary refresh signal
    // (useLibraryRealtime on the dashboard invalidates this key on
    // `library:sync-status:updated`), but if the socket drops we still want
    // the pill to catch up.
    refetchInterval: 60_000,
  });

  const running = data?.running === true;
  const now = useElapsedTicker(running);

  if (isLoading && !data) return null;
  if (!data) return null;

  const {
    startedAt,
    lastDurationMs,
    plannedRows,
    processedRows,
    lastSyncedAt,
    nextSyncAt,
    lastTickSummary,
  } = data;

  let label: string;
  if (running) {
    const elapsedMs = startedAt ? Math.max(0, now - new Date(startedAt).getTime()) : 0;
    const elapsedLabel = formatDuration(elapsedMs);

    // Two independent sources for a "remaining" estimate:
    //   1. Live progress   — elapsed × (planned - processed) / processed.
    //      Available from the first row processed, no history needed.
    //   2. Historical tick — subtract elapsed from the last tick's total
    //      duration. Only meaningful once a prior tick has finished.
    // Prefer live when planning + processing are populated (it's derived
    // from THIS tick's actual pace, not last week's).
    const historicalExpected =
      lastDurationMs && lastDurationMs > 0 ? formatDuration(lastDurationMs) : null;

    // Show a "remaining" number that ALWAYS shrinks over time, even before
    // we've recorded a real completed tick. The raw formula
    // `elapsed × (planned - processed) / processed` is extrapolated from
    // the overall pace so far, and the tick alternates between fast-
    // processing phases and multi-minute silent remote-fetch phases — during
    // a fetch the pace collapses and the raw extrapolation blows up
    // (users saw 2h+ ETAs that were pure math artefact). We defend the
    // number by clamping it against a ceiling that shrinks with elapsed:
    //   - When we have a real prior tick duration: clamp to (lastDurationMs - elapsed)
    //   - When we don't: clamp to (FIRST_TICK_CEILING - elapsed)
    // Either way, `remainingMs` is monotonically bounded above by a
    // shrinking value, so the displayed number can never grow unboundedly.
    // 45 min is a reasonable heuristic for a sync tick's upper bound on
    // develop / prod (individual big tables can take 15-30 min end-to-end).
    const FIRST_TICK_CEILING_MS = 45 * 60_000;
    let liveRemainingLabel: string | null = null;
    let livePercent: number | null = null;
    if (plannedRows && plannedRows > 0 && processedRows != null) {
      livePercent = Math.min(100, Math.round((processedRows / plannedRows) * 100));
      if (processedRows > 0) {
        const rate = processedRows / Math.max(1, elapsedMs); // rows per ms
        const rawRemaining = Math.max(0, (plannedRows - processedRows) / rate);
        const ceilingMs =
          lastDurationMs && lastDurationMs > 0 ? lastDurationMs : FIRST_TICK_CEILING_MS;
        const ceilingRemaining = Math.max(0, ceilingMs - elapsedMs);
        const remainingMs = Math.min(rawRemaining, ceilingRemaining);
        liveRemainingLabel =
          remainingMs > 0 ? `~${formatDuration(remainingMs)} remaining` : "wrapping up…";
      }
    }

    const parts = ["Syncing with old library system", `Elapsed ${elapsedLabel}`];
    if (livePercent != null) {
      parts.push(`${livePercent}% processed`);
    }
    if (liveRemainingLabel) {
      parts.push(liveRemainingLabel);
    } else if (historicalExpected) {
      // Fall back to the last tick's total when live progress isn't
      // available yet (planning phase, or a tick that hasn't scanned a
      // single row yet).
      const remainingMs = Math.max(0, (lastDurationMs ?? 0) - elapsedMs);
      parts.push(
        remainingMs > 0
          ? `usually takes ~${historicalExpected}, ~${formatDuration(remainingMs)} left`
          : `wrapping up (usually ~${historicalExpected})`,
      );
    } else {
      // No planning data AND no prior tick history. This is the very first
      // tick after a fresh install — we genuinely don't have anything to
      // base an ETA on. Give the operator a realistic range so they know
      // roughly what to expect (a fresh IRP sync walks ~200k rows and
      // usually finishes in 15–45 min).
      parts.push("first sync usually takes 15–45 min");
    }
    label = parts.join(" · ");
  } else if (lastSyncedAt) {
    label = `Auto-syncing with old library system · Last synced ${humaniseAgo(lastSyncedAt)} · Next sync in ${humaniseCountdown(nextSyncAt)}`;
  } else {
    label = "Auto-syncing with old library system · Waiting for first sync";
  }

  const summary =
    !running && lastSyncedAt && lastTickSummary.tables > 0
      ? ` · Last tick: ${lastTickSummary.rowsUpdated.toLocaleString()} rows updated, ${lastTickSummary.rowsRemoved.toLocaleString()} removed across ${lastTickSummary.tables} tables in ${formatDuration(lastDurationMs ?? 0)}`
      : "";

  return (
    <div
      className={`mx-4 mb-2 mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] ${
        running
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
      role="status"
      aria-live="polite"
    >
      {running ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-sky-700" />
      ) : (
        <RefreshCw className="h-3 w-3 shrink-0 text-slate-500" />
      )}
      <span className="flex-1">
        {label}
        <span className="text-slate-500">{summary}</span>
      </span>
    </div>
  );
}
