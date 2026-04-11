import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { NewAcademicSessionDraft } from "../types";
import {
  getPromotionRoster,
  type PromotionRosterBucket,
  type PromotionRosterSort,
} from "@/services/promotion-roster.api";
import {
  getAffiliations,
  getProgramCourses,
  getRegulationTypes,
} from "@/services/course-design.api";
import { findSessionsByAcademicYear } from "@/services/session.service";
import { getAllClasses } from "@/services/classes.service";
import axiosInstance from "@/utils/api";
import type { Affiliation, ProgramCourse, RegulationType } from "@repo/db";
import type { Class } from "@/types/academics/class";
import type { Session } from "@/types/academics/session";
import type { Shift } from "@/types/academics/shift";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  draft: NewAcademicSessionDraft;
  onDraftChange: (patch: Partial<NewAcademicSessionDraft>) => void;
};

async function loadShifts(): Promise<Shift[]> {
  const res = await axiosInstance.get<{ payload?: Shift[] } | Shift[]>("/api/v1/shifts");
  const d = res.data as { payload?: Shift[] };
  if (d && typeof d === "object" && "payload" in d && Array.isArray(d.payload)) return d.payload;
  return Array.isArray(res.data) ? res.data : [];
}

function classSeq(c: Class): number {
  return c.sequence ?? c.id ?? 0;
}

export function Step2Promotion({ draft, onDraftChange }: Props) {
  const onDraftChangeRef = React.useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  const academicYearId = draft.academicYearId ?? null;

  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulations, setRegulations] = React.useState<RegulationType[]>([]);
  const [programCourses, setProgramCourses] = React.useState<ProgramCourse[]>([]);
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);

  const pd = draft.promotionDraft ?? {};

  const [affiliationId, setAffiliationId] = React.useState<string>(
    pd.affiliationId ? String(pd.affiliationId) : "",
  );
  const [regulationId, setRegulationId] = React.useState<string>(
    pd.regulationTypeId ? String(pd.regulationTypeId) : "",
  );
  const [programCourseId, setProgramCourseId] = React.useState<string>(
    pd.programCourseId ? String(pd.programCourseId) : "",
  );
  const [shiftId, setShiftId] = React.useState<string>(pd.shiftId ? String(pd.shiftId) : "");

  const [fromSessionId, setFromSessionId] = React.useState<string>(
    pd.fromSessionId ? String(pd.fromSessionId) : "",
  );
  const [toSessionId, setToSessionId] = React.useState<string>(
    pd.toSessionId ? String(pd.toSessionId) : "",
  );
  const [fromClassId, setFromClassId] = React.useState<string>(
    pd.fromClassId ? String(pd.fromClassId) : "",
  );
  const [toClassId, setToClassId] = React.useState<string>(
    pd.toClassId ? String(pd.toClassId) : "",
  );

  const [bucket, setBucket] = React.useState<PromotionRosterBucket>("all");
  const [sortBy, setSortBy] = React.useState<PromotionRosterSort>("uid");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  const [loading, setLoading] = React.useState(false);
  const [roster, setRoster] = React.useState<Awaited<ReturnType<typeof getPromotionRoster>> | null>(
    null,
  );

  React.useEffect(() => {
    void (async () => {
      try {
        const [aff, reg, pc, sh, cls] = await Promise.all([
          getAffiliations(),
          getRegulationTypes(),
          getProgramCourses(),
          loadShifts(),
          getAllClasses(),
        ]);
        setAffiliations(aff ?? []);
        setRegulations(reg ?? []);
        setProgramCourses(pc ?? []);
        setShifts(sh ?? []);
        setClasses(
          (cls ?? [])
            .filter((c) => c.type === "SEMESTER")
            .sort((a, b) => classSeq(a) - classSeq(b)),
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to load filter options.");
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!academicYearId) {
      setSessions([]);
      return;
    }
    void (async () => {
      try {
        const res = await findSessionsByAcademicYear(academicYearId);
        const list = res.payload ?? [];
        setSessions(list);
      } catch {
        toast.error("Failed to load sessions for this academic year.");
      }
    })();
  }, [academicYearId]);

  React.useEffect(() => {
    if (sessions.length === 0) return;
    if (!fromSessionId) setFromSessionId(String(sessions[0].id!));
    if (!toSessionId) setToSessionId(String(sessions[0].id!));
  }, [sessions, fromSessionId, toSessionId]);

  const semClasses = React.useMemo(() => classes.filter((c) => c.type === "SEMESTER"), [classes]);

  React.useEffect(() => {
    if (!fromClassId && semClasses[0]?.id) setFromClassId(String(semClasses[0].id));
  }, [semClasses, fromClassId]);

  React.useEffect(() => {
    if (!fromClassId || semClasses.length === 0) return;
    const from = semClasses.find((c) => String(c.id) === fromClassId);
    if (!from) return;
    const next = semClasses.find((c) => classSeq(c) === classSeq(from) + 1);
    if (next?.id && !toClassId) setToClassId(String(next.id));
  }, [fromClassId, semClasses, toClassId]);

  const canQuery =
    academicYearId != null &&
    fromSessionId &&
    toSessionId &&
    fromClassId &&
    toClassId &&
    Number(fromClassId) !== Number(toClassId);

  const fetchRoster = React.useCallback(async () => {
    if (!canQuery || !academicYearId) {
      setRoster(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getPromotionRoster({
        academicYearId,
        fromSessionId: Number(fromSessionId),
        toSessionId: Number(toSessionId),
        fromClassId: Number(fromClassId),
        toClassId: Number(toClassId),
        affiliationId: affiliationId ? Number(affiliationId) : undefined,
        regulationTypeId: regulationId ? Number(regulationId) : undefined,
        programCourseId: programCourseId ? Number(programCourseId) : undefined,
        shiftId: shiftId ? Number(shiftId) : undefined,
        bucket,
        sortBy,
        sortDir: "asc",
        page,
        pageSize,
        q: debouncedQ || undefined,
      });
      setRoster(data);
      onDraftChangeRef.current({
        promotionDraft: {
          fromSessionId: Number(fromSessionId),
          toSessionId: Number(toSessionId),
          fromClassId: Number(fromClassId),
          toClassId: Number(toClassId),
          affiliationId: affiliationId ? Number(affiliationId) : undefined,
          regulationTypeId: regulationId ? Number(regulationId) : undefined,
          programCourseId: programCourseId ? Number(programCourseId) : undefined,
          shiftId: shiftId ? Number(shiftId) : undefined,
          loadedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not load promotion roster. Check session/class range and try again.");
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }, [
    academicYearId,
    affiliationId,
    bucket,
    canQuery,
    fromClassId,
    fromSessionId,
    page,
    pageSize,
    programCourseId,
    debouncedQ,
    regulationId,
    shiftId,
    sortBy,
    toClassId,
    toSessionId,
  ]);

  React.useEffect(() => {
    void fetchRoster();
  }, [fetchRoster]);

  const filteredProgramCourses = React.useMemo(() => {
    return programCourses.filter((pc) => {
      if (affiliationId && String(pc.affiliationId) !== affiliationId) return false;
      if (regulationId && String(pc.regulationTypeId) !== regulationId) return false;
      return true;
    });
  }, [programCourses, affiliationId, regulationId]);

  const counts = roster?.counts ?? {
    all: 0,
    eligible: 0,
    ineligible: 0,
    inactive: 0,
    promoted: 0,
  };

  const startIndex = roster ? (roster.page - 1) * roster.pageSize : 0;
  const endIndex = roster ? startIndex + roster.content.length : 0;

  return (
    <div className="space-y-4 text-[13px] text-foreground">
      <div>
        <h3 className="text-lg font-semibold">Semester promotion</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose filters and the promotion range. Counts and the table load from the server using
          your current academic year (step 1). Sort by UID, roll number, or registration number.
        </p>
      </div>

      {!academicYearId ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Select an academic year in step 1 so sessions and roster queries can run.
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="space-y-4 border-b bg-muted/20 py-4">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Step 1 · Filters
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={affiliationId}
              onValueChange={(v) => setAffiliationId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Affiliation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any affiliation</SelectItem>
                {affiliations.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={regulationId}
              onValueChange={(v) => setRegulationId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Regulation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any regulation</SelectItem>
                {regulations.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={programCourseId}
              onValueChange={(v) => setProgramCourseId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="min-w-[200px] max-w-[280px]">
                <SelectValue placeholder="Program course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any program</SelectItem>
                {filteredProgramCourses.map((pc) => (
                  <SelectItem key={pc.id} value={String(pc.id)}>
                    {pc.name ?? pc.shortName ?? `#${pc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={shiftId} onValueChange={(v) => setShiftId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any shift</SelectItem>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as PromotionRosterSort)}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uid">UID</SelectItem>
                <SelectItem value="rollNumber">Roll number</SelectItem>
                <SelectItem value="registrationNumber">Registration number</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, UID, roll, registration…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Step 2 · Promotion range
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-xl border border-border border-l-4 border-l-muted-foreground/25 p-4">
              <div className="mb-3 inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Promoted from
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    Session
                  </div>
                  <Select value={fromSessionId} onValueChange={setFromSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    Semester (class)
                  </div>
                  <Select value={fromClassId} onValueChange={setFromClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {semClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="hidden items-center justify-center md:flex">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="rounded-xl border border-primary border-l-4 border-l-primary p-4">
              <div className="mb-3 inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">
                Promoted to
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    Session
                  </div>
                  <Select value={toSessionId} onValueChange={setToSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                    Semester (class)
                  </div>
                  <Select value={toClassId} onValueChange={setToClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {semClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 border-t bg-muted/30 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Eligible / not eligible use board result on the source promotion; inactive includes
            suspended users or inactive students.
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canQuery || loading}
            onClick={() => void fetchRoster()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            {
              k: "all" as const,
              label: "Total",
              n: counts.all,
              Icon: Users,
              ring: "ring-primary/30",
            },
            {
              k: "eligible" as const,
              label: "Eligible",
              n: counts.eligible,
              Icon: CheckCircle2,
              ring: "ring-emerald-500/40",
            },
            {
              k: "ineligible" as const,
              label: "Not eligible",
              n: counts.ineligible,
              Icon: XCircle,
              ring: "ring-red-500/40",
            },
            {
              k: "inactive" as const,
              label: "Inactive / suspended",
              n: counts.inactive,
              Icon: AlertCircle,
              ring: "ring-amber-500/40",
            },
            {
              k: "promoted" as const,
              label: "Promoted",
              n: counts.promoted,
              Icon: TrendingUp,
              ring: "ring-sky-500/40",
            },
          ] as const
        ).map(({ k, label, n, Icon, ring }) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setBucket(k);
              setPage(1);
            }}
            className={cn(
              "rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
              bucket === k && cn("ring-2 ring-offset-2", ring),
            )}
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
              <Icon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
            </div>
            <div className="text-3xl font-extrabold leading-none">{n}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative max-h-[min(480px,55vh)] overflow-auto rounded-md border">
            <Table containerClassName="overflow-visible">
              <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && roster?.content.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No rows for this view.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  roster?.content.map((r) => (
                    <TableRow key={`${r.studentId}-${r.promotionId}`}>
                      <TableCell className="font-medium">{r.studentName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.uid}</TableCell>
                      <TableCell
                        className="max-w-[220px] truncate"
                        title={r.programCourseName ?? ""}
                      >
                        {r.programCourseName ?? "—"}
                      </TableCell>
                      <TableCell>{r.shiftName}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {r.fromClassName} → {r.toClassName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            r.bucket === "eligible" &&
                              "border-emerald-200 bg-emerald-50 text-emerald-800",
                            r.bucket === "ineligible" && "border-red-200 bg-red-50 text-red-800",
                            r.bucket === "inactive" &&
                              "border-amber-200 bg-amber-50 text-amber-900",
                            r.bucket === "promoted" &&
                              "border-primary/30 bg-primary text-primary-foreground",
                          )}
                        >
                          {r.bucket === "eligible" && "Eligible"}
                          {r.bucket === "ineligible" && "Not eligible"}
                          {r.bucket === "inactive" && "Inactive / suspended"}
                          {r.bucket === "promoted" && "Promoted"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          {roster && roster.totalElements > 0 && (
            <div className="border-t p-2">
              <Pagination
                currentPage={roster.page}
                totalPages={roster.totalPages}
                totalItems={roster.totalElements}
                itemsPerPage={roster.pageSize}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={(p) => setPage(p)}
                onItemsPerPageChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        type="button"
        variant={draft.promotionReviewAcknowledged ? "secondary" : "default"}
        onClick={() =>
          onDraftChange({
            promotionReviewAcknowledged: true,
            promotionDraft: {
              ...(draft.promotionDraft ?? {}),
              fromSessionId: fromSessionId ? Number(fromSessionId) : undefined,
              toSessionId: toSessionId ? Number(toSessionId) : undefined,
              fromClassId: fromClassId ? Number(fromClassId) : undefined,
              toClassId: toClassId ? Number(toClassId) : undefined,
              affiliationId: affiliationId ? Number(affiliationId) : undefined,
              regulationTypeId: regulationId ? Number(regulationId) : undefined,
              programCourseId: programCourseId ? Number(programCourseId) : undefined,
              shiftId: shiftId ? Number(shiftId) : undefined,
              acknowledgedAt: new Date().toISOString(),
            },
          })
        }
      >
        {draft.promotionReviewAcknowledged
          ? "Promotion step saved — use Next to continue"
          : "Mark promotion review complete & save to draft"}
      </Button>
    </div>
  );
}

export function step2Valid(draft: NewAcademicSessionDraft): boolean {
  return draft.promotionReviewAcknowledged === true;
}
