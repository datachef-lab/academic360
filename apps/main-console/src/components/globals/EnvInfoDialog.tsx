import { useState } from "react";
import { BellRing, Code2, Database, FlaskConical, Info, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAppEnv } from "@/lib/app-env";
import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * Environment indicator (development / staging ONLY — renders nothing in
 * production). Sits at the top of the sidebar, above the modules; clicking it
 * opens a dialog explaining which mode the console is running in. This is
 * purely environment info — not the user's profile or access.
 */
export function EnvInfoDialog() {
  const [open, setOpen] = useState(false);
  const env = useAppEnv();
  const { user } = useAuth();
  const stagingNotifEnabled =
    (user as { sendStagingNotifications?: boolean } | null)?.sendStagingNotifications === true;

  if (env === "production") return null;

  const badgeClass = env === "staging" ? "bg-blue-600 text-white" : "bg-slate-800 text-white";
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

            <div className="w-full space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                {env === "staging" ? (
                  <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                ) : (
                  <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                )}
                <span>
                  {env === "staging"
                    ? "Staging mirrors production for pre-release testing of upcoming changes."
                    : "Development is the active build environment for work in progress."}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Data here is test data — it can change, be reset or overwritten at any time.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Nothing done here affects the live (production) system.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                <span>
                  Notifications from this environment go to <b>college staff only</b> — never to
                  actual students. Your account&apos;s staging-notification flag is{" "}
                  {stagingNotifEnabled ? (
                    <b className="text-emerald-600">ENABLED</b>
                  ) : (
                    <b className="text-red-500">DISABLED</b>
                  )}
                  .
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
