import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";
import { studentAvatarUrl } from "@/utils/studentAvatarUrl";
import {
  getResendVerifiers,
  startResendOtp,
  verifyResendOtp,
  confirmResend,
  getResendStatus,
  formatNotificationTime,
  type ResendMode,
  type ResendVerifier,
  type ResendRecipient,
} from "@/features/notifications/api/notifications-api";
import { humanizeFailureReason } from "@/features/notifications/utils/format";
import { VariantBadge } from "@/features/notifications/components/badges";

type Step = "intro" | "otp" | "recipients" | "result";

const MODE_LABEL: Record<ResendMode, string> = {
  development: "development",
  staging: "staging",
  production: "PRODUCTION",
};

const MODE_HINT: Record<ResendMode, string> = {
  development:
    "The verification code and the resent notification both go to the developer contact.",
  staging: "The resent notification goes only to the staging staff you select below.",
  production: "The resent notification goes to the REAL recipient.",
};

function VerifierTable({ verifiers }: { verifiers: ResendVerifier[] }) {
  return (
    <FeesTable framed dense fixed={false}>
      <FeesTableHeader>
        <FeesTableHead className="w-14">Sr No</FeesTableHead>
        <FeesTableHead>User Name</FeesTableHead>
        <FeesTableHead>Type</FeesTableHead>
        <FeesTableHead>Email</FeesTableHead>
        <FeesTableHead>Phone</FeesTableHead>
        <FeesTableHead>WhatsApp</FeesTableHead>
      </FeesTableHeader>
      <FeesTableBody>
        {verifiers.map((v, i) => (
          <FeesTableRow key={v.userId ?? `x${i}`}>
            <FeesTableCell className="text-center">{i + 1}</FeesTableCell>
            <FeesTableCell className="font-medium">{v.name}</FeesTableCell>
            <FeesTableCell>{v.type ?? "—"}</FeesTableCell>
            <FeesTableCell className="[overflow-wrap:anywhere]">{v.email ?? "—"}</FeesTableCell>
            <FeesTableCell>{v.phone ?? "—"}</FeesTableCell>
            <FeesTableCell>{v.whatsapp ?? "—"}</FeesTableCell>
          </FeesTableRow>
        ))}
      </FeesTableBody>
    </FeesTable>
  );
}

/**
 * Confirm-step table. Development/production rows stay checked and locked;
 * staging staff rows are individually selectable.
 */
function RecipientsTable({
  recipients,
  selected,
  onToggle,
}: {
  recipients: ResendRecipient[];
  selected: Set<number>;
  onToggle: (userId: number) => void;
}) {
  return (
    <FeesTable framed dense fixed={false}>
      <FeesTableHeader>
        <FeesTableHead className="w-10 text-center">✓</FeesTableHead>
        <FeesTableHead className="w-14">Sr No</FeesTableHead>
        <FeesTableHead>User Name</FeesTableHead>
        <FeesTableHead>Type</FeesTableHead>
        <FeesTableHead>Email</FeesTableHead>
        <FeesTableHead>Phone</FeesTableHead>
        <FeesTableHead>WhatsApp</FeesTableHead>
      </FeesTableHeader>
      <FeesTableBody>
        {recipients.map((r, i) => (
          <FeesTableRow key={r.userId ?? `x${i}`}>
            <FeesTableCell className="text-center">
              <Checkbox
                checked={r.selectable && r.userId != null ? selected.has(r.userId) : true}
                disabled={!r.selectable || r.userId == null}
                onCheckedChange={() => r.userId != null && onToggle(r.userId)}
                aria-label={`Select ${r.name}`}
              />
            </FeesTableCell>
            <FeesTableCell className="text-center">{i + 1}</FeesTableCell>
            <FeesTableCell className="font-medium">
              <span className="flex items-center gap-2">
                {r.studentUid && (
                  <img
                    src={studentAvatarUrl(r.studentUid)}
                    alt=""
                    className="h-6 w-6 rounded-full border border-[#ddd] object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                {r.name}
                {r.studentUid && <span className="text-xs text-[#888]">({r.studentUid})</span>}
              </span>
            </FeesTableCell>
            <FeesTableCell>{r.type ?? "—"}</FeesTableCell>
            <FeesTableCell className="[overflow-wrap:anywhere]">{r.email ?? "—"}</FeesTableCell>
            <FeesTableCell>{r.phone ?? "—"}</FeesTableCell>
            <FeesTableCell>{r.whatsapp ?? "—"}</FeesTableCell>
          </FeesTableRow>
        ))}
      </FeesTableBody>
    </FeesTable>
  );
}

export function ResendDialog({
  open,
  onOpenChange,
  notificationId,
  masterName,
  variant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId: number;
  masterName: string | null;
  variant?: string;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [busy, setBusy] = useState(false);
  const [loadingVerifiers, setLoadingVerifiers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ResendMode>("development");
  const [verifiers, setVerifiers] = useState<ResendVerifier[]>([]);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [recipients, setRecipients] = useState<ResendRecipient[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [result, setResult] = useState<{
    status: "PENDING" | "SENT" | "FAILED";
    sentAt: string | null;
    failedReason: string | null;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const errText = (e: unknown, fallback: string) => {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return msg || fallback;
  };

  // Reset + load the verifier list on open; stop polling on close.
  useEffect(() => {
    if (open) {
      setStep("intro");
      setBusy(false);
      setError(null);
      setOtp("");
      setToken("");
      setResult(null);
      setVerifiers([]);
      setLoadingVerifiers(true);
      getResendVerifiers(notificationId)
        .then((res) => {
          setMode(res.mode);
          setVerifiers(res.verifiers);
        })
        .catch((e) => setError(errText(e, "Could not load the verifier accounts.")))
        .finally(() => setLoadingVerifiers(false));
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [open, notificationId]);

  const handleSendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await startResendOtp(notificationId);
      setMode(res.mode);
      setVerifiers(res.verifiers);
      setOtp("");
      setStep("otp");
    } catch (e) {
      setError(errText(e, "Could not send the verification code."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyResendOtp(notificationId, otp);
      setMode(res.mode);
      setToken(res.token);
      setRecipients(res.recipients);
      setSelected(
        new Set(
          res.recipients.filter((r) => r.selectable && r.userId).map((r) => r.userId as number),
        ),
      );
      setStep("recipients");
    } catch (e) {
      setError(errText(e, "Verification failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const selectable = recipients.some((r) => r.selectable);
      const res = await confirmResend(
        notificationId,
        token,
        selectable ? Array.from(selected) : undefined,
      );
      setStep("result");
      setResult({ status: "PENDING", sentAt: null, failedReason: null });
      const newId = res.newNotificationId;
      let ticks = 0;
      pollRef.current = setInterval(async () => {
        ticks += 1;
        try {
          const s = await getResendStatus(notificationId, newId);
          setResult(s);
          if (s.status !== "PENDING" || ticks > 20) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {
          // keep polling until the tick limit
        }
      }, 3000);
    } catch (e) {
      setError(errText(e, "Could not queue the resend."));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (userId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const selectableCount = recipients.filter((r) => r.selectable).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1150px] overflow-hidden p-0 xl:max-w-[72vw]">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_2fr]">
          {/* Left: illustration */}
          <div className="hidden items-center justify-center border-r border-[#eee] bg-[#faf8ff] p-6 md:flex">
            <img
              src="/profile-info-illustration.jpg"
              alt="Verify identity"
              className="max-h-[380px] w-full object-contain"
            />
          </div>

          {/* Right: stepper */}
          <div className="flex max-h-[88vh] min-h-[560px] flex-col overflow-y-auto p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#7c3aed]" />
                Resend notification{masterName ? ` — ${masterName}` : ""}
                {variant && <VariantBadge variant={variant} />}
              </DialogTitle>
            </DialogHeader>

            {error && (
              <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            {step === "intro" && (
              <div className="space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  This is a <span className="font-bold">{MODE_LABEL[mode]}</span> environment.{" "}
                  {MODE_HINT[mode]}
                </div>
                <p className="text-sm leading-relaxed text-[#444]">
                  Resending requires verification. A one-time code will be sent to the accounts
                  below; enter it here to continue.
                </p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    Verification code will be sent to
                  </p>
                  {loadingVerifiers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#7c3aed]" />
                    </div>
                  ) : verifiers.length > 0 ? (
                    <VerifierTable verifiers={verifiers} />
                  ) : (
                    !error && (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                        No verifier accounts configured. Mark at least one active staff user as a
                        notification verifier to resend in this environment.
                      </p>
                    )
                  )}
                </div>
                <Button
                  className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  disabled={busy || loadingVerifiers || verifiers.length === 0}
                  onClick={() => void handleSendCode()}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send verification code
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  This is a <span className="font-bold">{MODE_LABEL[mode]}</span> environment.{" "}
                  {MODE_HINT[mode]}
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    Enter the 6-digit code
                  </p>
                  <div className="flex items-center gap-2">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <Button
                      className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                      disabled={busy || otp.length !== 6}
                      onClick={() => void handleVerify()}
                    >
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={() => void handleSendCode()}>
                      Resend code
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    Code sent to
                  </p>
                  <VerifierTable verifiers={verifiers} />
                </div>
              </div>
            )}

            {step === "recipients" && (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Verified. Review who will receive this notification in{" "}
                  <span className="font-bold">{MODE_LABEL[mode]}</span>.
                </div>
                {recipients.length === 0 ? (
                  <p className="text-sm text-[#888]">No recipients resolved.</p>
                ) : (
                  <RecipientsTable recipients={recipients} selected={selected} onToggle={toggle} />
                )}
                <p className="text-[11px] text-[#888]">{MODE_HINT[mode]}</p>
                <Button
                  className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  disabled={busy || (selectableCount > 0 && selected.size === 0)}
                  onClick={() => void handleConfirm()}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Confirm & resend
                </Button>
              </div>
            )}

            {step === "result" && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                {!result || result.status === "PENDING" ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
                    <p className="text-sm font-medium text-[#444]">
                      Queued — waiting for delivery…
                    </p>
                    <p className="text-xs text-[#888]">
                      This updates automatically as the worker processes the queue.
                    </p>
                  </>
                ) : result.status === "SENT" ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">Notification sent</p>
                    {result.sentAt && (
                      <p className="text-xs text-[#888]">{formatNotificationTime(result.sentAt)}</p>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-10 w-10 text-rose-600" />
                    <p className="text-sm font-semibold text-rose-700">Delivery failed</p>
                    {result.failedReason && (
                      <p className="max-w-sm text-xs text-rose-600">
                        {humanizeFailureReason(result.failedReason).summary}
                      </p>
                    )}
                  </>
                )}
                <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
