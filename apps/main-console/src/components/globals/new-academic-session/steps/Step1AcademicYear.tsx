import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useCreateAcademicYear } from "@/hooks/useAcademicYears";
import type { NewAcademicSessionDraft } from "../types";
import { Loader2 } from "lucide-react";

type Props = {
  draft: NewAcademicSessionDraft;
  onDraftChange: (patch: Partial<NewAcademicSessionDraft>) => void;
};

export function Step1AcademicYear({ draft, onDraftChange }: Props) {
  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();
  const { mutateAsync: createYear, isLoading: creating } = useCreateAcademicYear();

  const [mode, setMode] = React.useState<"select" | "create">(
    draft.academicYearId ? "select" : "create",
  );
  const [newLabel, setNewLabel] = React.useState("");
  const [newCurrent, setNewCurrent] = React.useState(false);

  React.useEffect(() => {
    void loadAcademicYears();
  }, [loadAcademicYears]);

  const selectedId = draft.academicYearId ?? undefined;

  const handleCreate = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const res = await createYear({
      academicYear: { year: trimmed, isCurrentYear: newCurrent },
    });
    await loadAcademicYears();
    if (res?.id != null) {
      onDraftChange({
        academicYearId: res.id,
        academicYearLabel: res.year,
        isCurrentYear: res.isCurrentYear ?? false,
      });
      setNewLabel("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Academic year & session</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose an existing year from the database, or create a new one. This choice is stored in
          your draft until you confirm in the last step.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("select")}
        >
          Select existing
        </Button>
        <Button
          type="button"
          variant={mode === "create" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("create")}
        >
          Create new
        </Button>
      </div>

      {mode === "select" ? (
        <div className="space-y-2">
          <Label>Academic year</Label>
          <Select
            value={selectedId != null ? String(selectedId) : ""}
            onValueChange={(v) => {
              const id = Number(v);
              const row = availableAcademicYears.find((y) => y.id === id);
              onDraftChange({
                academicYearId: id,
                academicYearLabel: row?.year ?? undefined,
                isCurrentYear: row?.isCurrentYear ?? undefined,
              });
            }}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose academic year…" />
            </SelectTrigger>
            <SelectContent>
              {availableAcademicYears.map((y) =>
                y.id != null ? (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.year}
                    {y.isCurrentYear ? " (current)" : ""}
                  </SelectItem>
                ) : null,
              )}
            </SelectContent>
          </Select>
          {draft.academicYearLabel && (
            <p className="text-sm text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">{draft.academicYearLabel}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="wizard-new-year">New academic year label</Label>
            <Input
              id="wizard-new-year"
              placeholder='e.g. "2026–2027"'
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="wizard-new-cur">Set as current year</Label>
            <Switch id="wizard-new-cur" checked={newCurrent} onCheckedChange={setNewCurrent} />
          </div>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating || !newLabel.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create & attach to this draft"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function step1Valid(draft: NewAcademicSessionDraft): boolean {
  return draft.academicYearId != null && draft.academicYearLabel != null;
}
