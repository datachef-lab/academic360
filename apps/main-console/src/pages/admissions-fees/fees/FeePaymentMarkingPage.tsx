import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  loadFeePaymentMarkingCash,
  loadFeePaymentMarkingOnline,
  markFeePaymentOnlineSuccess,
  receiveFeePaymentCash,
  type FeePaymentMarkingLoadedRecord,
} from "@/services/payments-api";
import { AlertTriangle, CheckCircle2, CreditCard, Info, Search, Wallet, X } from "lucide-react";
import { UserAvatar } from "@/hooks/UserAvatar";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { cn } from "@/lib/utils";

type Mode = "CASH" | "ONLINE";

/** Online fee marking is Paytm-only for now */
const ONLINE_GATEWAY_PAYTM = "Paytm";

function safeText(v: unknown, fallback = "-"): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s.trim() ? s : fallback;
}

/** Normalize payment txnDate string to yyyy-mm-dd for <input type="date" /> */
function txnDateToInputValue(txnDate: string | null | undefined): string | null {
  if (!txnDate) return null;
  const d = new Date(txnDate);
  if (Number.isNaN(d.getTime())) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(txnDate);
    return m?.[1] ?? null;
  }
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd in local calendar for comparison with `<input type="date" />` values */
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isPaymentDateFuture(paymentDateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDateStr)) return false;
  return paymentDateStr > localDateString(new Date());
}

/** Display `yyyy-mm-dd` as `dd/mm/yyyy` (e.g. for dialogs; input still uses ISO for `type="date"`). */
function formatYyyyMmDdAsDdMmYyyy(yyyyMmDd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
  if (!m) return yyyyMmDd;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      ((error.response?.data as Record<string, unknown>)?.message as string | undefined) ||
      "Unknown error"
    );
  }
  return "Unknown error";
}

export default function FeePaymentMarkingPage() {
  const { user: loggedInUser } = useAuth();
  const [mode, setMode] = useState<Mode>("CASH");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<FeePaymentMarkingLoadedRecord | null>(null);

  const [cashReceiptNumber, setCashReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cashRemarks, setCashRemarks] = useState("");

  const [onlineOrderId, setOnlineOrderId] = useState("");
  const [onlineTransactionId, setOnlineTransactionId] = useState("");
  const [onlineRemarks, setOnlineRemarks] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [futureDateConfirmOpen, setFutureDateConfirmOpen] = useState(false);

  const mapping = record?.mapping;
  const feeStructure = mapping?.feeStructure;
  const promotion = mapping?.feeGroupPromotionMappings?.[0]?.promotion;
  const feeGroup = mapping?.feeGroupPromotionMappings?.[0]?.feeGroup;

  const paymentStatus = safeText(mapping?.paymentStatus, "PENDING").toUpperCase();
  const challanAmount = Number(mapping?.totalPayable ?? 0) || 0;
  const amountPaid = Number(mapping?.amountPaid ?? 0) || 0;
  const paymentEntry = record?.paymentEntry ?? null;
  const recordedBy = paymentEntry?.recordedBy ?? null;
  const paymentRecordedAt = paymentEntry?.createdAt
    ? new Date(paymentEntry.createdAt)
    : paymentEntry?.updatedAt
      ? new Date(paymentEntry.updatedAt)
      : null;
  /** Editable marking fields only when fee mapping is pending and payment is not already SUCCESS */
  const paymentEntryStatus = paymentEntry?.status?.toUpperCase() ?? "";
  const isPaymentSuccess = paymentEntryStatus === "SUCCESS";
  const canEditMarkingFields = paymentStatus === "PENDING" && !isPaymentSuccess;
  const isMarkingFormLocked = !canEditMarkingFields;

  /** Use the browser's local timezone so the time matches the user's system clock (API sends UTC via ISO strings). */
  const recordedAtText = paymentRecordedAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(paymentRecordedAt)
    : "-";

  const studentName = safeText(record?.user?.name);
  const studentUid = safeText(record?.student?.uid);
  const userEmail = safeText(record?.user?.email);
  const userPhone = safeText(record?.user?.phone);
  const fatherName = safeText(record?.user?.fatherName);
  const programCourse = safeText(feeStructure?.programCourse?.name);
  const academicYear = safeText(feeStructure?.academicYear?.year);
  const className = safeText(promotion?.class?.name ?? feeStructure?.class?.name);

  const feeGroupLabel =
    feeGroup?.feeCategory?.name && feeGroup?.feeSlab?.name
      ? `${feeGroup.feeCategory.name} | ${feeGroup.feeSlab.name}`
      : feeGroup?.feeSlab?.name || feeGroup?.feeCategory?.name || "—";

  const displayGatewayVendor = paymentEntry?.paymentGatewayVendor?.trim() || ONLINE_GATEWAY_PAYTM;

  const academicLine = `${academicYear} · ${className}`;

  useEffect(() => {
    if (!record) return;
    const pe = record.paymentEntry;
    const txnFromPayment = pe?.txnDate ? txnDateToInputValue(pe.txnDate) : null;
    const fallbackDate = new Date().toISOString().slice(0, 10);

    setPaymentDate(txnFromPayment ?? fallbackDate);
    if (mode === "ONLINE") {
      setOnlineTransactionId(pe?.txnId?.trim() ?? "");
    }
  }, [record, mode]);

  const confirmConfig = useMemo(() => {
    if (!record) return null;
    if (mode === "CASH") {
      return {
        title: "Confirm cash payment",
        description:
          "Please verify challan details before recording. This action cannot be reversed.",
        confirmText: "Receive cash payment",
        doConfirm: async () => {
          const receiptDateIso = new Date(`${paymentDate}T00:00:00Z`).toISOString();
          const res = await receiveFeePaymentCash({
            receiptNumber: cashReceiptNumber,
            receiptDateIso,
            remarks: cashRemarks.trim() || undefined,
          });
          setRecord(res.payload ?? null);
          toast.success("Cash payment recorded");
        },
      };
    }
    return {
      title: "Confirm online marking",
      description:
        "This will mark the payment as SUCCESS and manual. Please verify order ID and transaction reference before proceeding.",
      confirmText: "Update online payment",
      doConfirm: async () => {
        const paymentDateIso = new Date(`${paymentDate}T00:00:00Z`).toISOString();
        const res = await markFeePaymentOnlineSuccess({
          orderId: onlineOrderId,
          remarks: onlineRemarks.trim() || undefined,
          paymentDateIso,
          transactionId: onlineTransactionId.trim() || undefined,
          paymentGatewayVendor: ONLINE_GATEWAY_PAYTM,
        });
        setRecord(res.payload ?? null);
        toast.success("Online payment marked as success");
      },
    };
  }, [
    record,
    mode,
    paymentDate,
    cashReceiptNumber,
    cashRemarks,
    onlineOrderId,
    onlineRemarks,
    onlineTransactionId,
  ]);

  function requestMainConfirm() {
    if (isPaymentDateFuture(paymentDate)) {
      setFutureDateConfirmOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

  function clearLoadedRecord() {
    setRecord(null);
    setConfirmOpen(false);
    setFutureDateConfirmOpen(false);
    setCashReceiptNumber("");
    setCashRemarks("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setOnlineOrderId("");
    setOnlineRemarks("");
    setOnlineTransactionId("");
  }

  async function handleLoad() {
    try {
      setLoading(true);
      if (mode === "CASH") {
        const receiptNumber = cashReceiptNumber.trim();
        if (!receiptNumber) {
          toast.error("Enter challan / receipt number");
          return;
        }
        const res = await loadFeePaymentMarkingCash(receiptNumber);
        setRecord(res.payload ?? null);
      } else {
        const orderId = onlineOrderId.trim();
        if (!orderId) {
          toast.error("Enter order ID");
          return;
        }
        const res = await loadFeePaymentMarkingOnline(orderId);
        setRecord(res.payload ?? null);
      }
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const status = e.response?.status;
        const message = (e.response?.data as Record<string, unknown>)?.message as
          | string
          | undefined;
        if (status === 404) {
          toast.error(message || "No record found. Please verify the number and try again.");
        } else if (status === 401 || status === 403) {
          toast.error("You are not authorized. Please re-login and try again.");
        } else {
          toast.error(message || "Failed to load record");
        }
      } else {
        toast.error("Failed to load record");
      }
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
        <p>
          Always verify challan / transaction details before recording. This action{" "}
          <span className="font-semibold">cannot be reversed</span>.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm border-slate-200">
        <CardHeader className="pb-2 flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-600">
            Payment mode
          </CardTitle>
          <p className="text-xs text-slate-500">Select a mode, then load student record</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setMode("CASH");
                clearLoadedRecord();
              }}
              className={cn(
                "rounded-lg h-12 gap-2 justify-center",
                mode === "CASH"
                  ? "bg-sky-50 text-sky-800 border-2 border-sky-500 hover:bg-sky-100"
                  : "text-slate-600 border-slate-200",
              )}
            >
              <Wallet className="h-5 w-5 shrink-0" />
              Cash Payment
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setMode("ONLINE");
                clearLoadedRecord();
              }}
              className={cn(
                "rounded-lg h-12 gap-2 justify-center",
                mode === "ONLINE"
                  ? "bg-sky-50 text-sky-800 border-2 border-sky-500 hover:bg-sky-100"
                  : "text-slate-600 border-slate-200",
              )}
            >
              <CreditCard className="h-5 w-5 shrink-0" />
              Online Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-slate-50/80">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-600 flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-600 shrink-0" />
              {mode === "CASH" ? "Cash — challan lookup" : "Online — challan lookup"}
            </CardTitle>
            <p className="text-xs text-slate-500">
              {mode === "CASH"
                ? "Enter challan or receipt number to load student record"
                : "Enter order ID from Paytm."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {mode === "CASH" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-9">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                  Challan / receipt number
                </Label>
                <Input
                  value={cashReceiptNumber}
                  onChange={(e) => setCashReceiptNumber(e.target.value)}
                  placeholder="e.g. 1234/01"
                  className="mt-1.5"
                />
              </div>
              <div className="md:col-span-3 flex md:justify-end">
                <Button
                  type="button"
                  onClick={handleLoad}
                  disabled={loading}
                  className="bg-sky-600 hover:bg-sky-700 w-full md:w-auto min-w-[120px]"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                  Payment gateway
                </Label>
                <Input
                  value={ONLINE_GATEWAY_PAYTM}
                  readOnly
                  disabled
                  className="mt-1.5 bg-slate-100 text-slate-800 cursor-not-allowed"
                  aria-label="Payment gateway (Paytm only)"
                />
              </div>
              <div className="md:col-span-5">
                <Label className="text-xs font-semibold uppercase text-slate-500">Order ID</Label>
                <Input
                  value={onlineOrderId}
                  onChange={(e) => setOnlineOrderId(e.target.value)}
                  placeholder="e.g. 545172"
                  className="mt-1.5"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleLoad}
                  disabled={loading}
                  className="bg-sky-600 hover:bg-sky-700 min-w-[120px] w-full md:w-auto"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {record && (
        <>
          <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/80 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-600">
                Student record
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    paymentStatus === "SUCCESS" || paymentStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : paymentStatus === "FAILED"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-amber-100 text-amber-900 border-amber-200"
                  }
                >
                  {paymentStatus === "SUCCESS" || paymentStatus === "COMPLETED"
                    ? "PAID"
                    : paymentStatus}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={clearLoadedRecord}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              <div className="bg-[#1e3a5f] text-white px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-bold tracking-tight">{studentName}</div>
                  <div className="text-sm text-white/80 mt-0.5">UID · {studentUid}</div>
                </div>
                <Badge className="bg-sky-500/90 hover:bg-sky-500 text-white border-0 rounded-full px-3 py-1 text-xs font-medium">
                  {programCourse}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200">
                {[
                  { k: "Mobile", v: userPhone },
                  { k: "Email", v: userEmail },
                  { k: "Father's name", v: fatherName },
                  { k: "Fee group", v: feeGroupLabel },
                  { k: "Academic year", v: academicLine },
                ].map((cell) => (
                  <div
                    key={cell.k}
                    className="border-b sm:border-b-0 sm:border-r border-slate-200 last:border-r-0 p-4 bg-white min-w-0"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {cell.k}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 break-words">
                      {cell.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-slate-50 rounded-b-md">
                <div className="p-4 border-r border-slate-200 min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Challan amount
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    ₹{challanAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-4 min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Amount paid
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    ₹{amountPaid.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/80 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-600">
                {mode === "CASH" ? "Record cash payment" : "Update online payment"}
              </CardTitle>
              {mode === "CASH" ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-normal">
                  Cash
                </Badge>
              ) : (
                displayGatewayVendor && (
                  <Badge variant="secondary" className="font-normal text-sky-800 bg-sky-100">
                    {displayGatewayVendor}
                  </Badge>
                )
              )}
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {mode === "CASH" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        Challan amount (₹)
                      </Label>
                      <Input
                        value={`₹ ${challanAmount.toLocaleString("en-IN")}`}
                        readOnly
                        className="mt-1.5 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        Payment date <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={isMarkingFormLocked}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500">
                      Remarks (optional)
                    </Label>
                    <Textarea
                      value={cashRemarks}
                      onChange={(e) => setCashRemarks(e.target.value)}
                      placeholder="Any notes for this transaction"
                      rows={3}
                      className="mt-1.5"
                      disabled={isMarkingFormLocked}
                    />
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500 mb-2">
                      {isMarkingFormLocked ? "Recorded by" : "Will be recorded by"}
                    </div>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        size="sm"
                        user={{
                          name:
                            (isMarkingFormLocked ? recordedBy?.name : loggedInUser?.name) ??
                            undefined,
                          image:
                            (isMarkingFormLocked ? recordedBy?.image : loggedInUser?.image) ??
                            undefined,
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {(isMarkingFormLocked ? recordedBy?.name : loggedInUser?.name) ||
                            "Unknown user"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isMarkingFormLocked ? recordedAtText : "After you confirm"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearLoadedRecord}
                      className="flex-1"
                    >
                      Clear form
                    </Button>
                    <Button
                      type="button"
                      onClick={() => requestMainConfirm()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={isMarkingFormLocked}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Receive cash payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        Amount (₹)
                      </Label>
                      <Input
                        value={`₹ ${challanAmount.toLocaleString("en-IN")}`}
                        readOnly
                        className="mt-1.5 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        Payment date <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={isMarkingFormLocked}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500">
                      Reference / transaction no. <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      value={onlineTransactionId}
                      onChange={(e) => setOnlineTransactionId(e.target.value)}
                      placeholder="e.g. TXN2025042100831"
                      disabled={isMarkingFormLocked}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500">
                      Remarks (optional)
                    </Label>
                    <Textarea
                      value={onlineRemarks}
                      onChange={(e) => setOnlineRemarks(e.target.value)}
                      placeholder="Any notes for this transaction"
                      rows={3}
                      className="mt-1.5"
                      disabled={isMarkingFormLocked}
                    />
                  </div>
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 flex gap-3 text-sm text-sky-900">
                    <Info className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" />
                    <span>
                      Verify the order ID and transaction reference from the gateway dashboard
                      before updating.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearLoadedRecord}
                      className="flex-1"
                    >
                      Clear form
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!onlineTransactionId.trim()) {
                          toast.error("Enter the reference / transaction number from the gateway");
                          return;
                        }
                        requestMainConfirm();
                      }}
                      className="flex-1 bg-sky-600 hover:bg-sky-700"
                      disabled={isMarkingFormLocked}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Update online payment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={futureDateConfirmOpen} onOpenChange={setFutureDateConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
              Future payment date
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground pt-1">
                <p>
                  You have selected a future payment date (
                  <span className="font-medium text-foreground">
                    {formatYyyyMmDdAsDdMmYyyy(paymentDate)}
                  </span>
                  ). Do you want to proceed?.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setFutureDateConfirmOpen(false)}>
              Go back
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFutureDateConfirmOpen(false);
                setConfirmOpen(true);
              }}
            >
              Yes, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(v) => setConfirmOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmConfig?.title ?? "Confirm"}</DialogTitle>
            <DialogDescription>{confirmConfig?.description ?? ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setLoading(true);
                  await confirmConfig?.doConfirm();
                } catch (e: unknown) {
                  toast.error(extractErrorMessage(e) || "Failed to save payment");
                } finally {
                  setLoading(false);
                  setConfirmOpen(false);
                }
              }}
              disabled={loading || !confirmConfig}
            >
              {confirmConfig?.confirmText ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
