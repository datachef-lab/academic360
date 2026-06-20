/**
 * Controlled Digital Lending reader.
 *
 * Route: /dashboard/library/cdl/:bookId
 *
 * Calls POST /api/library/cdl/:bookId/sessions to start a session, then renders
 * the soft-copy PDF inside an iframe with a CSS overlay that watermarks every
 * visible page with the reader's name + UID + timestamp.
 *
 * On unmount or when the reader clicks "Close", POSTs to /sessions/:id/close so
 * the slot frees up for the next reader.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, X } from "lucide-react";
import {
  closeCdlSession,
  startCdlSession,
  type CdlSessionPayload,
} from "@/services/library-cdl.service";

const TICK_MS = 1000;

function fmtRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function CdlReaderPage() {
  const { bookId: bookIdStr } = useParams<{ bookId: string }>();
  const bookId = Number(bookIdStr);
  const navigate = useNavigate();
  const [session, setSession] = useState<CdlSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState<number>(0);
  const closedRef = useRef(false);

  const closeSession = useCallback(async () => {
    if (!session || closedRef.current) return;
    closedRef.current = true;
    try {
      await closeCdlSession(session.sessionId);
    } catch {
      // best-effort close
    }
  }, [session]);

  useEffect(() => {
    if (!bookId || Number.isNaN(bookId)) {
      toast.error("Invalid book.");
      navigate(-1);
      return;
    }
    (async () => {
      try {
        const res = await startCdlSession(bookId);
        const p = res.payload!;
        setSession(p);
        setRemaining(p.expiresInSeconds * 1000);
      } catch (e) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Could not start reading session.";
        toast.error(msg);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();

    // Close on tab unload too.
    const onBeforeUnload = () => {
      navigator.sendBeacon?.(`/api/library/cdl/sessions/${session?.sessionId}/close`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void closeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setRemaining((ms) => Math.max(0, ms - TICK_MS));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [session]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  const wmText = `${session.watermark.userName} · UID: ${
    session.watermark.uid ?? "—"
  } · ${new Date(session.watermark.timestamp).toLocaleString()}`;

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-slate-700">
          {session.title}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${remaining < 60_000 ? "text-rose-600" : "text-slate-500"}`}>
            {fmtRemaining(remaining)} left
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void closeSession().then(() => navigate(-1))}
          >
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {/* PDF viewer */}
        <iframe
          src={`${session.signedUrl}#toolbar=0&navpanes=0`}
          title={session.title}
          className="h-full w-full border-0"
        />

        {/* Watermark overlay — pointer-events: none so it doesn't block scrolling. */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-6 select-none opacity-25">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] text-slate-700 sm:text-xs"
              style={{ transform: "rotate(-30deg)" }}
            >
              {wmText}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
