import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Home, PlusCircle, CalendarClock, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { SearchableSelect } from "@/features/academic-year-setup/general/SearchableSelect";
import {
  type AdmissionCycle,
  type SimpleOption,
  getAdmissionCycles,
  createAdmissionCycle,
  getSessions,
} from "@/services/admission-program-course.service";

const startYearOf = (s: string | null | undefined) => String(s ?? "").match(/\d{4}/)?.[0] ?? "";
const yearLabel = (y: string | null | undefined) => {
  const m = startYearOf(y);
  return m ? `${m}-${String(Number(m) + 1).slice(-2)}` : (y ?? "");
};

export default function AdmissionMasterHomePage() {
  useRestrictTempUsers();
  const { year } = useParams<{ year: string }>();

  const [cycle, setCycle] = React.useState<AdmissionCycle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isCycleOpen, setIsCycleOpen] = React.useState(false);
  const [sessions, setSessions] = React.useState<SimpleOption[]>([]);
  const [cycleForm, setCycleForm] = React.useState({ sessionId: "", startDate: "", lastDate: "" });
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAdmissionCycles();
      const wanted = startYearOf(year);
      setCycle(
        (wanted ? all.find((a) => startYearOf(a.sessionName) === wanted) : undefined) ?? null,
      );
    } catch {
      toast.error("Failed to load admission cycle");
    } finally {
      setLoading(false);
    }
  }, [year]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setCycleForm({ sessionId: "", startDate: "", lastDate: "" });
    try {
      const list = await getSessions();
      setSessions(list);
      // pre-select the session matching the URL year, if it exists
      const wanted = startYearOf(year);
      const match = list.find((s) => startYearOf(s.name) === wanted);
      if (match) setCycleForm((p) => ({ ...p, sessionId: String(match.id) }));
    } catch {
      setSessions([]);
    }
    setIsCycleOpen(true);
  };

  const handleCreate = async () => {
    if (!cycleForm.sessionId) {
      toast.error("Session is required");
      return;
    }
    setCreating(true);
    try {
      await createAdmissionCycle({
        sessionId: Number(cycleForm.sessionId),
        status: "DRAFT",
        startDate: cycleForm.startDate || null,
        lastDate: cycleForm.lastDate || null,
      });
      toast.success("Admission cycle created");
      setIsCycleOpen(false);
      await load();
    } catch (e) {
      toast.error(`Failed to create cycle: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 rounded-md border p-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Home className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
            <span className="truncate">Admission Home ({yearLabel(year)})</span>
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Create the admission cycle and manage the phases of admission for this year.
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-1 sm:px-2">
          {/* Admission cycle */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CalendarClock className="h-4 w-4" /> Admission Cycle
            </h3>
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            ) : cycle ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {cycle.sessionName ?? yearLabel(year)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{cycle.status ?? "DRAFT"}</Badge>
                    {cycle.isClosed ? (
                      <Badge variant="secondary">Closed</Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white hover:bg-green-600">Open</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  No admission cycle exists for{" "}
                  <span className="font-medium">{yearLabel(year)}</span> yet.
                </div>
                <Button
                  onClick={openCreate}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create admission cycle
                </Button>
              </div>
            )}
          </section>

          {/* Phases (placeholder) */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Workflow className="h-4 w-4" /> Admission Phases
            </h3>
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Phase management is under construction.
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Create admission cycle */}
      <Dialog open={isCycleOpen} onOpenChange={setIsCycleOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Create Admission Cycle</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">
                Session<span className="text-red-500"> *</span>
              </Label>
              <SearchableSelect
                value={cycleForm.sessionId}
                onChange={(v) => setCycleForm((p) => ({ ...p, sessionId: v }))}
                options={sessions.map((o) => ({ value: String(o.id), label: o.name }))}
                placeholder="Select Session"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={cycleForm.startDate}
                onChange={(e) => setCycleForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Last Date</Label>
              <Input
                type="date"
                value={cycleForm.lastDate}
                onChange={(e) => setCycleForm((p) => ({ ...p, lastDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCycleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
