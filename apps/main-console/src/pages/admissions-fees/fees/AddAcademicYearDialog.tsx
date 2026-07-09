import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAcademicYearCopyPreview,
  createAcademicYearWithCopy,
  type AcademicYearCopyPreview,
} from "@/services/academic-year-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const BADGE = {
  blue: "border-blue-300 bg-blue-50 text-blue-700",
  indigo: "border-indigo-300 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
  orange: "border-orange-300 bg-orange-50 text-orange-700",
  violet: "border-violet-300 bg-violet-50 text-violet-700",
  rose: "border-rose-300 bg-rose-50 text-rose-700",
} as const;

type BadgeColor = keyof typeof BADGE;

/** Colored badge list for a cell of multiple values. */
function chips(values: string[], color: BadgeColor = "indigo") {
  if (!values.length) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v, i) => (
        <Badge key={`${v}-${i}`} variant="outline" className={`text-xs ${BADGE[color]}`}>
          {v}
        </Badge>
      ))}
    </div>
  );
}

/** Single colored badge for a scalar cell. */
function badge(value: string | null, color: BadgeColor) {
  if (!value) return <span className="text-gray-400">—</span>;
  return (
    <Badge variant="outline" className={`text-xs ${BADGE[color]}`}>
      {value}
    </Badge>
  );
}

/** "SEMESTER II" -> "II" (just the roman numeral, uppercased). */
function roman(name: string): string {
  const stripped = name.replace(/semester/gi, "").trim();
  return (stripped || name).toUpperCase();
}

export default function AddAcademicYearDialog({ open, onOpenChange, onCreated }: Props) {
  const [preview, setPreview] = useState<AcademicYearCopyPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionFrom, setSessionFrom] = useState("");
  const [sessionTo, setSessionTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setPreview(null);
    getAcademicYearCopyPreview()
      .then((res) => {
        if (cancelled) return;
        setPreview(res.payload);
        // Default the session window to the academic year Jul 1 -> Jun 30.
        const start = Number(String(res.payload?.nextYear ?? "").match(/\d{4}/)?.[0]);
        if (start) {
          setSessionFrom(`${start}-07-01`);
          setSessionTo(`${start + 1}-06-30`);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load copy preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleCreate = async () => {
    if (!preview?.nextYear) return;
    setSubmitting(true);
    try {
      const res = await createAcademicYearWithCopy({
        year: preview.nextYear,
        makeActive: false,
        sessionFrom: sessionFrom || null,
        sessionTo: sessionTo || null,
      });
      const c = res.payload.copied;
      toast.success(
        `Created ${preview.nextYear} · copied ${c.metas} metas, ${c.relatedSubjects} related, ${c.restrictedGroupings} restricted, ${c.subjectGroupings} subject groupings, ${c.papers} papers`,
      );
      onCreated();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create academic year";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const counts = preview?.counts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] w-[97vw] max-w-[1600px] flex-col gap-0 p-0 sm:max-w-[1600px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            Add New Academic Year
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-base font-bold text-purple-700">
              {preview?.nextYear ?? "—"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {preview?.sourceYear ? (
              <>
                Copying the active configuration from{" "}
                <span className="font-medium">{preview.sourceYear.year}</span>. The new year is
                auto-derived (sequential).
              </>
            ) : (
              "Creating the first academic year (nothing to copy yet)."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading copy preview…
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">
                  Will be copied to {preview?.nextYear}
                </p>
                <Tabs defaultValue="metas">
                  <TabsList className="flex w-full flex-wrap justify-start">
                    <TabsTrigger value="metas">
                      Subject-selection meta
                      <Badge variant="secondary" className="ml-1.5">
                        {counts?.metas ?? 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="related">
                      Related subjects
                      <Badge variant="secondary" className="ml-1.5">
                        {counts?.relatedSubjects ?? 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="restricted">
                      Restricted
                      <Badge variant="secondary" className="ml-1.5">
                        {counts?.restrictedGroupings ?? 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="subjectGroupings">
                      Subject groupings
                      <Badge variant="secondary" className="ml-1.5">
                        {counts?.subjectGroupings ?? 0}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="papers">
                      Papers{" "}
                      <Badge variant="secondary" className="ml-1.5">
                        {counts?.papers ?? 0}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* METAS */}
                  <TabsContent value="metas" className="mt-3">
                    <div className="rounded-md border">
                      <Table containerClassName="h-[46vh] overflow-auto rounded-md">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>Subject type</TableHead>
                            <TableHead>Classes</TableHead>
                            <TableHead>Streams</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview?.metas.length ? (
                            preview.metas.map((m) => (
                              <TableRow key={m.id}>
                                <TableCell className="font-medium">{m.label}</TableCell>
                                <TableCell>{badge(m.subjectType, "emerald")}</TableCell>
                                <TableCell>{chips(m.classes.map(roman), "orange")}</TableCell>
                                <TableCell>{chips(m.streams, "violet")}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No metas to copy.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* RELATED SUBJECTS */}
                  <TabsContent value="related" className="mt-3">
                    <div className="rounded-md border">
                      <Table containerClassName="h-[46vh] overflow-auto rounded-md">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead>Program course</TableHead>
                            <TableHead>Subject type</TableHead>
                            <TableHead>Board subject</TableHead>
                            <TableHead>Related</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview?.relatedSubjects.length ? (
                            preview.relatedSubjects.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>{badge(r.programCourse, "blue")}</TableCell>
                                <TableCell>{badge(r.subjectType, "emerald")}</TableCell>
                                <TableCell>{badge(r.boardSubjectName, "indigo")}</TableCell>
                                <TableCell>{chips(r.related, "indigo")}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No related subjects to copy.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* RESTRICTED GROUPINGS */}
                  <TabsContent value="restricted" className="mt-3">
                    <div className="rounded-md border">
                      <Table containerClassName="h-[46vh] overflow-auto rounded-md">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead>Subject type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Classes</TableHead>
                            <TableHead>Program courses</TableHead>
                            <TableHead>Cannot combine with</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview?.restrictedGroupings.length ? (
                            preview.restrictedGroupings.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell>{badge(r.subjectType, "emerald")}</TableCell>
                                <TableCell>{badge(r.subject, "indigo")}</TableCell>
                                <TableCell>{chips(r.classes.map(roman), "orange")}</TableCell>
                                <TableCell>{chips(r.programCourses, "blue")}</TableCell>
                                <TableCell>{chips(r.cannotCombineWith, "rose")}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No restricted groupings to copy.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* SUBJECT GROUPINGS */}
                  <TabsContent value="subjectGroupings" className="mt-3">
                    <div className="rounded-md border">
                      <Table containerClassName="h-[46vh] overflow-auto rounded-md">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Subject type</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Program courses</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview?.subjectGroupings.length ? (
                            preview.subjectGroupings.map((g) => (
                              <TableRow key={g.id}>
                                <TableCell className="font-medium">{g.name}</TableCell>
                                <TableCell className="font-mono text-xs">{g.code ?? "—"}</TableCell>
                                <TableCell>{badge(g.subjectType, "emerald")}</TableCell>
                                <TableCell>{chips(g.subjects, "indigo")}</TableCell>
                                <TableCell>{chips(g.programCourses, "blue")}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No subject groupings to copy.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* PAPERS */}
                  <TabsContent value="papers" className="mt-3">
                    {preview && preview.papers.total > preview.papers.rows.length ? (
                      <p className="mb-2 text-xs text-muted-foreground">
                        Showing {preview.papers.rows.length} of {preview.papers.total}; all{" "}
                        {preview.papers.total} will be copied.
                      </p>
                    ) : null}
                    <div className="rounded-md border">
                      <Table containerClassName="h-[46vh] overflow-auto rounded-md">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Optional</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview?.papers.rows.length ? (
                            preview.papers.rows.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-mono text-xs">{p.code}</TableCell>
                                <TableCell>
                                  {p.name}
                                  {!p.isOptional && <span className="ml-1 text-red-500">*</span>}
                                </TableCell>
                                <TableCell>
                                  {p.programCourse ? (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-300 bg-blue-50 text-xs text-blue-700"
                                    >
                                      {p.programCourse}
                                    </Badge>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {p.className ? (
                                    <Badge
                                      variant="outline"
                                      className="border-orange-300 bg-orange-50 text-xs text-orange-700"
                                    >
                                      {roman(p.className)}
                                    </Badge>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {p.subjectType ? (
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-300 bg-emerald-50 text-xs text-emerald-700"
                                    >
                                      {p.subjectType}
                                    </Badge>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {p.isOptional ? (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-300 bg-amber-50 text-xs text-amber-700"
                                    >
                                      Optional
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-slate-300 bg-slate-50 text-xs text-slate-600"
                                    >
                                      Compulsory
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="py-6 text-center text-muted-foreground"
                              >
                                No papers to copy.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">
                New year is added as inactive. Set the current year from the Academic Years list
                when you&apos;re ready.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="leading-tight">
                <Label htmlFor="session-from" className="text-[11px] text-muted-foreground">
                  Session start
                </Label>
                <Input
                  id="session-from"
                  type="date"
                  value={sessionFrom}
                  onChange={(e) => setSessionFrom(e.target.value)}
                  className="h-8 w-[150px]"
                />
              </div>
              <div className="leading-tight">
                <Label htmlFor="session-to" className="text-[11px] text-muted-foreground">
                  Session end
                </Label>
                <Input
                  id="session-to"
                  type="date"
                  value={sessionTo}
                  onChange={(e) => setSessionTo(e.target.value)}
                  className="h-8 w-[150px]"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || submitting || !preview?.nextYear}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                `Create ${preview?.nextYear ?? "year"}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
