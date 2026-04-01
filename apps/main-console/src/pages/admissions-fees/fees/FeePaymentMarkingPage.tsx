import { useMemo, useState } from "react";
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
import { Search } from "lucide-react";
import { UserAvatar } from "@/hooks/UserAvatar";
import { useAuth } from "@/features/auth/providers/auth-provider";

type Mode = "CASH" | "ONLINE";

function safeText(v: unknown, fallback = "-"): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s.trim() ? s : fallback;
}

export default function FeePaymentMarkingPage() {
  const { user: loggedInUser } = useAuth();
  const [mode, setMode] = useState<Mode>("CASH");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<FeePaymentMarkingLoadedRecord | null>(null);

  const [cashReceiptNumber, setCashReceiptNumber] = useState("");
  const [cashReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cashRemarks, setCashRemarks] = useState("");

  const [onlineOrderId, setOnlineOrderId] = useState("");
  const [onlineRemarks, setOnlineRemarks] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const mapping = (record?.mapping ?? null) as any;
  const feeStructure = mapping?.feeStructure;
  const promotion = mapping?.feeGroupPromotionMappings?.[0]?.promotion;

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
  const isCashRecorded =
    paymentStatus === "COMPLETED" ||
    amountPaid >= challanAmount ||
    paymentEntry?.status === "SUCCESS";

  const recordedAtText = paymentRecordedAt
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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
  const programCourse = safeText(feeStructure?.programCourse?.name);
  const academicYear = safeText(feeStructure?.academicYear?.year);
  const className = safeText(promotion?.class?.name ?? feeStructure?.class?.name);

  const confirmConfig = useMemo(() => {
    if (!record) return null;
    if (mode === "CASH") {
      return {
        title: "Confirm cash payment",
        description:
          "Please verify challan details before recording. This action cannot be reversed.",
        confirmText: "Receive cash payment",
        doConfirm: async () => {
          // Create ISO date for midnight UTC on the selected date (avoids timezone offset issues)
          const receiptDateIso = new Date(`${cashReceiptDate}T00:00:00Z`).toISOString();
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
        "This will mark the payment as SUCCESS and manual. Please verify orderId before proceeding.",
      confirmText: "Mark as success",
      doConfirm: async () => {
        const res = await markFeePaymentOnlineSuccess({
          orderId: onlineOrderId,
          remarks: onlineRemarks.trim() || undefined,
        });
        setRecord(res.payload ?? null);
        toast.success("Online payment marked as success");
      },
    };
  }, [record, mode, cashReceiptDate, cashReceiptNumber, cashRemarks, onlineOrderId, onlineRemarks]);

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
          toast.error("Enter orderId");
          return;
        }
        const res = await loadFeePaymentMarkingOnline(orderId);
        setRecord(res.payload ?? null);
      }
    } catch (e: any) {
      const status = Number(e?.response?.status);
      const message = e?.response?.data?.message as string | undefined;
      if (status === 404) {
        toast.error(message || "No record found. Please verify the number and try again.");
      } else if (status === 401 || status === 403) {
        toast.error("You are not authorized. Please re-login and try again.");
      } else {
        toast.error(message || "Failed to load record");
      }
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Always verify challan / transaction details before recording. This action{" "}
        <span className="font-semibold">cannot be reversed</span>.
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Payment mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setMode("CASH");
                setRecord(null);
              }}
              className={
                mode === "CASH"
                  ? "bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100 hover:text-blue-800"
                  : "text-slate-600"
              }
            >
              Cash Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode("ONLINE");
                setRecord(null);
              }}
              className={
                mode === "ONLINE"
                  ? "bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100 hover:text-blue-800"
                  : "text-slate-600"
              }
            >
              Online Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            {mode === "CASH" ? "Cash — challan lookup" : "Online — order lookup"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "CASH" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Label>Challan / Receipt number</Label>
                <Input
                  value={cashReceiptNumber}
                  onChange={(e) => setCashReceiptNumber(e.target.value)}
                  placeholder="e.g. 1234/01"
                />
              </div>
              <Button
                onClick={handleLoad}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Load"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Label>Order ID</Label>
                <Input
                  value={onlineOrderId}
                  onChange={(e) => setOnlineOrderId(e.target.value)}
                  placeholder="e.g. 545172"
                />
              </div>
              <Button
                onClick={handleLoad}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Load"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {record && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Student record</CardTitle>
                <Badge
                  className={
                    paymentStatus === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : paymentStatus === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {paymentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{studentName}</div>
                  <div className="text-xs opacity-80">UID - {studentUid}</div>
                </div>
                <Badge className="bg-slate-800 text-slate-100 border border-slate-700">
                  {programCourse}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-slate-500">Mobile</div>
                  <div className="font-medium">{userPhone}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="font-medium">{userEmail}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-slate-500">Academic</div>
                  <div className="font-medium">
                    {academicYear} · {className}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Challan amount</div>
                    <div className="text-lg font-semibold">
                      ₹{challanAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Amount paid</div>
                    <div className="text-lg font-semibold">
                      ₹{amountPaid.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                {mode === "CASH" ? "Record cash payment" : "Mark online payment"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === "CASH" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Challan amount (₹)</Label>
                      <Input value={String(challanAmount)} readOnly />
                    </div>
                    <div>
                      <Label>Receipt date *</Label>
                      <Input type="date" value={cashReceiptDate} disabled />
                    </div>
                  </div>
                  <div>
                    <Label>Remarks (optional)</Label>
                    <Textarea
                      value={cashRemarks}
                      onChange={(e) => setCashRemarks(e.target.value)}
                      placeholder="Any notes for this transaction"
                      rows={3}
                    />
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500 mb-2">
                      {isCashRecorded ? "Recorded by" : "Will be recorded by"}
                    </div>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        size="sm"
                        user={{
                          name:
                            (isCashRecorded ? recordedBy?.name : loggedInUser?.name) ?? undefined,
                          image:
                            (isCashRecorded ? recordedBy?.image : loggedInUser?.image) ?? undefined,
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {(isCashRecorded ? recordedBy?.name : loggedInUser?.name) ||
                            "Unknown user"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isCashRecorded ? recordedAtText : "After you click Receive"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRecord(null);
                        setCashReceiptNumber("");
                        setCashRemarks("");
                      }}
                      className="w-full"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isCashRecorded}
                    >
                      Receive cash payment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Remarks (optional)</Label>
                    <Textarea
                      value={onlineRemarks}
                      onChange={(e) => setOnlineRemarks(e.target.value)}
                      placeholder="Any notes for this transaction"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRecord(null);
                        setOnlineOrderId("");
                        setOnlineRemarks("");
                      }}
                      className="w-full"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={paymentStatus === "COMPLETED"}
                    >
                      Mark as success
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

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
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed to save payment");
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
