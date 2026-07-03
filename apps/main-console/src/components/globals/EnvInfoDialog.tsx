import { useEffect, useState } from "react";
import {
  BellRing,
  Code2,
  Database,
  FlaskConical,
  Info,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppEnv } from "@/lib/app-env";
import axiosInstance from "@/utils/api";

type EnvDetails = {
  env: string;
  developer?: {
    email: string | null;
    phone: string | null;
    user: { name: string; image: string | null; type: string } | null;
  };
  recipients?: Array<{
    id: number;
    name: string;
    image: string | null;
    email: string;
    phone: string | null;
    type: string;
  }>;
};

function initialsOf(name: string | null | undefined): string {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Environment indicator (development / staging ONLY — renders nothing in
 * production). Sits at the top of the sidebar, above the modules; clicking it
 * opens a dialog explaining which mode the console is running in and where
 * this environment's notifications go.
 */
export function EnvInfoDialog() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<EnvDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const env = useAppEnv();

  useEffect(() => {
    if (!open || details || loading) return;
    setLoading(true);
    axiosInstance
      .get("/api/app-env/details")
      .then((res) => setDetails(res.data ?? null))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [open, details, loading]);

  if (env === "production") return null;

  const badgeClass = env === "staging" ? "bg-blue-600 text-white" : "bg-[#172554] text-white";
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
        <DialogContent className="h-[80vh] max-h-[80vh] w-[70vw] max-w-[70vw] overflow-y-auto p-0">
          <div className="grid h-full md:grid-cols-[2fr_3fr]">
            {/* Left column: illustration filling the panel */}
            <div className="max-h-40 overflow-hidden border-slate-300 md:max-h-none md:border-r">
              <img
                src="/profile-info-illustration.jpg"
                alt="Environment illustration"
                className="h-full w-full rounded-t-lg object-cover md:rounded-l-lg md:rounded-tr-none"
              />
            </div>

            {/* Right column: header + content */}
            <div className="flex flex-col gap-4 p-6">
              <DialogHeader className="border-b border-slate-300 pb-3">
                <DialogTitle className="flex items-center gap-2">
                  Environment
                  <Badge className={badgeClass}>{label} MODE</Badge>
                </DialogTitle>
                <DialogDescription>
                  This console is currently running against the <b>{env}</b> environment.
                </DialogDescription>
              </DialogHeader>

              {/* What this mode means */}
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  {env === "staging" ? (
                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  ) : (
                    <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-[#172554]" />
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
              </div>

              {/* Notification routing */}
              <div className="mt-auto flex flex-col gap-3 rounded-lg border border-slate-300 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BellRing className="h-4 w-4 text-violet-600" />
                  Notification routing
                </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : env === "development" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    All notifications from development go <b>only to the developer</b> contact
                    configured in the backend environment — never to staff or students.
                  </p>
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{details?.developer?.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="truncate">{details?.developer?.phone || "—"}</span>
                    </div>
                  </div>
                  {details?.developer?.user ? (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-muted/30 p-3">
                      <Avatar className="h-10 w-10">
                        {details.developer.user.image ? (
                          <AvatarImage
                            src={details.developer.user.image}
                            alt={details.developer.user.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-slate-700 font-bold text-white">
                          {initialsOf(details.developer.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {details.developer.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">Registered console user</p>
                      </div>
                      <Badge variant="secondary">{details.developer.user.type}</Badge>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Staging notifications go to <b>college staff only</b> (never actual students) —
                    specifically those with staging notifications enabled:
                  </p>
                  {details?.recipients?.length ? (
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.recipients.map((r, i) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    {r.image ? <AvatarImage src={r.image} alt={r.name} /> : null}
                                    <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                                      {initialsOf(r.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="max-w-[120px] truncate text-xs font-medium">
                                    {r.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[140px] truncate text-xs">
                                {r.email}
                              </TableCell>
                              <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-[10px]">
                                  {r.type}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-muted/30 p-3 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" /> No staff currently have staging notifications
                      enabled.
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
