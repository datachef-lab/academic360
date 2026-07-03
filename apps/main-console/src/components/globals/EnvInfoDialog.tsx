import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAppEnv } from "@/lib/app-env";

/**
 * Environment indicator (development / staging ONLY — renders nothing in
 * production). Sits at the top of the sidebar, above the modules; clicking it
 * opens a dialog explaining which mode the console is running in. This is
 * purely environment info — not the user's profile or access.
 */
export function EnvInfoDialog() {
  const [open, setOpen] = useState(false);
  const env = useAppEnv();

  if (env === "production") return null;

  const badgeClass = env === "staging" ? "bg-pink-500 text-white" : "bg-blue-600 text-white";
  const label = env.toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${label} environment — click for info`}
        className="mx-3 mb-1 mt-1 flex items-center justify-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold tracking-wider text-white transition-colors hover:bg-white/25"
      >
        <Info className="h-3.5 w-3.5" />
        {label} MODE
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Environment
              <Badge className={badgeClass}>{label} MODE</Badge>
            </DialogTitle>
            <DialogDescription>
              This console is currently running against the <b>{env}</b> environment.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <img
              src="/profile-info-illustration.jpg"
              alt="Environment illustration"
              className="max-h-80 w-full rounded-xl border border-slate-300 object-contain shadow"
            />

            <p className="text-center text-sm text-muted-foreground">
              {env === "staging"
                ? "Staging mirrors production for pre-release testing. Data here can be reset or overwritten at any time — nothing done here affects the live system."
                : "Development is the active build environment. Data here is test data and may change or be wiped frequently — nothing done here affects the live system."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
