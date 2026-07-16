import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";
import type { ResendMode, ResendVerifier } from "@/features/notifications/api/notifications-api";

const MODE_LABEL: Record<ResendMode, string> = {
  development: "development",
  staging: "staging",
  production: "PRODUCTION",
};

/**
 * Embeddable verifier-OTP gate. Sends a code to the account verifiers,
 * collects the 6-digit OTP, and hands the caller a verification token.
 * Used inline by the event wizard's verification step and wrapped in a
 * Dialog below for standalone use (event manage / trigger).
 */
export function VerifyOtpPanel({
  actionHint,
  startOtp,
  verifyOtp,
  onVerified,
}: {
  actionHint?: string;
  startOtp: () => Promise<{ mode: ResendMode; verifiers: ResendVerifier[] }>;
  verifyOtp: (otp: string) => Promise<{ token: string }>;
  onVerified: (token: string) => void;
}) {
  const [step, setStep] = useState<"intro" | "otp">("intro");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ResendMode>("development");
  const [verifiers, setVerifiers] = useState<ResendVerifier[]>([]);
  const [otp, setOtp] = useState("");

  const errText = (e: unknown, fallback: string) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await startOtp();
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

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(otp);
      onVerified(res.token);
    } catch (e) {
      setError(errText(e, "Verification failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {step === "intro" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#444]">
            {actionHint ?? "This action requires verification."} A one-time code will be sent to the
            account verifiers.
          </p>
          <Button
            className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
            disabled={busy}
            onClick={() => void send()}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send verification code
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            This is a <span className="font-bold">{MODE_LABEL[mode]}</span> environment — the code
            was sent to the accounts below.
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
                onClick={() => void verify()}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void send()}>
                Resend
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666]">
              Code sent to
            </p>
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
                    <FeesTableCell className="[overflow-wrap:anywhere]">
                      {v.email ?? "—"}
                    </FeesTableCell>
                    <FeesTableCell>{v.phone ?? "—"}</FeesTableCell>
                    <FeesTableCell>{v.whatsapp ?? "—"}</FeesTableCell>
                  </FeesTableRow>
                ))}
              </FeesTableBody>
            </FeesTable>
          </div>
        </div>
      )}
    </div>
  );
}

export function VerifyOtpDialog({
  open,
  onOpenChange,
  title,
  actionHint,
  startOtp,
  verifyOtp,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actionHint?: string;
  startOtp: () => Promise<{ mode: ResendMode; verifiers: ResendVerifier[] }>;
  verifyOtp: (otp: string) => Promise<{ token: string }>;
  onVerified: (token: string) => void;
}) {
  // Remount the panel each open so its state resets.
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (open) setNonce((n) => n + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#7c3aed]" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <VerifyOtpPanel
          key={nonce}
          actionHint={actionHint}
          startOtp={startOtp}
          verifyOtp={verifyOtp}
          onVerified={onVerified}
        />
      </DialogContent>
    </Dialog>
  );
}
