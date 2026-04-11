import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import type { NewAcademicSessionDraft } from "./new-academic-session/types";
import {
  clearDraft,
  defaultDraft,
  loadDraft,
  saveDraft,
} from "./new-academic-session/draft-storage";
import { Step1AcademicYear, step1Valid } from "./new-academic-session/steps/Step1AcademicYear";
import { Step2Promotion, step2Valid } from "./new-academic-session/steps/Step2Promotion";
import { Step3Confirm } from "./new-academic-session/steps/Step3Confirm";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap";

const STEPS = [
  { n: 1 as const, title: "Academic year & session", short: "Year" },
  { n: 2 as const, title: "Promotion", short: "Promotion" },
  { n: 3 as const, title: "Confirm", short: "Confirm" },
];

type NewAcademicSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function mergeLoadedDraft(saved: NewAcademicSessionDraft): NewAcademicSessionDraft {
  const base = defaultDraft(2);
  if (saved.version !== 2) return base;
  const furthest = Math.max(saved.furthestStep ?? 1, saved.step ?? 1, 1);
  return {
    ...base,
    ...saved,
    furthestStep: Math.min(3, furthest) as 1 | 2 | 3,
    step: saved.step >= 1 && saved.step <= 3 ? saved.step : 2,
  };
}

function isStepValid(step: number, d: NewAcademicSessionDraft): boolean {
  switch (step) {
    case 1:
      return step1Valid(d);
    case 2:
      return step2Valid(d);
    case 3:
      return true;
    default:
      return false;
  }
}

export function NewAcademicSessionDialog({ open, onOpenChange }: NewAcademicSessionDialogProps) {
  const [draft, setDraft] = React.useState<NewAcademicSessionDraft>(() => defaultDraft(2));
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    const id = "new-academic-session-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const saved = loadDraft();
    setDraft(saved ? mergeLoadedDraft(saved) : defaultDraft(2));
  }, [open]);

  const updateDraft = React.useCallback((patch: Partial<NewAcademicSessionDraft>) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const goStep = (target: NewAcademicSessionDraft["step"]) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        step: target,
        furthestStep: Math.max(prev.furthestStep ?? 1, target),
        updatedAt: new Date().toISOString(),
      };
      saveDraft(next);
      return next;
    });
  };

  const handleNext = () => {
    const s = draft.step;
    if (!isStepValid(s, draft)) {
      toast.error("Complete this step before continuing.");
      return;
    }
    if (s >= 3) return;
    const next = (s + 1) as NewAcademicSessionDraft["step"];
    goStep(next);
  };

  const handleBack = () => {
    if (draft.step <= 1) return;
    goStep((draft.step - 1) as NewAcademicSessionDraft["step"]);
  };

  const handleStepClick = (n: NewAcademicSessionDraft["step"]) => {
    const furthest = draft.furthestStep ?? 1;
    if (n > furthest) {
      toast.message("Complete prior steps first, or use Next.");
      return;
    }
    goStep(n);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      clearDraft();
      toast.success("Draft confirmed and cleared.");
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  const handleDismiss = (nextOpen: boolean) => {
    if (!nextOpen) {
      saveDraft(draft);
    }
    onOpenChange(nextOpen);
  };

  const furthest = draft.furthestStep ?? 1;

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent
        className={cn(
          "!flex h-[min(960px,94vh)] max-h-[94vh] w-[min(1680px,99vw)] max-w-[99vw] flex-col gap-0 overflow-hidden p-0",
          "sm:max-w-[min(1680px,99vw)]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="relative hidden w-[min(100%,320px)] shrink-0 flex-col border-b bg-gradient-to-b from-muted/50 to-muted/20 p-6 lg:border-b-0 lg:border-r">
            <div
              className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-dashed bg-gradient-to-br from-violet-200/60 via-background to-amber-100/50 text-center shadow-inner"
              role="img"
              aria-label="Placeholder for institution hero image"
            >
              <span className="max-w-[200px] px-3 text-xs font-medium leading-relaxed text-muted-foreground">
                Illustration / banner image
                <br />
                <span className="text-[11px] opacity-80">(Configure later)</span>
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              Academic session &amp; promotion
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Progress is saved as a draft on this device until you confirm in the final step.
            </p>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b bg-muted/30 px-4 py-3 lg:hidden">
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed bg-gradient-to-r from-violet-200/40 to-amber-100/40 text-[11px] text-muted-foreground">
                Image placeholder — configure later
              </div>
            </div>
            <DialogHeader className="border-b px-5 py-4 text-left sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl">
                    Academic session &amp; promotion
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm">
                    Guided setup — {STEPS.find((x) => x.n === draft.step)?.title ?? ""}
                  </DialogDescription>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  Draft
                </Badge>
              </div>

              <nav className="mt-4 flex flex-wrap items-center gap-1" aria-label="Wizard steps">
                {STEPS.map(({ n, short, title }, idx) => {
                  const active = draft.step === n;
                  const reachable = n <= furthest;
                  return (
                    <React.Fragment key={n}>
                      {idx > 0 && (
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                          aria-hidden
                        />
                      )}
                      <button
                        type="button"
                        disabled={!reachable}
                        onClick={() => handleStepClick(n)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-[13px]",
                          active &&
                            "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20",
                          !active && reachable && "bg-muted text-foreground hover:bg-muted/80",
                          !reachable && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span className="hidden sm:inline">
                          {n}. {title}
                        </span>
                        <span className="sm:hidden">
                          {n}. {short}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {draft.step === 1 && <Step1AcademicYear draft={draft} onDraftChange={updateDraft} />}
              {draft.step === 2 && <Step2Promotion draft={draft} onDraftChange={updateDraft} />}
              {draft.step === 3 && <Step3Confirm draft={draft} />}
            </div>

            <DialogFooter className="border-t bg-muted/20 px-5 py-4 sm:px-7">
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDismiss(false)}
                  className="order-last sm:order-first"
                >
                  Close
                </Button>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={draft.step <= 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  {draft.step < 3 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void handleConfirm()}
                      disabled={confirming}
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming…
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
