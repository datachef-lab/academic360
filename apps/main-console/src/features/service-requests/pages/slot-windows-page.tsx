import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  listSlotWindows,
  createSlotWindow,
  updateSlotWindow,
  deleteSlotWindow,
  type SlotWindow,
  type SlotWindowPayload,
} from "../services/service-requests.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Loader2, RefreshCw } from "lucide-react";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEEKDAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const EMPTY_FORM: SlotWindowPayload & { id?: number } = {
  weekday: "MON",
  startTime: "09:00",
  endTime: "17:00",
  slotDurationMinutes: 60,
  capacityPerSlot: 10,
  isActive: true,
  effectiveFrom: "",
  effectiveTo: "",
};

export default function SlotWindowsPage() {
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departmentIdInput, setDepartmentIdInput] = useState("");
  const [windows, setWindows] = useState<SlotWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!departmentId) return;
    setLoading(true);
    try {
      const data = await listSlotWindows(departmentId);
      setWindows(data);
    } catch {
      toast.error("Failed to load slot windows");
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = () => {
    const id = parseInt(departmentIdInput);
    if (isNaN(id) || id <= 0) {
      toast.error("Enter a valid department ID");
      return;
    }
    setDepartmentId(id);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (w: SlotWindow) => {
    setEditId(w.id);
    setForm({
      weekday: w.weekday,
      startTime: w.startTime,
      endTime: w.endTime,
      slotDurationMinutes: w.slotDurationMinutes,
      capacityPerSlot: w.capacityPerSlot,
      isActive: w.isActive,
      effectiveFrom: w.effectiveFrom ?? "",
      effectiveTo: w.effectiveTo ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!departmentId) return;
    setSaving(true);
    try {
      const payload: SlotWindowPayload = {
        weekday: form.weekday,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: Number(form.slotDurationMinutes),
        capacityPerSlot: Number(form.capacityPerSlot),
        isActive: form.isActive,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
      };
      if (editId !== null) {
        await updateSlotWindow(departmentId, editId, payload);
        toast.success("Slot window updated");
      } else {
        await createSlotWindow(departmentId, payload);
        toast.success("Slot window created");
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to save slot window");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (windowId: number) => {
    if (!departmentId) return;
    if (!confirm("Delete this slot window? Existing bookings are not affected.")) return;
    setDeleting(windowId);
    try {
      await deleteSlotWindow(departmentId, windowId);
      toast.success("Slot window deleted");
      await load();
    } catch {
      toast.error("Failed to delete slot window");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Slot Window Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure recurring bookable time windows per department.
        </p>
      </div>

      {/* Department selector */}
      <div className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <Label htmlFor="dept-id" className="mb-1 block text-sm">
            Department ID
          </Label>
          <Input
            id="dept-id"
            placeholder="Enter department ID…"
            value={departmentIdInput}
            onChange={(e) => setDepartmentIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-48"
          />
        </div>
        <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 text-white">
          Load
        </Button>
        {departmentId && (
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {/* Windows table */}
      {departmentId && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Department {departmentId} — Slot Windows
            </h2>
            <Button
              onClick={openCreate}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Window
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            </div>
          ) : windows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-muted-foreground text-sm">
              No slot windows configured. Add one to get started.
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 overflow-x-auto bg-white">
              <div className="min-w-[700px]">
                {/* Header */}
                <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <div className="w-[14%] px-3 py-2">Day</div>
                  <div className="w-[16%] px-3 py-2">Start</div>
                  <div className="w-[16%] px-3 py-2">End</div>
                  <div className="w-[14%] px-3 py-2">Duration</div>
                  <div className="w-[14%] px-3 py-2">Capacity</div>
                  <div className="w-[12%] px-3 py-2">Status</div>
                  <div className="w-[14%] px-3 py-2 text-center">Actions</div>
                </div>

                {windows.map((w) => (
                  <div
                    key={w.id}
                    className="flex border-b border-slate-100 hover:bg-slate-50 text-sm"
                  >
                    <div className="w-[14%] px-3 py-3 font-medium">
                      {WEEKDAY_LABELS[w.weekday] ?? w.weekday}
                    </div>
                    <div className="w-[16%] px-3 py-3 font-mono">{w.startTime}</div>
                    <div className="w-[16%] px-3 py-3 font-mono">{w.endTime}</div>
                    <div className="w-[14%] px-3 py-3">{w.slotDurationMinutes} min</div>
                    <div className="w-[14%] px-3 py-3">{w.capacityPerSlot} seats</div>
                    <div className="w-[12%] px-3 py-3">
                      <Badge
                        className={`text-xs px-2 py-0.5 rounded-full border-0 ${
                          w.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {w.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="w-[14%] px-3 py-3 flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:text-violet-700 hover:bg-violet-50"
                        onClick={() => openEdit(w)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                        disabled={deleting === w.id}
                        onClick={() => handleDelete(w.id)}
                      >
                        {deleting === w.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Edit Slot Window" : "Add Slot Window"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            {/* Weekday */}
            <div className="space-y-1.5">
              <Label>Weekday</Label>
              <Select
                value={form.weekday}
                onValueChange={(v) => setForm((f) => ({ ...f, weekday: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {WEEKDAY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Duration + capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={form.slotDurationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slotDurationMinutes: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity per Slot</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={form.capacityPerSlot}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacityPerSlot: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Effective range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eff-from">Effective From (optional)</Label>
                <Input
                  id="eff-from"
                  type="date"
                  value={form.effectiveFrom ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eff-to">Effective To (optional)</Label>
                <Input
                  id="eff-to"
                  type="date"
                  value={form.effectiveTo ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="active-toggle"
                checked={form.isActive ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="active-toggle">Active</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editId !== null ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
