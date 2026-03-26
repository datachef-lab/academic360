"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { axiosInstance } from "@/lib/utils";
import { useStudent } from "@/providers/student-provider";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CircleMinus,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  School,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

type ApiResponse<T> = { payload: T; message?: string };

type FeeMapping = {
  id: number;
  studentId: number;
  feeStructureId: number;
  totalPayable: number;
  amountPaid: number;
  paymentStatus: string;
  type: "FULL" | "INSTALLMENT";
  feeStructureInstallment: { name?: string | null; sequence?: number | null } | null;
  feeStructure: {
    id: number;
    receiptType: { name: string };
    class: { name: string };
    academicYear: { year: string };
    programCourse: { name: string };
  };
};

type AcademicYear = { id: number; year: string; isCurrentYear?: boolean };
type FieldOption = { id?: number; name: string; sequence: number };
type Field = {
  id?: number;
  name: string;
  type: string;
  sequence: number;
  isQuestion?: boolean;
  isRequired?: boolean;
  options: FieldOption[];
};
type CertificateMaster = {
  id?: number;
  name: string;
  description: string;
  sequence: number;
  fields: Field[];
};
type CareerProgressionTemplatePayload = {
  academicYear: AcademicYear;
  hasExistingForms: boolean;
  certificateMasters: CertificateMaster[];
};

type RowField = { certificateFieldMasterId: number; value: string };
type RowDraft = { certificateMasterId: number; fields: RowField[] };

type DialogStage = "form" | "submitted" | "payment";
type PaymentMode = "cash" | "online" | null;

const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const statusBadgeClass = (isPaid: boolean) =>
  isPaid
    ? "bg-green-100 text-green-800 border border-green-200"
    : "bg-yellow-100 text-yellow-800 border border-yellow-200";

export default function EnrollmentFeesPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<FeeMapping[]>([]);
  const [hasExistingCpForm, setHasExistingCpForm] = useState<boolean | null>(null);

  const [cpOpen, setCpOpen] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpData, setCpData] = useState<CareerProgressionTemplatePayload | null>(null);
  const [stage, setStage] = useState<DialogStage>("form");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(null);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [savingCp, setSavingCp] = useState(false);

  const [selectedFee, setSelectedFee] = useState<{
    feeStudentMappingId: number;
    feeStructureId: number;
    totalPayable: number;
  } | null>(null);

  const [rowsByMaster, setRowsByMaster] = useState<Record<string, RowDraft[]>>({});
  const [questionByField, setQuestionByField] = useState<Record<number, string>>({});
  const [editingMasterKey, setEditingMasterKey] = useState<string | null>(null);
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<number, string>>({});
  const studentGenderRaw = String(
    (
      student as {
        gender?: string | null;
        personalDetails?: { gender?: string | null };
      } | null
    )?.personalDetails?.gender ??
      (
        student as {
          gender?: string | null;
          personalDetails?: { gender?: string | null };
        } | null
      )?.gender ??
      "",
  ).trim();
  const studentGender = studentGenderRaw.toUpperCase();
  const careerProgressionImageSrc =
    studentGender.includes("FEMALE") || studentGender === "F"
      ? "/career-progression-female.png"
      : "/career-progression-male.png";

  const fetchMappings = async () => {
    if (!student?.id) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get<ApiResponse<FeeMapping[]>>(
        `/api/v1/fees/student-mappings/student/${student.id}`,
      );
      setMappings(Array.isArray(data?.payload) ? data.payload : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load fee details");
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [student?.id]);

  useEffect(() => {
    const checkCp = async () => {
      if (!student?.id) return;
      try {
        const { data } = await axiosInstance.get<ApiResponse<CareerProgressionTemplatePayload>>(
          `/api/academics/career-progression-forms/student/${student.id}/current`,
        );
        setHasExistingCpForm(Boolean(data?.payload?.hasExistingForms));
      } catch {
        setHasExistingCpForm(null);
      }
    };
    checkCp();
  }, [student?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const respMsg = params.get("respMsg");
    if (payment) {
      setPaymentMsg(respMsg || (payment === "success" ? "Payment successful" : "Payment failed"));
      setCpOpen(true);
      setStage("payment");
      setPaymentMode(payment === "success" ? "online" : null);
      params.delete("payment");
      params.delete("orderId");
      params.delete("respMsg");
      const next = params.toString();
      window.history.replaceState(
        {},
        "",
        next ? `${window.location.pathname}?${next}` : window.location.pathname,
      );
      fetchMappings();
    }
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "PAYTM_PAYMENT_RESULT") return;
      const msg =
        e.data.respMsg || (e.data.payment === "success" ? "Payment successful" : "Payment failed");
      setPaymentMsg(msg);
      if (e.data.payment === "success") fetchMappings();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const cards = useMemo(
    () =>
      mappings.map((m) => ({
        id: m.id,
        title: m.feeStructure?.receiptType?.name || "Fees",
        className: m.feeStructure?.class?.name || "—",
        academicYear: m.feeStructure?.academicYear?.year || "—",
        total: Number(m.totalPayable || 0),
        isPaid: String(m.paymentStatus).toUpperCase() === "COMPLETED",
        installmentLabel:
          m.feeStructureInstallment?.name ||
          (m.type === "INSTALLMENT"
            ? `Installment ${m.feeStructureInstallment?.sequence ?? ""}`.trim()
            : "Full payment"),
        feeStructureId: m.feeStructure?.id,
      })),
    [mappings],
  );

  const getMasterKey = (master: CertificateMaster, idx: number) => {
    const idNum = Number(master.id);
    if (Number.isFinite(idNum) && idNum > 0) return `master_${idNum}`;
    return `master_${master.name}_${idx}`;
  };

  const startAddRow = (master: CertificateMaster, idx: number) => {
    const masterId = Number(master.id) || 0;
    const key = getMasterKey(master, idx);
    const initial: Record<number, string> = {};
    master.fields
      .filter((f) => !f.isQuestion)
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((f) => {
        if (f.id) initial[Number(f.id)] = "";
      });
    setEditingMasterKey(key);
    setEditingMasterId(masterId);
    setEditingRowIndex(null);
    setEditingValues(initial);
  };

  const startEditRow = (master: CertificateMaster, rowIdx: number, idx: number) => {
    const key = getMasterKey(master, idx);
    const row = rowsByMaster[key]?.[rowIdx];
    if (!row) return;
    const values: Record<number, string> = {};
    row.fields.forEach((f) => (values[f.certificateFieldMasterId] = f.value));
    setEditingMasterKey(key);
    setEditingMasterId(Number(master.id) || 0);
    setEditingRowIndex(rowIdx);
    setEditingValues(values);
  };

  const saveRow = () => {
    if (!editingMasterKey) return;
    const row: RowDraft = {
      certificateMasterId: editingMasterId || 0,
      fields: Object.entries(editingValues).map(([id, value]) => ({
        certificateFieldMasterId: Number(id),
        value: value ?? "",
      })),
    };
    setRowsByMaster((prev) => {
      const current = prev[editingMasterKey] || [];
      if (editingRowIndex == null) return { ...prev, [editingMasterKey]: [...current, row] };
      const next = [...current];
      next[editingRowIndex] = row;
      return { ...prev, [editingMasterKey]: next };
    });
    setEditingMasterKey(null);
    setEditingMasterId(null);
    setEditingRowIndex(null);
    setEditingValues({});
  };

  const openCareerProgression = async (fee: {
    id: number;
    feeStructureId: number;
    total: number;
  }) => {
    if (!student?.id) return;
    setSelectedFee({
      feeStudentMappingId: fee.id,
      feeStructureId: fee.feeStructureId,
      totalPayable: fee.total,
    });
    setCpOpen(true);
    setCpLoading(true);
    setCpError(null);
    setCpData(null);
    setStage("form");
    setPaymentMode(null);
    setPaymentMsg(null);
    setRowsByMaster({});
    setQuestionByField({});
    setEditingMasterKey(null);
    setEditingMasterId(null);
    setEditingRowIndex(null);
    setEditingValues({});
    try {
      const { data } = await axiosInstance.get<ApiResponse<CareerProgressionTemplatePayload>>(
        `/api/academics/career-progression-forms/student/${student.id}/current`,
      );
      setCpData(data?.payload ?? null);
      setHasExistingCpForm(Boolean(data?.payload?.hasExistingForms));
      if (data?.payload?.hasExistingForms) setStage("payment");
    } catch (e) {
      console.error(e);
      setCpError("Failed to load career progression form");
    } finally {
      setCpLoading(false);
    }
  };

  const canContinueForm = useMemo(() => {
    if (!cpData) return false;
    for (let idx = 0; idx < cpData.certificateMasters.length; idx++) {
      const master = cpData.certificateMasters[idx];
      const key = getMasterKey(master, idx);
      const rows = rowsByMaster[key] || [];
      const questionReq = master.fields.filter(
        (f) => f.isQuestion && (f.isRequired || f.isQuestion),
      );
      for (const qf of questionReq) {
        const val = questionByField[Number(qf.id)] || "";
        if (!val.trim()) return false;
      }
      const requiredTableFields = master.fields.filter((f) => !f.isQuestion && f.isRequired);
      if (requiredTableFields.length > 0) {
        if (rows.length === 0) return false;
        for (const row of rows) {
          for (const rf of requiredTableFields) {
            const v =
              row.fields.find((x) => x.certificateFieldMasterId === Number(rf.id))?.value || "";
            if (!v.trim()) return false;
          }
        }
      }
    }
    return true;
  }, [cpData, questionByField, rowsByMaster]);

  const handleSubmitCareerProgression = async () => {
    if (!student?.id || !cpData) return;
    try {
      setSavingCp(true);
      const certificates: Array<{
        certificateMasterId: number;
        fields: Array<{
          certificateFieldMasterId: number;
          certificateFieldOptionMasterId?: number | null;
          value?: string | null;
        }>;
      }> = [];

      cpData.certificateMasters.forEach((master, idx) => {
        const key = getMasterKey(master, idx);
        const rows = rowsByMaster[key] || [];
        const questionFields = master.fields.filter((f) => f.isQuestion);
        const tableFields = master.fields.filter((f) => !f.isQuestion);

        const qMapped = questionFields
          .map((f) => {
            const raw = (questionByField[Number(f.id)] || "").trim();
            if (!raw) return null;
            const selectedOpt = f.options.find((o) => o.name === raw);
            return {
              certificateFieldMasterId: Number(f.id),
              certificateFieldOptionMasterId: selectedOpt?.id ? Number(selectedOpt.id) : null,
              value: raw,
            };
          })
          .filter(Boolean) as Array<{
          certificateFieldMasterId: number;
          certificateFieldOptionMasterId?: number | null;
          value?: string | null;
        }>;

        if (rows.length === 0 && qMapped.length > 0) {
          certificates.push({
            certificateMasterId: Number(master.id),
            fields: qMapped,
          });
          return;
        }

        rows.forEach((row) => {
          const mappedRowFields = row.fields
            .map((rf) => {
              const fm = tableFields.find((f) => Number(f.id) === rf.certificateFieldMasterId);
              if (!fm) return null;
              const raw = (rf.value || "").trim();
              if (!raw) return null;
              const selectedOpt =
                fm.type === "SELECT" ? fm.options.find((o) => o.name === raw) : null;
              return {
                certificateFieldMasterId: rf.certificateFieldMasterId,
                certificateFieldOptionMasterId: selectedOpt?.id ? Number(selectedOpt.id) : null,
                value: raw,
              };
            })
            .filter(Boolean) as Array<{
            certificateFieldMasterId: number;
            certificateFieldOptionMasterId?: number | null;
            value?: string | null;
          }>;

          certificates.push({
            certificateMasterId: Number(master.id),
            fields: [...qMapped, ...mappedRowFields],
          });
        });
      });

      await axiosInstance.post(
        `/api/academics/career-progression-forms/student/${student.id}/current/submit`,
        { certificates },
      );

      setHasExistingCpForm(true);
      setStage("submitted");
    } catch (e) {
      console.error(e);
      setCpError("Failed to submit career progression form");
    } finally {
      setSavingCp(false);
    }
  };

  const handleGenerateFeeReceipt = async () => {
    if (!selectedFee || !student?.id) return;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/fees/student-mappings/download-receipt?feeStructureId=${selectedFee.feeStructureId}&studentId=${student.id}`,
      { credentials: "include" },
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
  };

  const handleProceedToPaytm = async () => {
    if (!selectedFee || !student?.id) return;
    const returnUrl = `${window.location.origin}${window.location.pathname}?studentId=${student.id}`;
    const [configRes, initRes] = await Promise.all([
      axiosInstance.get<ApiResponse<{ mid: string; host: string }>>("/api/payments/config"),
      axiosInstance.post<ApiResponse<{ orderId: string; txnToken: string }>>(
        "/api/payments/initiate-fee",
        {
          feeStudentMappingId: selectedFee.feeStudentMappingId,
          amount: String(selectedFee.totalPayable),
          studentId: student.id,
          email: (student as any).personalEmail || undefined,
          mobile: (student as any).mobile || undefined,
          firstName: (student.name || "").split(" ")[0],
          lastName: (student.name || "").split(" ").slice(1).join(" ") || undefined,
          returnUrl,
        },
      ),
    ]);

    const config = configRes.data?.payload;
    const init = initRes.data?.payload;
    if (!config?.mid || !config?.host || !init?.orderId || !init?.txnToken) return;

    const paytmHost = config.host.replace(/^https?:\/\//, "");
    const url = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${config.mid}&orderId=${init.orderId}`;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = "_blank";
    form.style.display = "none";
    [
      { name: "mid", value: config.mid },
      { name: "orderId", value: init.orderId },
      { name: "txnToken", value: init.txnToken },
    ].forEach(({ name, value }) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  if (loading) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-5 text-white md:p-8">
        <div className="absolute -right-12 -top-8 h-40 w-40 rounded-full bg-white/15 blur-xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/15 p-3">
            <School className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-4xl">Fees & Instalments</h1>
            <p className="mt-1 text-sm text-blue-100 md:text-base">
              Track your fee status and pending payments in one place
            </p>
          </div>
        </div>
      </div>

      <main className="mt-6 px-1 pb-10 md:px-0">
        {error ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((fee) => (
            <Card
              key={fee.id}
              className="h-full max-w-[360px] cursor-pointer overflow-hidden border-none bg-white shadow-lg transition-all hover:shadow-xl"
              onClick={() =>
                openCareerProgression({
                  id: fee.id,
                  feeStructureId: fee.feeStructureId,
                  total: fee.total,
                })
              }
            >
              <div className="relative h-full">
                <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-indigo-500/[0.03]" />
                <CardHeader className="relative pb-1">
                  <CardTitle className="line-clamp-1 text-[30px] font-bold leading-none text-slate-900">
                    {fee.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3 pt-0 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[34px] font-bold leading-none text-blue-700">
                      {formatInr(fee.total)}
                    </p>
                    <Badge className={`text-[10px] font-semibold ${statusBadgeClass(fee.isPaid)}`}>
                      {fee.isPaid ? "PAID" : "PENDING"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>
                      {fee.className} - {fee.academicYear}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <WalletCards className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{fee.installmentLabel}</span>
                  </div>
                  {hasExistingCpForm === false ? (
                    <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
                      Please fill up the career-progression form before proceeding with payment.
                    </p>
                  ) : null}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={cpOpen} onOpenChange={setCpOpen}>
        <DialogContent className="h-[94vh] w-[99vw] max-w-[1700px] overflow-hidden p-0">
          <div className="flex h-full w-full min-h-0">
            <div className="hidden h-full w-[32%] overflow-hidden bg-slate-100 md:block">
              <img
                src={careerProgressionImageSrc}
                alt="Career progression"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="flex h-full min-h-0 w-full flex-col md:w-[68%]">
              <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-white">
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4" />
                  Career Progression Form
                </DialogTitle>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {cpLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : cpError ? (
                  <div className="text-sm text-red-600">{cpError}</div>
                ) : stage === "submitted" ? (
                  <div className="mx-auto max-w-2xl space-y-6 py-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-700" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900">Form Submitted</h2>
                    <p className="text-lg text-slate-700">
                      Career Progression Form submitted successfully.
                    </p>
                    <div className="rounded-xl border bg-white p-6 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Submission Summary
                      </p>
                      <div className="mt-4 flex justify-between border-b py-2 text-sm">
                        <span className="text-slate-500">Submitted On</span>
                        <span className="font-semibold text-slate-900">
                          {new Date().toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-slate-500">Next Step</span>
                        <span className="font-semibold text-indigo-700">
                          Enrolment & Fee Payment
                        </span>
                      </div>
                    </div>
                    <Button
                      className="h-12 w-full bg-slate-900 text-lg text-white hover:bg-slate-800"
                      onClick={() => setStage("payment")}
                    >
                      Proceed to Enrolment <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                ) : stage === "payment" ? (
                  <div className="mx-auto max-w-3xl space-y-5">
                    {paymentMsg ? (
                      <div className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">
                        {paymentMsg}
                      </div>
                    ) : null}
                    <h2 className="text-4xl font-bold text-slate-900">Fee Payment</h2>
                    <p className="text-slate-700">
                      Choose your preferred payment mode below and proceed with payment.
                    </p>
                    <div className="rounded-xl border bg-white">
                      <div className="rounded-t-xl bg-slate-900 px-5 py-4 text-white">
                        <span className="font-semibold">Fee Summary</span>
                        <span className="mx-2">·</span>
                        <span>Academic Year {cpData?.academicYear.year}</span>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Amount to Pay
                        </p>
                        <p className="text-5xl font-bold text-slate-900">
                          {formatInr(selectedFee?.totalPayable || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border bg-white p-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Select Payment Mode
                      </p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <button
                          className={`rounded-xl border p-4 text-left ${
                            paymentMode === "cash"
                              ? "border-teal-600 bg-teal-50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                          onClick={() => setPaymentMode("cash")}
                        >
                          <Landmark className="mb-2 h-5 w-5 text-slate-700" />
                          <p className="font-bold text-slate-900">Cash Payment</p>
                          <p className="text-sm text-slate-500">Pay at bank branch</p>
                        </button>
                        <button
                          className={`rounded-xl border p-4 text-left ${
                            paymentMode === "online"
                              ? "border-teal-600 bg-teal-50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                          onClick={() => setPaymentMode("online")}
                        >
                          <CreditCard className="mb-2 h-5 w-5 text-slate-700" />
                          <p className="font-bold text-slate-900">Online Payment</p>
                          <p className="text-sm text-slate-500">Pay securely via Paytm</p>
                        </button>
                      </div>

                      {paymentMode === "cash" ? (
                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                          <p className="mb-2 font-semibold text-amber-900">
                            Instructions for Cash Payment
                          </p>
                          <ul className="list-disc space-y-1 pl-5 text-amber-900">
                            <li>
                              Download and print your fee challan by clicking Generate Fee Challan
                              below.
                            </li>
                            <li>Visit bank branch with challan and cash.</li>
                            <li>You will receive confirmation after fee update in profile.</li>
                          </ul>
                          <Button
                            className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={handleGenerateFeeReceipt}
                          >
                            Generate Fee Challan
                          </Button>
                        </div>
                      ) : null}

                      {paymentMode === "online" ? (
                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                          <p className="mb-2 font-semibold text-amber-900">
                            Instructions for Online Payment
                          </p>
                          <ul className="list-disc space-y-1 pl-5 text-amber-900">
                            <li>You will be redirected to the Paytm secure payment gateway.</li>
                            <li>Do not close this window during transaction.</li>
                            <li>On callback, status and response message will be shown here.</li>
                          </ul>
                          <Button
                            className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={handleProceedToPaytm}
                          >
                            Proceed to Pay
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : cpData ? (
                  <div className="space-y-5">
                    <div className="rounded-xl bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 p-4">
                      <p className="font-semibold text-indigo-900">
                        Academic Year: {cpData.academicYear.year}
                      </p>
                      <p className="text-xs text-indigo-700">
                        Fill all required fields to continue.
                      </p>
                    </div>

                    {cpData.certificateMasters
                      .slice()
                      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                      .map((cm, idx) => {
                        const masterId = Number(cm.id);
                        const masterKey = getMasterKey(cm, idx);
                        const sortedFields = cm.fields
                          .slice()
                          .sort((a, b) => a.sequence - b.sequence);
                        const questionFields = sortedFields.filter((f) => f.isQuestion);
                        const tableFields = sortedFields.filter((f) => !f.isQuestion);
                        const rows = rowsByMaster[masterKey] || [];
                        const isEditing = editingMasterKey === masterKey;
                        return (
                          <div key={`${cm.name}-${idx}`} className="rounded-xl border bg-white">
                            <div className="flex items-start justify-between gap-3 border-b p-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {String.fromCharCode(65 + idx)}. {cm.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">{cm.description}</p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                                onClick={() => startAddRow(cm, idx)}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
                              </Button>
                            </div>

                            <div className="p-4">
                              {questionFields.length > 0 ? (
                                <div className="mb-4 space-y-3 rounded-lg border bg-slate-50 p-3">
                                  {questionFields.map((qf) => {
                                    const qfId = Number(qf.id);
                                    return (
                                      <div key={`${masterId}-${qfId}`}>
                                        <label className="text-xs font-semibold text-slate-700">
                                          {qf.name}
                                          {qf.isRequired || qf.isQuestion ? (
                                            <span className="ml-1 text-red-600">*</span>
                                          ) : null}
                                        </label>
                                        {qf.type === "SELECT" ? (
                                          <select
                                            className="mt-1 h-9 w-full rounded-md bg-white px-2 text-sm outline-none"
                                            value={questionByField[qfId] || ""}
                                            onChange={(e) =>
                                              setQuestionByField((prev) => ({
                                                ...prev,
                                                [qfId]: e.target.value,
                                              }))
                                            }
                                          >
                                            <option value="">Select option</option>
                                            {qf.options.map((opt) => (
                                              <option
                                                key={`${qfId}-${opt.id}-${opt.name}`}
                                                value={opt.name}
                                              >
                                                {opt.name}
                                              </option>
                                            ))}
                                          </select>
                                        ) : (
                                          <input
                                            className="mt-1 h-9 w-full rounded-md bg-white px-2 text-sm outline-none"
                                            value={questionByField[qfId] || ""}
                                            onChange={(e) =>
                                              setQuestionByField((prev) => ({
                                                ...prev,
                                                [qfId]: e.target.value,
                                              }))
                                            }
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}

                              <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full min-w-[860px] table-fixed border-collapse text-xs">
                                  <thead className="bg-slate-50 text-slate-700">
                                    <tr>
                                      {tableFields.map((f) => (
                                        <th
                                          key={`${masterId}-${f.id}`}
                                          className="border px-2 py-2 text-left font-semibold whitespace-normal break-words"
                                        >
                                          {f.name.toUpperCase()}
                                          {f.isRequired ? (
                                            <span className="ml-1 text-red-600">*</span>
                                          ) : null}
                                        </th>
                                      ))}
                                      <th className="w-[120px] border px-2 py-2 text-left font-semibold whitespace-normal break-words">
                                        ACTION
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {isEditing ? (
                                      <tr>
                                        {tableFields.map((f) => {
                                          const fieldId = Number(f.id);
                                          const value = editingValues[fieldId] || "";
                                          return (
                                            <td
                                              key={`${masterId}-edit-${fieldId}`}
                                              className="border p-1.5 align-top whitespace-normal break-words"
                                            >
                                              {f.type === "SELECT" ? (
                                                <select
                                                  className="h-8 w-full rounded px-2 text-xs outline-none"
                                                  value={value}
                                                  onChange={(e) =>
                                                    setEditingValues((prev) => ({
                                                      ...prev,
                                                      [fieldId]: e.target.value,
                                                    }))
                                                  }
                                                >
                                                  <option value="">Select</option>
                                                  {f.options.map((opt) => (
                                                    <option
                                                      key={`${fieldId}-${opt.id}`}
                                                      value={opt.name}
                                                    >
                                                      {opt.name}
                                                    </option>
                                                  ))}
                                                </select>
                                              ) : (
                                                <input
                                                  type="text"
                                                  className="h-8 w-full rounded px-2 text-xs outline-none"
                                                  value={value}
                                                  onChange={(e) =>
                                                    setEditingValues((prev) => ({
                                                      ...prev,
                                                      [fieldId]:
                                                        f.type === "NUMBER"
                                                          ? e.target.value.replace(/[^\d]/g, "")
                                                          : e.target.value,
                                                    }))
                                                  }
                                                />
                                              )}
                                            </td>
                                          );
                                        })}
                                        <td className="border p-1.5 align-top whitespace-normal break-words">
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              className="h-8 w-8 bg-violet-600 p-0 text-white hover:bg-violet-700"
                                              onClick={saveRow}
                                              title="Save row"
                                              aria-label="Save row"
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 w-8 border-violet-300 p-0 text-violet-700"
                                              onClick={() => setEditingMasterKey(null)}
                                              title="Cancel editing row"
                                              aria-label="Cancel editing row"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ) : null}

                                    {rows.length === 0 ? (
                                      <tr>
                                        <td
                                          className="border px-3 py-5 text-center text-xs text-slate-500"
                                          colSpan={tableFields.length + 1}
                                        >
                                          No entries yet. Click “Add Row” to begin.
                                        </td>
                                      </tr>
                                    ) : (
                                      rows.map((row, rowIdx) => (
                                        <tr key={`${masterId}-row-${rowIdx}`}>
                                          {tableFields.map((f) => {
                                            const fieldId = Number(f.id);
                                            const v =
                                              row.fields.find(
                                                (rf) => rf.certificateFieldMasterId === fieldId,
                                              )?.value || "-";
                                            return (
                                              <td
                                                key={`${masterId}-${rowIdx}-${fieldId}`}
                                                className="border px-2 py-2 align-top whitespace-normal break-words"
                                              >
                                                {v}
                                              </td>
                                            );
                                          })}
                                          <td className="border px-2 py-2 align-top whitespace-normal break-words">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 w-8 border-violet-300 p-0 text-violet-700 hover:bg-violet-50"
                                              onClick={() => startEditRow(cm, rowIdx, idx)}
                                              title="Edit row"
                                              aria-label="Edit row"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="ml-2 h-8 w-8 border-rose-300 p-0 text-rose-700 hover:bg-rose-50"
                                              onClick={() =>
                                                setRowsByMaster((prev) => ({
                                                  ...prev,
                                                  [masterKey]: (prev[masterKey] || []).filter(
                                                    (_, i) => i !== rowIdx,
                                                  ),
                                                }))
                                              }
                                              title="Delete row"
                                              aria-label="Delete row"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">No data.</div>
                )}
              </div>

              <div className="shrink-0 border-t bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4">
                <div className="flex justify-end">
                  {stage === "form" ? (
                    <Button
                      className="bg-violet-600 px-6 text-white hover:bg-violet-700"
                      disabled={!canContinueForm || savingCp}
                      onClick={handleSubmitCareerProgression}
                    >
                      <ArrowRight className="mr-1 h-4 w-4" />
                      {savingCp ? "Saving..." : "Continue"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
