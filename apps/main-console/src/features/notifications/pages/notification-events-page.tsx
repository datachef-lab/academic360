import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Search,
  Loader2,
  Plus,
  Upload,
  Download,
  Send,
  Trash2,
  Users,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import MultiSelectDropdown from "@/components/ui/MultiSelect";
import axiosInstance from "@/utils/api";
import { useAppSelector } from "@/store/hooks";
import {
  selectAvailableAcademicYears,
  selectCurrentAcademicYear,
} from "@/store/slices/academicYearSlice";
import { getAllClasses } from "@/services/classes.service";
import { getAllShifts, getAllSections } from "@/services/academic";
import { getAllReligions } from "@/services/religion.service";
import { getActiveCategories } from "@/services/categories.service";
import {
  getAffiliations,
  getProgramCourseDtos,
  getRegulationTypes,
  getStreams,
} from "@/services/course-design.api";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import { VariantBadge } from "@/features/notifications/components/badges";
import { VerifyOtpPanel } from "@/features/notifications/components/verify-otp-dialog";
import {
  listNotificationEvents,
  getNotificationEvent,
  createNotificationEvent,
  deleteNotificationEvent,
  downloadMasterTemplate,
  downloadEventFailed,
  parseEventRecipients,
  resolveScopePreview,
  triggerNotificationEvent,
  resendEventFailed,
  getEventStatus,
  getEventRecipientsList,
  getEventSendPreview,
  listNotificationMasters,
  startEventSendOtp,
  verifyEventSendOtp,
  type NotificationEventRow,
  type NotificationMasterRow,
  type EventScope,
  type EventParseResult,
  type EventRecipientRow,
  type EventSendPreview,
} from "@/features/notifications/api/notifications-api";

type Ref = { id: number; name: string };
const named = (rows: unknown): Ref[] =>
  (Array.isArray(rows) ? (rows as { id?: number | null; name?: string | null }[]) : [])
    .filter((r) => r?.id != null && r?.name)
    .map((r) => ({ id: Number(r.id), name: String(r.name) }));

const opts = (rows: Ref[]) => rows.map((r) => ({ label: r.name, value: String(r.id) }));
const GENDERS = ["MALE", "FEMALE", "OTHER"];

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "border-gray-300 bg-gray-100 text-gray-600",
  READY: "border-amber-300 bg-amber-100 text-amber-700",
  TRIGGERED: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

const RECIPIENT_STATUS_STYLE: Record<string, string> = {
  SENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const PAGE_SIZE = 20;
const POLL_TICK_CAP = 40; // ~2 min of 3s polls, then stop

type StatusCounts = { total: number; sent: number; pending: number; failed: number };

type RefData = {
  masters: NotificationMasterRow[];
  programCourses: ProgramCourseDto[];
  affiliations: Ref[];
  regulations: Ref[];
  streams: Ref[];
  classes: Ref[];
  shifts: Ref[];
  sections: Ref[];
  religions: Ref[];
  categories: Ref[];
  quotaTypes: Ref[];
  academicYears: Ref[];
  currentAcademicYearId: number | null;
};

/** Colored total/sent/pending/failed tiles. */
function StatCards({ s }: { s: StatusCounts }) {
  const tiles = [
    { k: "Total", v: s.total, cls: "border-slate-200 bg-slate-50 text-slate-800" },
    { k: "Sent", v: s.sent, cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { k: "Pending", v: s.pending, cls: "border-amber-200 bg-amber-50 text-amber-700" },
    { k: "Failed", v: s.failed, cls: "border-rose-200 bg-rose-50 text-rose-700" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {tiles.map((t) => (
        <div key={t.k} className={`rounded-md border p-2 text-center ${t.cls}`}>
          <div className="text-lg font-bold">{t.v}</div>
          <div className="text-[11px] font-medium uppercase opacity-70">{t.k}</div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationEventsPage() {
  const academicYears = useAppSelector(selectAvailableAcademicYears);
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);

  const [rows, setRows] = useState<NotificationEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [masters, setMasters] = useState<NotificationMasterRow[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseDto[]>([]);
  const [affiliations, setAffiliations] = useState<Ref[]>([]);
  const [regulations, setRegulations] = useState<Ref[]>([]);
  const [streams, setStreams] = useState<Ref[]>([]);
  const [classes, setClasses] = useState<Ref[]>([]);
  const [shifts, setShifts] = useState<Ref[]>([]);
  const [sections, setSections] = useState<Ref[]>([]);
  const [religions, setReligions] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [quotaTypes, setQuotaTypes] = useState<Ref[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [manage, setManage] = useState<NotificationEventRow | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotificationEvents({ page, limit: PAGE_SIZE, search });
      setRows(res.rows);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    listNotificationMasters()
      .then(setMasters)
      .catch(() => undefined);
    Promise.all([
      getProgramCourseDtos(),
      getAffiliations(),
      getRegulationTypes(),
      getStreams(),
      getAllClasses(),
      getAllShifts(),
      getAllSections(),
      getAllReligions(),
      getActiveCategories(),
      axiosInstance.get("/api/admission-quota-types").then((r) => r.data?.payload ?? r.data),
    ])
      .then(([pc, aff, reg, str, cls, shf, sec, rel, cat, qt]) => {
        setProgramCourses(Array.isArray(pc) ? pc : []);
        setAffiliations(named(aff));
        setRegulations(named(reg));
        setStreams(named(str));
        setClasses(named(cls));
        setShifts(named(shf));
        setSections(named(sec));
        setReligions(named(rel));
        setCategories(named(cat));
        setQuotaTypes(named(qt));
      })
      .catch(() => undefined);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const refData: RefData = {
    masters,
    programCourses,
    affiliations,
    regulations,
    streams,
    classes,
    shifts,
    sections,
    religions,
    categories,
    quotaTypes,
    academicYears: academicYears.map((y) => ({ id: Number(y.id), name: y.year })),
    currentAcademicYearId: currentAcademicYear?.id != null ? Number(currentAcademicYear.id) : null,
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start gap-4 rounded-md border bg-background p-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <CalendarClock className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
                <span className="truncate">Notification Events</span>
              </CardTitle>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Scoped bulk campaigns — pick a template, stage the recipient data, verify and send.
              </div>
            </div>
            <Button
              className="flex-shrink-0 bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create event
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="mb-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
              className="relative w-64"
            >
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search events..."
                className="pl-8"
              />
            </form>
          </div>

          <div className="overflow-hidden rounded-md border">
            <div className="max-h-[65vh] overflow-auto">
              <table className="w-full text-sm [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50 [&_th]:shadow-[inset_0_-1px_0_#e5e7eb]">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="w-14 px-4 py-3">Sr No</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Event name</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="w-20 px-4 py-3 text-center">Total</th>
                    <th className="w-20 px-4 py-3 text-center">Sent</th>
                    <th className="w-20 px-4 py-3 text-center">Failed</th>
                    <th className="w-24 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-gray-200/70" />
                        </td>
                      </tr>
                    ))
                  ) : rows.length > 0 ? (
                    rows.map((ev, i) => (
                      <tr key={ev.id} className="border-b last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-center text-gray-600">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {ev.masterName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{ev.name}</td>
                        <td className="px-4 py-3">
                          {ev.variant ? <VariantBadge variant={ev.variant} /> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              STATUS_STYLE[ev.status] ?? STATUS_STYLE.DRAFT
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{ev.total}</td>
                        <td className="px-4 py-3 text-center font-medium text-emerald-700">
                          {ev.sent}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-rose-700">
                          {ev.failed}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setManage(ev)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                        No events yet — create your first campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {total.toLocaleString("en-IN")} events
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {createOpen && (
        <EventWizard
          refData={refData}
          onClose={(changed) => {
            setCreateOpen(false);
            if (changed) void fetchList();
          }}
        />
      )}

      {manage && (
        <EventWizard
          refData={refData}
          existing={manage}
          onClose={(changed) => {
            setManage(null);
            if (changed) void fetchList();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unified wizard — 4 steps. Create = editable; Manage = read-only (same UI),
// then verification, then the live send/status step.
// ---------------------------------------------------------------------------

const WIZARD_STEPS = ["Event", "Data", "Verification", "Send"] as const;

function StepHeader({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {WIZARD_STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "active" : "todo";
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                state === "done"
                  ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                  : state === "active"
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-gray-300 bg-gray-50 text-gray-400"
              }`}
            >
              {state === "done" ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span
              className={`text-xs font-medium ${
                state === "active" ? "text-violet-700" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {n < WIZARD_STEPS.length && <div className="h-px w-8 bg-gray-300 sm:w-14" />}
          </div>
        );
      })}
    </div>
  );
}

function EventWizard({
  refData,
  existing,
  onClose,
}: {
  refData: RefData;
  existing?: NotificationEventRow;
  onClose: (changed: boolean) => void;
}) {
  const manage = !!existing;
  const triggered = existing?.status === "TRIGGERED";

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);

  // ---- Step 1 (create-editable / manage-readonly) ----
  const [name, setName] = useState(existing?.name ?? "");
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");
  const [masterId, setMasterId] = useState<string>(
    existing?.masterId ? String(existing.masterId) : "",
  );
  const [mode, setMode] = useState(existing?.dataSourceMode ?? "UPLOAD");
  const [academicYearId, setAcademicYearId] = useState<string>(
    refData.currentAcademicYearId ? String(refData.currentAcademicYearId) : "",
  );
  const manualMasters = refData.masters.filter((m) => !m.isSystemTriggered);
  const master = refData.masters.find((m) => String(m.id) === masterId) ?? null;

  // ---- Step 2 create (upload) ----
  const [parseRes, setParseRes] = useState<EventParseResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Step 2 manage (read-only recipients from DB) ----
  const [recFields, setRecFields] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<EventRecipientRow[]>([]);
  const [recLoading, setRecLoading] = useState(manage);

  // ---- AUTO_FETCH scope (deferred) ----
  const [affiliationId, setAffiliationId] = useState("");
  const [regulationId, setRegulationId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [programCourseId, setProgramCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [shiftIds, setShiftIds] = useState<string[]>([]);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [religionIds, setReligionIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [quotaTypeIds, setQuotaTypeIds] = useState<string[]>([]);
  const [scopePrev, setScopePrev] = useState<{
    count: number;
    sample: { uid: string; name: string | null }[];
  } | null>(null);
  const [resolving, setResolving] = useState(false);

  // ---- Steps 3/4 ----
  const [token, setToken] = useState<string | null>(null);
  const [enqueued, setEnqueued] = useState<{ enqueued: number; failed: number } | null>(null);
  const [progress, setProgress] = useState<StatusCounts | null>(
    manage
      ? {
          total: existing!.total,
          sent: existing!.sent,
          pending: Math.max(0, existing!.total - existing!.sent - existing!.failed),
          failed: existing!.failed,
        }
      : null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendPreview, setSendPreview] = useState<EventSendPreview | null>(null);
  // Staging only: which opted-in staff receive this test send (all by default).
  const [selectedStaff, setSelectedStaff] = useState<Set<number>>(new Set());

  // Load the environment send preview (cap + effective targets) once.
  useEffect(() => {
    void getEventSendPreview()
      .then((p) => {
        setSendPreview(p);
        if (p.mode === "staging")
          setSelectedStaff(
            new Set(p.targets.map((t) => t.userId).filter((v): v is number => v != null)),
          );
      })
      .catch(() => undefined);
  }, []);

  const staging = sendPreview?.mode === "staging";
  const toggleStaff = (userId: number) =>
    setSelectedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const errMsg = (e: unknown, fallback: string) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

  // Manage: load recipients + academic year, poll status if triggered.
  useEffect(() => {
    if (!existing) return;
    void getEventRecipientsList(existing.id)
      .then((r) => {
        setRecFields(r.fields);
        setRecipients(r.recipients);
      })
      .catch(() => undefined)
      .finally(() => setRecLoading(false));
    void getNotificationEvent(existing.id)
      .then((full) => {
        if (full.scope.academicYearId) setAcademicYearId(String(full.scope.academicYearId));
      })
      .catch(() => undefined);
    if (existing.status === "TRIGGERED") startPolling(existing.id);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  const filteredPCs = useMemo(
    () =>
      refData.programCourses.filter((pc) => {
        if (affiliationId && String(pc.affiliation?.id ?? "") !== affiliationId) return false;
        if (regulationId && String(pc.regulationType?.id ?? "") !== regulationId) return false;
        if (streamId && String(pc.stream?.id ?? "") !== streamId) return false;
        return true;
      }),
    [refData.programCourses, affiliationId, regulationId, streamId],
  );

  const pcLabel = (pc: ProgramCourseDto) =>
    [pc.course?.name, pc.stream?.name, pc.affiliation?.shortName ?? pc.affiliation?.name]
      .filter(Boolean)
      .join(" · ") || `Program course #${pc.id}`;

  const scope: EventScope = {
    academicYearId: academicYearId ? Number(academicYearId) : null,
    programCourseId: programCourseId ? Number(programCourseId) : null,
    classId: classId ? Number(classId) : null,
    shiftIds: shiftIds.map(Number),
    sectionIds: sectionIds.map(Number),
    genders,
    religionIds: religionIds.map(Number),
    categoryIds: categoryIds.map(Number),
    quotaTypeIds: quotaTypeIds.map(Number),
  };

  const onFile = async (file: File | null) => {
    if (!file || !master) return;
    setUploading(true);
    try {
      const res = await parseEventRecipients(master.id, file);
      setParseRes(res);
      toast.success(`${res.matched} matched.`);
    } catch (e) {
      toast.error(errMsg(e, "Upload failed."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resolveScope = async () => {
    setResolving(true);
    try {
      setScopePrev(await resolveScopePreview(scope));
    } catch (e) {
      toast.error(errMsg(e, "Could not resolve the scope."));
    } finally {
      setResolving(false);
    }
  };

  const recipientsCount = manage
    ? (progress?.total ?? recipients.length)
    : mode === "UPLOAD"
      ? (parseRes?.matched ?? 0)
      : (scopePrev?.count ?? 0);
  const canProceedData = manage || recipientsCount > 0;

  function startPolling(id: number) {
    if (pollRef.current) return;
    let ticks = 0;
    const tick = async () => {
      ticks++;
      try {
        const s = await getEventStatus(id);
        setProgress(s);
        if ((s.pending === 0 && s.total > 0) || ticks > POLL_TICK_CAP) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // keep polling
      }
    };
    void tick();
    pollRef.current = setInterval(() => void tick(), 3000);
  }

  const reloadRecipients = (id: number) =>
    getEventRecipientsList(id)
      .then((r) => {
        setRecFields(r.fields);
        setRecipients(r.recipients);
      })
      .catch(() => undefined);

  // Step 4 action: create+trigger (create) OR resend failed (manage).
  const doConfirm = async () => {
    if (!token) return;
    const staffIds = staging ? Array.from(selectedStaff) : undefined;
    setBusy(true);
    try {
      if (manage && existing) {
        const res = await resendEventFailed(existing.id, token, staffIds);
        setEnqueued(res);
        if (res.failed > 0) toast.error(`${res.failed} could not be queued.`);
        else toast.success(`Re-queued ${res.enqueued} failed recipients.`);
        setChanged(true);
        void reloadRecipients(existing.id);
        startPolling(existing.id);
      } else if (master) {
        const created = await createNotificationEvent({
          name,
          remarks: remarks || null,
          notificationMasterId: master.id,
          variant: master.variant,
          dataSourceMode: mode,
          scope,
          recipientsFileKey: parseRes?.fileKey ?? null,
        });
        const res = await triggerNotificationEvent(created.id, token, staffIds);
        setEnqueued(res);
        if (res.failed > 0) toast.error(`${res.failed} could not be queued.`);
        setChanged(true);
        startPolling(created.id);
      }
    } catch (e) {
      toast.error(errMsg(e, "Action failed."));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteNotificationEvent(existing.id);
      toast.success("Event deleted.");
      onClose(true);
    } catch (e) {
      toast.error(errMsg(e, "Delete failed."));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const done = enqueued != null;
  const activeSending = busy;
  const failedCount = progress?.failed ?? 0;

  const detail = (label: string, value: ReactNode) => (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  );

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && !activeSending && onClose(changed)}>
        <DialogContent className="flex h-[92vh] w-[95vw] max-w-[1250px] flex-col xl:max-w-[80vw]">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <span className="flex items-center gap-2">
                {manage ? (
                  <>
                    {existing?.masterName ?? "Event"}
                    <span className="text-sm font-normal text-gray-500">· {existing?.name}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-violet-600" /> Create notification event
                  </>
                )}
                {(master ?? existing) && (
                  <VariantBadge variant={master?.variant ?? existing?.variant ?? ""} />
                )}
                {manage && existing && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_STYLE[existing.status] ?? STATUS_STYLE.DRAFT
                    }`}
                  >
                    {existing.status}
                  </span>
                )}
              </span>
              <StepHeader current={step} />
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 pt-2">
            {/* STEP 1 — Event. Same layout for create + manage; manage is read-only. */}
            {step === 1 && (
              <div className="mx-auto max-w-4xl space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Campaign name"
                      disabled={manage}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Template (master)</label>
                    <Combobox
                      dataArr={manualMasters.map((m) => ({
                        value: String(m.id),
                        label: `${m.name} (${m.variant})`,
                      }))}
                      value={masterId}
                      onChange={setMasterId}
                      placeholder="Select a template"
                      disabled={manage}
                      selectedLabel={manage ? (existing?.masterName ?? undefined) : undefined}
                      showOptionsHint={false}
                      contentClassName="w-[min(420px,calc(100vw-2rem))]"
                    />
                    {!manage && (
                      <p className="text-[11px] text-muted-foreground">
                        Only manual (non auto-triggered) templates can back a campaign.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Academic year</label>
                    <Combobox
                      dataArr={refData.academicYears.map((y) => ({
                        value: String(y.id),
                        label: y.name,
                      }))}
                      value={academicYearId}
                      onChange={setAcademicYearId}
                      placeholder="Select academic year"
                      disabled={manage}
                      showOptionsHint={false}
                      contentClassName="w-[min(420px,calc(100vw-2rem))]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Remarks</label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={manage ? "" : "Optional notes about this campaign"}
                    rows={2}
                    disabled={manage}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Data source</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={manage}
                      onClick={() => !manage && setMode("UPLOAD")}
                      className={`rounded-md border p-3 text-left text-sm ${
                        mode === "UPLOAD"
                          ? "border-violet-400 bg-violet-50 text-violet-800"
                          : "border-gray-200 text-gray-600"
                      } ${manage ? "cursor-default opacity-90" : ""}`}
                    >
                      <span className="font-medium">Upload Excel</span>
                      <p className="mt-1 text-xs text-gray-500">
                        Bring your own recipient list — a sheet with student UIDs and the template's
                        field values.
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled
                      className={`cursor-not-allowed rounded-md border border-dashed p-3 text-left text-sm ${
                        mode === "AUTO_FETCH"
                          ? "border-violet-400 bg-violet-50 text-violet-800"
                          : "border-gray-200 text-gray-400"
                      }`}
                      title="Coming soon"
                    >
                      <span className="font-medium">Auto-fetch (coming soon)</span>
                      <p className="mt-1 text-xs">
                        Scope the students by cohort filters and auto-fill field values from student
                        records.
                      </p>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {manage
                    ? "This event has already been created — its configuration is read-only."
                    : "Nothing is saved yet — the event and its notifications are created only at the final confirmation step."}
                </p>
              </div>
            )}

            {/* STEP 2 — Data */}
            {step === 2 &&
              (manage ? (
                <div className="mx-auto max-w-5xl space-y-4">
                  {triggered ? (
                    <StatCards s={progress!} />
                  ) : (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      This event hasn't been sent yet — showing the staged recipients.
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#666]">
                      Recipients {recipients.length > 0 && `(${recipients.length})`}
                    </p>
                    {triggered && failedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void downloadEventFailed(existing!.id)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download failed ({failedCount})
                      </Button>
                    )}
                  </div>
                  {recLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                    </div>
                  ) : recipients.length === 0 ? (
                    <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-gray-400">
                      No recipients.
                    </div>
                  ) : (
                    <RecipientPreviewTable
                      fields={recFields}
                      rows={recipients}
                      showStatus={triggered}
                      maxH="52vh"
                    />
                  )}
                </div>
              ) : mode === "UPLOAD" ? (
                <div className="mx-auto max-w-5xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => master && void downloadMasterTemplate(master.id)}
                    >
                      <Download className="mr-1.5 h-4 w-4" /> Download template
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      className="bg-violet-600 text-white hover:bg-violet-700"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-1.5 h-4 w-4" />
                      )}
                      Upload filled sheet
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The template has a <span className="font-mono">uid</span> column plus one column
                    per template field. Recipients are matched by student UID; their WhatsApp number
                    comes from the student record.
                  </p>
                  {parseRes ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                          {parseRes.matched} matched
                        </span>
                        {parseRes.unknownUids.length > 0 && (
                          <span className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 font-medium text-rose-700">
                            {parseRes.unknownUids.length} unknown UID
                          </span>
                        )}
                        {parseRes.notEnrolled.length > 0 && (
                          <span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                            {parseRes.notEnrolled.length} not enrolled
                          </span>
                        )}
                      </div>
                      {parseRes.unknownUids.length > 0 && (
                        <p className="text-xs text-rose-600">
                          Unknown UIDs (skipped): {parseRes.unknownUids.slice(0, 10).join(", ")}
                          {parseRes.unknownUids.length > 10 ? "…" : ""}
                        </p>
                      )}
                      {parseRes.notEnrolled.length > 0 && (
                        <p className="text-xs text-amber-700">
                          Not currently enrolled — no active promotion (skipped):{" "}
                          {parseRes.notEnrolled.slice(0, 10).join(", ")}
                          {parseRes.notEnrolled.length > 10 ? "…" : ""}
                        </p>
                      )}
                      <RecipientPreviewTable
                        fields={parseRes.fields}
                        rows={parseRes.sample.map((r) => ({
                          uid: r.uid,
                          name: r.name,
                          whatsapp: r.whatsapp,
                          email: null,
                          status: null,
                          values: r.values,
                        }))}
                        footer={
                          parseRes.matched > parseRes.sample.length
                            ? `Showing first ${parseRes.sample.length} of ${parseRes.matched} matched rows.`
                            : undefined
                        }
                      />
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-gray-400">
                      No sheet uploaded yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-4xl space-y-4">
                  <div className="rounded-md border p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#666]">
                      Student scope{" "}
                      <span className="font-normal normal-case text-gray-400">
                        (leave empty for "any")
                      </span>
                    </p>
                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <ScopeSelect
                        label="Affiliation (filter)"
                        value={affiliationId}
                        onChange={setAffiliationId}
                        options={refData.affiliations}
                      />
                      <ScopeSelect
                        label="Regulation (filter)"
                        value={regulationId}
                        onChange={setRegulationId}
                        options={refData.regulations}
                      />
                      <ScopeSelect
                        label="Stream (filter)"
                        value={streamId}
                        onChange={setStreamId}
                        options={refData.streams}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Program course</label>
                        <Combobox
                          dataArr={[
                            { value: "", label: "Any" },
                            ...filteredPCs.map((pc) => ({
                              value: String(pc.id),
                              label: pcLabel(pc),
                            })),
                          ]}
                          value={programCourseId}
                          onChange={setProgramCourseId}
                          placeholder="Any program course"
                          showOptionsHint={false}
                          contentClassName="w-[min(420px,calc(100vw-2rem))]"
                        />
                      </div>
                      <ScopeSelect
                        label="Class"
                        value={classId}
                        onChange={setClassId}
                        options={refData.classes}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <ScopeMulti
                        label="Shifts"
                        selected={shiftIds}
                        onChange={setShiftIds}
                        options={refData.shifts}
                      />
                      <ScopeMulti
                        label="Sections"
                        selected={sectionIds}
                        onChange={setSectionIds}
                        options={refData.sections}
                      />
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Genders</label>
                        <MultiSelectDropdown
                          placeholder="Any gender"
                          options={GENDERS.map((g) => ({ label: g, value: g }))}
                          selectedOptions={genders}
                          onChange={setGenders}
                        />
                      </div>
                      <ScopeMulti
                        label="Religions"
                        selected={religionIds}
                        onChange={setReligionIds}
                        options={refData.religions}
                      />
                      <ScopeMulti
                        label="Categories"
                        selected={categoryIds}
                        onChange={setCategoryIds}
                        options={refData.categories}
                      />
                      <ScopeMulti
                        label="Quota types"
                        selected={quotaTypeIds}
                        onChange={setQuotaTypeIds}
                        options={refData.quotaTypes}
                      />
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resolving}
                        onClick={() => void resolveScope()}
                      >
                        {resolving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Users className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Resolve students
                      </Button>
                    </div>
                  </div>
                  {scopePrev && (
                    <p className="text-sm">
                      <span className="font-semibold">
                        {scopePrev.count.toLocaleString("en-IN")}
                      </span>{" "}
                      students match this scope.
                    </p>
                  )}
                </div>
              ))}

            {/* STEP 3 — Verification */}
            {step === 3 && (
              <div className="mx-auto max-w-2xl pt-2">
                <VerifyOtpPanel
                  actionHint={
                    manage
                      ? `Resending to ${failedCount} failed recipient${failedCount === 1 ? "" : "s"} requires verification.`
                      : `Sending "${name}" to ${recipientsCount.toLocaleString("en-IN")} recipients requires verification.`
                  }
                  startOtp={startEventSendOtp}
                  verifyOtp={verifyEventSendOtp}
                  onVerified={(t) => {
                    setToken(t);
                    setStep(4);
                  }}
                />
              </div>
            )}

            {/* STEP 4 — Send / status */}
            {step === 4 && (
              <div className="mx-auto max-w-2xl space-y-4 pt-2">
                {!done ? (
                  <>
                    <div className="rounded-md border p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#666]">
                        Summary
                      </p>
                      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        {detail("Event", name)}
                        {detail(
                          "Template",
                          <>
                            {master?.name ?? existing?.masterName ?? "—"}{" "}
                            {(master ?? existing) && (
                              <VariantBadge variant={master?.variant ?? existing?.variant ?? ""} />
                            )}
                          </>,
                        )}
                        {detail(
                          manage ? "Failed to resend" : "Recipients",
                          (manage ? failedCount : recipientsCount).toLocaleString("en-IN"),
                        )}
                      </dl>
                    </div>
                    {manage && triggered && <StatCards s={progress!} />}

                    {/* Non-production test-send cap + effective targets. */}
                    {sendPreview && sendPreview.cap != null && (
                      <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                        <p className="text-sm font-semibold">
                          {sendPreview.mode === "development" ? "Development" : "Staging"}{" "}
                          environment — test send only
                        </p>
                        <p className="text-xs leading-relaxed">
                          To avoid flooding{" "}
                          {sendPreview.mode === "development" ? "the developer" : "staging staff"},
                          only the first <span className="font-bold">{sendPreview.cap}</span> of{" "}
                          <span className="font-bold">
                            {(manage ? failedCount : recipientsCount).toLocaleString("en-IN")}
                          </span>{" "}
                          recipients will actually be sent.{" "}
                          {staging
                            ? "Choose which opted-in staff receive this test send:"
                            : "Every message is routed to the account below, never to real students."}
                        </p>
                        {sendPreview.targets.length > 0 ? (
                          <div className="overflow-hidden rounded-md border border-amber-200 bg-white">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b bg-amber-100/60 text-left uppercase tracking-wide text-amber-800">
                                  {staging && (
                                    <th className="w-8 px-2 py-1.5 text-center">
                                      <Checkbox
                                        checked={
                                          selectedStaff.size === sendPreview.targets.length &&
                                          sendPreview.targets.length > 0
                                        }
                                        onCheckedChange={(v) =>
                                          setSelectedStaff(
                                            v === true
                                              ? new Set(
                                                  sendPreview.targets
                                                    .map((t) => t.userId)
                                                    .filter((x): x is number => x != null),
                                                )
                                              : new Set(),
                                          )
                                        }
                                        aria-label="Select all staff"
                                      />
                                    </th>
                                  )}
                                  <th className="px-2 py-1.5">Name</th>
                                  <th className="px-2 py-1.5">Type</th>
                                  <th className="px-2 py-1.5">Email</th>
                                  <th className="px-2 py-1.5">WhatsApp</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sendPreview.targets.map((t, i) => (
                                  <tr key={t.userId ?? `x${i}`} className="border-b last:border-0">
                                    {staging && (
                                      <td className="px-2 py-1.5 text-center">
                                        <Checkbox
                                          checked={t.userId != null && selectedStaff.has(t.userId)}
                                          disabled={t.userId == null}
                                          onCheckedChange={() =>
                                            t.userId != null && toggleStaff(t.userId)
                                          }
                                          aria-label={`Select ${t.name}`}
                                        />
                                      </td>
                                    )}
                                    <td className="px-2 py-1.5 font-medium text-gray-800">
                                      {t.name}
                                    </td>
                                    <td className="px-2 py-1.5 text-gray-600">{t.type ?? "—"}</td>
                                    <td className="px-2 py-1.5 text-gray-600">{t.email ?? "—"}</td>
                                    <td className="px-2 py-1.5 text-gray-600">
                                      {t.whatsapp ?? t.phone ?? "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-rose-700">
                            No staging staff have the send-notifications flag enabled — nothing will
                            be delivered.
                          </p>
                        )}
                        {staging && selectedStaff.size === 0 && (
                          <p className="text-xs font-medium text-rose-700">
                            Select at least one staff recipient to continue.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                      Verified.{" "}
                      {manage
                        ? failedCount > 0
                          ? `Resending will re-queue ${Math.min(sendPreview?.cap ?? failedCount, failedCount)} failed recipient${Math.min(sendPreview?.cap ?? failedCount, failedCount) === 1 ? "" : "s"}.`
                          : "There are no failed recipients to resend right now."
                        : `Confirming will create the event and queue ${Math.min(sendPreview?.cap ?? recipientsCount, recipientsCount).toLocaleString("en-IN")} notification${Math.min(sendPreview?.cap ?? recipientsCount, recipientsCount) === 1 ? "" : "s"}.`}
                    </div>
                    <Button
                      className="bg-violet-600 text-white hover:bg-violet-700"
                      disabled={
                        busy ||
                        (manage && failedCount === 0) ||
                        (staging && selectedStaff.size === 0)
                      }
                      onClick={() => void doConfirm()}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {manage ? "Confirm & resend failed" : "Confirm & send"}
                    </Button>
                    {manage && triggered && failedCount > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => void downloadEventFailed(existing!.id)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download failed ({failedCount})
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" /> Queued {enqueued?.enqueued}
                      {enqueued && enqueued.failed > 0 ? (
                        <span className="text-rose-600">· {enqueued.failed} failed to queue</span>
                      ) : null}{" "}
                      — delivering…
                    </div>
                    {progress && (
                      <>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-violet-600 transition-all"
                            style={{
                              width: `${progress.total ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <StatCards s={progress} />
                        {progress.pending === 0 && progress.total > 0 && (
                          <p className="flex items-center gap-1.5 text-sm text-gray-600">
                            {progress.failed === 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-600" />
                            )}
                            Delivery finished — {progress.sent} sent, {progress.failed} failed.
                          </p>
                        )}
                        {progress.failed > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => existing && void downloadEventFailed(existing.id)}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download failed (
                            {progress.failed})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center gap-2 border-t pt-3">
            {manage && !triggered && step < 3 && (
              <Button
                variant="ghost"
                className="mr-auto text-rose-600 hover:text-rose-700"
                disabled={deleting}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            )}
            {step > 1 && step < 4 && !done && (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                Back
              </Button>
            )}
            <Button variant="outline" disabled={activeSending} onClick={() => onClose(changed)}>
              {done || manage ? "Close" : "Cancel"}
            </Button>
            {step === 1 && (
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                disabled={!manage && (!name.trim() || !master)}
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                disabled={!canProceedData}
                onClick={() => setStep(3)}
              >
                Next
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              “{existing?.name}” and its staged recipients will be permanently removed. This can't
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void doDelete();
              }}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecipientPreviewTable({
  fields,
  rows,
  showStatus,
  footer,
  maxH = "38vh",
}: {
  fields: string[];
  rows: EventRecipientRow[];
  showStatus?: boolean;
  footer?: string;
  maxH?: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-auto" style={{ maxHeight: maxH }}>
        <table className="w-full text-sm [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-100 [&_th]:shadow-[inset_0_-1px_0_#d1d5db]">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">UID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">WhatsApp</th>
              {showStatus && <th className="px-3 py-2">Status</th>}
              {fields.map((f) => (
                <th key={f} className="px-3 py-2">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.uid ?? "x"}-${i}`} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.uid ?? "—"}</td>
                <td className="px-3 py-2">{r.name ?? "—"}</td>
                <td className="px-3 py-2">{r.whatsapp ?? "—"}</td>
                {showStatus && (
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                        RECIPIENT_STATUS_STYLE[r.status ?? ""] ??
                        "bg-gray-50 text-gray-600 ring-gray-500/20"
                      }`}
                    >
                      {r.status ?? "—"}
                    </span>
                  </td>
                )}
                {fields.map((f) => (
                  <td key={f} className="px-3 py-2 text-gray-700">
                    {r.values[f] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">{footer}</p>}
    </div>
  );
}

function ScopeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Ref[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <Combobox
        dataArr={[
          { value: "", label: "Any" },
          ...options.map((o) => ({ value: String(o.id), label: o.name })),
        ]}
        value={value}
        onChange={onChange}
        placeholder="Any"
        showOptionsHint={false}
        contentClassName="w-[min(420px,calc(100vw-2rem))]"
      />
    </div>
  );
}

function ScopeMulti({
  label,
  selected,
  onChange,
  options,
}: {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: Ref[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <MultiSelectDropdown
        placeholder={`Any ${label.toLowerCase()}`}
        options={opts(options)}
        selectedOptions={selected}
        onChange={onChange}
      />
    </div>
  );
}
