/**
 * Library Digital Twin v1 — a 2D floor plan editor + viewer.
 *
 * Left column: list of saved plans for the active branch + a New / Save UI.
 * Right column: an SVG grid you can drag rack rectangles onto. The viewer
 * colour-codes each rack by inventory density (copyCount) so "hot" zones pop.
 *
 * Lives at /dashboard/library/digital-twin.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Plus, Save, Trash2 } from "lucide-react";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";
import {
  createFloorPlan,
  deleteFloorPlan,
  getFloorPlanWithInventory,
  listFloorPlans,
  updateFloorPlan,
  type FloorPlanLayoutRack,
  type FloorPlanSummary,
  type FloorPlanWithInventory,
} from "@/services/library-floor-plan.service";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 500;
const SNAP = 20;

function snap(n: number): number {
  return Math.round(n / SNAP) * SNAP;
}

function heatColour(copyCount: number): string {
  // Low-to-high: pale → indigo → rose
  if (copyCount === 0) return "#e2e8f0"; // slate-200
  if (copyCount < 10) return "#c7d2fe"; // indigo-200
  if (copyCount < 30) return "#818cf8"; // indigo-400
  if (copyCount < 80) return "#6366f1"; // indigo-500
  return "#e11d48"; // rose-600
}

export default function DigitalTwinPage() {
  const [activeBranchId] = useActiveLibraryBranchId();
  const [plans, setPlans] = useState<FloorPlanSummary[]>([]);
  const [selected, setSelected] = useState<FloorPlanWithInventory | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [racks, setRacks] = useState<FloorPlanLayoutRack[]>([]);
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await listFloorPlans(activeBranchId ?? undefined);
      setPlans(res.payload ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [activeBranchId]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const loadPlan = async (id: number) => {
    try {
      const res = await getFloorPlanWithInventory(id);
      const p = res.payload!;
      setSelected(p);
      setName(p.name);
      setRacks(p.layout.racks);
      setEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not load plan.");
    }
  };

  const newPlan = () => {
    setSelected(null);
    setName("New floor plan");
    setRacks([]);
    setEditing(true);
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required.");
    if (activeBranchId == null) return toast.error("Pick a branch first.");
    try {
      const layout = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, racks };
      if (selected) {
        await updateFloorPlan(selected.id, {
          branchId: activeBranchId,
          name: name.trim(),
          layout,
        });
      } else {
        const res = await createFloorPlan({
          branchId: activeBranchId,
          name: name.trim(),
          layout,
        });
        await loadPlan(res.payload!.id);
      }
      toast.success("Saved.");
      void fetchPlans();
      setEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Save failed.");
    }
  };

  const onDelete = async () => {
    if (!selected) return;
    if (!confirm("Delete this floor plan?")) return;
    await deleteFloorPlan(selected.id);
    setSelected(null);
    setRacks([]);
    void fetchPlans();
  };

  const addRack = () => {
    const id = `rack-${Date.now()}`;
    setRacks([
      ...racks,
      { id, rackId: null, x: 40, y: 40, w: 120, h: 60, label: `Rack ${racks.length + 1}` },
    ]);
  };

  const removeRack = (id: string) => setRacks(racks.filter((r) => r.id !== id));

  const onRackMouseDown = (e: React.MouseEvent, id: string) => {
    if (!editing) return;
    const target = e.currentTarget as SVGRectElement;
    const bbox = (target.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setDragging({ x: e.clientX - bbox.left, y: e.clientY - bbox.top });
    const r = racks.find((r) => r.id === id);
    if (!r) return;
    const startX = r.x;
    const startY = r.y;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - bbox.left - (e.clientX - bbox.left);
      const dy = ev.clientY - bbox.top - (e.clientY - bbox.top);
      setRacks((prev) =>
        prev.map((rr) =>
          rr.id === id
            ? {
                ...rr,
                x: snap(Math.max(0, Math.min(DEFAULT_WIDTH - rr.w, startX + dx))),
                y: snap(Math.max(0, Math.min(DEFAULT_HEIGHT - rr.h, startY + dy))),
              }
            : rr,
        ),
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDragging(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Inventory data — for view mode, merge copyCount onto racks from selected.layout.racks.
  const viewRacks =
    !editing && selected
      ? selected.layout.racks
      : racks.map((r) => ({ ...r, copyCount: 0, recentGateEvents: 0 }));

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={LayoutGrid}
        title="Library Digital Twin"
        subtitle="2D floor plan of each branch with live inventory density per rack."
        actions={
          <>
            <Button variant="outline" onClick={newPlan}>
              <Plus className="mr-1 h-4 w-4" />
              New plan
            </Button>
            {selected && !editing ? (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : null}
            {editing ? (
              <Button onClick={save}>
                <Save className="mr-1 h-4 w-4" />
                Save
              </Button>
            ) : null}
            {selected ? (
              <Button variant="outline" onClick={onDelete} className="text-rose-600">
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
        <Card className="min-w-0">
          <CardContent className="space-y-2 p-3">
            <Label className="text-xs">Saved plans (branch-scoped)</Label>
            {plans.length === 0 ? (
              <p className="text-xs text-muted-foreground">No plans yet for this branch.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {plans.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void loadPlan(p.id)}
                      className={`w-full rounded-md px-2 py-1 text-left hover:bg-slate-100 ${
                        selected?.id === p.id ? "bg-indigo-50 text-indigo-700" : ""
                      }`}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {editing ? (
              <>
                <div className="pt-2">
                  <Label className="text-xs">Plan name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <Button variant="secondary" onClick={addRack} className="w-full">
                  <Plus className="mr-1 h-4 w-4" /> Add rack
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3">
            <div className="overflow-auto rounded-md border bg-slate-50">
              <svg
                width={DEFAULT_WIDTH}
                height={DEFAULT_HEIGHT}
                viewBox={`0 0 ${DEFAULT_WIDTH} ${DEFAULT_HEIGHT}`}
                style={{ cursor: editing ? (dragging ? "grabbing" : "grab") : "default" }}
              >
                {/* Grid */}
                <defs>
                  <pattern id="grid" width={SNAP} height={SNAP} patternUnits="userSpaceOnUse">
                    <path
                      d={`M ${SNAP} 0 L 0 0 0 ${SNAP}`}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {viewRacks.map((r) => {
                  const fill = "copyCount" in r ? heatColour(r.copyCount as number) : "#c7d2fe";
                  return (
                    <g key={r.id}>
                      <rect
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        fill={fill}
                        stroke="#1e293b"
                        strokeWidth="1"
                        rx={4}
                        onMouseDown={(e) => onRackMouseDown(e, r.id)}
                      />
                      <text
                        x={r.x + r.w / 2}
                        y={r.y + r.h / 2 - 4}
                        textAnchor="middle"
                        className="select-none text-xs font-semibold fill-slate-800"
                      >
                        {r.label ?? "Rack"}
                      </text>
                      {"copyCount" in r ? (
                        <text
                          x={r.x + r.w / 2}
                          y={r.y + r.h / 2 + 10}
                          textAnchor="middle"
                          className="select-none text-[10px] fill-slate-700"
                        >
                          {(r as { copyCount: number }).copyCount} copies
                        </text>
                      ) : null}
                      {editing ? (
                        <text
                          x={r.x + r.w - 6}
                          y={r.y + 12}
                          textAnchor="end"
                          className="cursor-pointer select-none text-xs fill-rose-600"
                          onClick={() => removeRack(r.id)}
                        >
                          ×
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {editing
                ? "Drag rack rectangles to position them. Snap = 20px."
                : "Read-only view. Colour intensity reflects copies stored on that rack."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
