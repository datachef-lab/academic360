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
  Download,
  Landmark,
  Loader2,
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
const FEE_CTX_KEY = "enrollment_fee_ctx_v1";

type FeeCtx = { feeStudentMappingId: number; feeStructureId: number; totalPayable: number };

const encodeFeeCtx = (ctx: FeeCtx): string => {
  try {
    return btoa(JSON.stringify(ctx));
  } catch {
    return "";
  }
};

const decodeFeeCtx = (encoded: string): FeeCtx | null => {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (Number.isFinite(parsed?.feeStudentMappingId) && Number.isFinite(parsed?.feeStructureId))
      return parsed as FeeCtx;
    return null;
  } catch {
    return null;
  }
};

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
  const [paymentResult, setPaymentResult] = useState<"success" | "failed" | null>(null);
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
  const [openedFromQuery, setOpenedFromQuery] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [paymentTimestamp, setPaymentTimestamp] = useState<string>("");
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
      ? `${process.env.NEXT_PUBLIC_URL!}/career-progression-female.png`
      : `${process.env.NEXT_PUBLIC_URL!}/career-progression-male.png`;
  const leftPanelImageSrc =
    stage === "payment"
      ? `${process.env.NEXT_PUBLIC_URL!}/fee-details-1.png`
      : careerProgressionImageSrc;
  const leftPanelImageAlt = stage === "payment" ? "Fee payment details" : "Career progression";

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
    const ctxParam = params.get("ctx");
    if (payment) {
      const feeCtx = ctxParam ? decodeFeeCtx(ctxParam) : null;
      if (feeCtx) {
        setSelectedFee(feeCtx);
      }
      const urlResult = payment === "success" ? "success" : "failed";
      setPaymentResult(urlResult);
      setPaymentMsg(
        respMsg ||
          (urlResult === "success"
            ? "Payment recorded successfully!"
            : "Payment failed due to a technical error. Please try after some time."),
      );
      setPaymentMode(urlResult === "success" ? "online" : null);
      setCpOpen(true);
      setStage("payment");
      setOpenedFromQuery(true);
      params.delete("payment");
      params.delete("orderId");
      params.delete("respMsg");
      params.delete("ctx");
      const next = params.toString();
      window.history.replaceState(
        {},
        "",
        next ? `${window.location.pathname}?${next}` : window.location.pathname,
      );

      const verifyAndShow = async () => {
        try {
          if (student?.id) {
            const { data: mapData } = await axiosInstance.get<ApiResponse<FeeMapping[]>>(
              `/api/v1/fees/student-mappings/student/${student.id}`,
            );
            const freshMappings = Array.isArray(mapData?.payload) ? mapData.payload : [];
            setMappings(freshMappings);

            if (feeCtx) {
              const mapping = freshMappings.find((m) => m.id === feeCtx.feeStudentMappingId);
              const dbStatus = String(mapping?.paymentStatus || "").toUpperCase();
              const isPaidInDb = dbStatus === "COMPLETED" || dbStatus === "SUCCESS";

              if (mapping?.feeStructure?.academicYear?.year) {
                setSelectedAcademicYear(mapping.feeStructure.academicYear.year);
              }

              if (isPaidInDb) {
                setPaymentResult("success");
                setPaymentMsg(respMsg || "Payment recorded successfully!");
                setPaymentMode("online");
                setPaymentTimestamp(
                  new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
                );
              } else {
                setPaymentResult("failed");
                setPaymentMsg(
                  respMsg || "Payment failed due to a technical error. Please try after some time.",
                );
                setPaymentMode(null);
              }
            } else {
              setPaymentResult(urlResult);
              setPaymentMsg(
                respMsg ||
                  (urlResult === "success"
                    ? "Payment recorded successfully!"
                    : "Payment failed due to a technical error. Please try after some time."),
              );
              setPaymentMode(urlResult === "success" ? "online" : null);
            }

            axiosInstance
              .get<ApiResponse<CareerProgressionTemplatePayload>>(
                `/api/academics/career-progression-forms/student/${student.id}/current`,
              )
              .then(({ data }) => {
                setCpData(data?.payload ?? null);
                setHasExistingCpForm(Boolean(data?.payload?.hasExistingForms));
              })
              .catch(() => {});
          }
        } catch {
          setPaymentResult(urlResult);
          setPaymentMsg(
            respMsg ||
              (urlResult === "success"
                ? "Payment recorded successfully!"
                : "Payment failed due to a technical error. Please try after some time."),
          );
          setPaymentMode(urlResult === "success" ? "online" : null);
        } finally {
          setLoading(false);
        }
      };
      verifyAndShow();
    }
  }, []);

  useEffect(() => {
    if (!mappings.length || openedFromQuery) return;
    const params = new URLSearchParams(window.location.search);
    const cp = params.get("cp");
    if (cp !== "1") return;

    const ctxParam = params.get("ctx");
    let ctx: FeeCtx | null = ctxParam ? decodeFeeCtx(ctxParam) : null;

    if (!ctx) {
      const rawCtx = window.sessionStorage.getItem(FEE_CTX_KEY);
      if (rawCtx) {
        try {
          ctx = JSON.parse(rawCtx) as FeeCtx;
        } catch {
          ctx = null;
        }
      }
    }

    const feeStudentMappingId = Number(ctx?.feeStudentMappingId);
    if (!Number.isFinite(feeStudentMappingId) || feeStudentMappingId <= 0) return;
    const selected = mappings.find((m) => m.id === feeStudentMappingId);
    if (!selected) return;
    setOpenedFromQuery(true);
    openCareerProgression({
      id: selected.id,
      feeStructureId: selected.feeStructureId,
      total: Number(selected.totalPayable || 0),
    });
  }, [mappings, openedFromQuery]);

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
        isPaid: ["COMPLETED", "SUCCESS"].includes(String(m.paymentStatus).toUpperCase()),
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
    isPaid?: boolean;
    academicYear?: string;
  }) => {
    if (!student?.id) return;
    setSelectedFee({
      feeStudentMappingId: fee.id,
      feeStructureId: fee.feeStructureId,
      totalPayable: fee.total,
    });
    if (fee.academicYear) setSelectedAcademicYear(fee.academicYear);
    setCpOpen(true);

    if (fee.isPaid) {
      setStage("payment");
      setPaymentResult("success");
      setPaymentMsg("Payment recorded successfully!");
      setPaymentMode("online");
      setPaymentTimestamp(
        new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      );
      setCpLoading(false);
      setCpError(null);
      axiosInstance
        .get<ApiResponse<CareerProgressionTemplatePayload>>(
          `/api/academics/career-progression-forms/student/${student.id}/current`,
        )
        .then(({ data }) => {
          setCpData(data?.payload ?? null);
          setHasExistingCpForm(Boolean(data?.payload?.hasExistingForms));
        })
        .catch(() => {});
      return;
    }

    setCpLoading(true);
    setCpError(null);
    setCpData(null);
    setStage("form");
    setPaymentMode(null);
    setPaymentMsg(null);
    setPaymentResult(null);
    setRowsByMaster({});
    setQuestionByField({});
    setEditingMasterKey(null);
    setEditingMasterId(null);
    setEditingRowIndex(null);
    setEditingValues({});
    window.sessionStorage.setItem(
      FEE_CTX_KEY,
      JSON.stringify({
        feeStudentMappingId: fee.id,
        feeStructureId: fee.feeStructureId,
        totalPayable: fee.total,
      }),
    );
    const params = new URLSearchParams();
    params.set("cp", "1");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
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
    try {
      setGeneratingReceipt(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/fees/student-mappings/download-receipt?feeStructureId=${selectedFee.feeStructureId}&studentId=${student.id}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        setPaymentMsg("Failed to generate fee challan. Please try again.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      setPaymentMsg("Failed to generate fee challan. Please try again.");
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const handleProceedToPaytm = async () => {
    if (!selectedFee || !student?.id) return;
    window.sessionStorage.setItem(FEE_CTX_KEY, JSON.stringify(selectedFee));
    const returnParams = new URLSearchParams();
    returnParams.set("cp", "1");
    returnParams.set("stage", "payment");
    returnParams.set("ctx", encodeFeeCtx(selectedFee));
    const returnUrl = `${window.location.origin}${window.location.pathname}?${returnParams.toString()}`;
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
    form.target = "_self";
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
                  isPaid: fee.isPaid,
                  academicYear: fee.academicYear,
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

      <Dialog
        open={cpOpen}
        onOpenChange={(nextOpen) => {
          setCpOpen(nextOpen);
          if (!nextOpen) {
            const params = new URLSearchParams(window.location.search);
            params.delete("cp");
            params.delete("stage");
            window.sessionStorage.removeItem(FEE_CTX_KEY);
            const next = params.toString();
            window.history.replaceState(
              {},
              "",
              next ? `${window.location.pathname}?${next}` : window.location.pathname,
            );
          }
        }}
      >
        <DialogContent
          className={`overflow-hidden p-0 ${
            paymentResult === "success" && stage === "payment"
              ? "h-auto max-h-[90vh] w-[95vw] max-w-2xl"
              : "h-[94vh] w-[99vw] max-w-[1700px]"
          }`}
        >
          <div className="flex h-full w-full min-h-0">
            {paymentResult !== "success" && (
              <div
                className={`hidden h-full w-[32%] overflow-hidden bg-slate-100 md:block ${
                  stage === "payment" ? "border-r-2 border-indigo-200" : ""
                }`}
              >
                <div className="relative h-full w-full">
                  <img
                    src={leftPanelImageSrc}
                    alt={leftPanelImageAlt}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </div>
            )}

            <div
              className={`flex h-full min-h-0 w-full flex-col ${
                paymentResult !== "success" ? "md:w-[68%]" : ""
              }`}
            >
              <DialogHeader
                className={`shrink-0 border-b px-6 py-4 text-white ${
                  paymentResult === "success" && stage === "payment"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600"
                }`}
              >
                <DialogTitle className="flex items-center gap-2 text-white">
                  {paymentResult === "success" && stage === "payment" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {stage === "payment"
                    ? paymentResult === "success"
                      ? "Payment Successful"
                      : "Fee Payment Details"
                    : "Career Progression Form"}
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
                      className="h-12 w-full bg-indigo-700 text-lg text-white hover:bg-indigo-800"
                      onClick={() => setStage("payment")}
                    >
                      Proceed to Enrolment <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                ) : stage === "payment" ? (
                  <div className="mx-auto max-w-3xl space-y-5">
                    {paymentResult === "success" ? (
                      <>
                        <h2 className="text-2xl font-bold text-slate-900">Confirmation</h2>
                        <p className="text-slate-600">
                          Your fee payment has been successfully received and confirmed.
                        </p>

                        <div className="rounded-xl border bg-white overflow-hidden">
                          <div className="rounded-t-xl bg-emerald-800 px-5 py-4 text-white">
                            <span className="font-semibold">Fee Summary</span>
                            <span className="mx-2">·</span>
                            <span>
                              AY {selectedAcademicYear || cpData?.academicYear?.year || ""}
                            </span>
                          </div>
                          <div className="px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount Paid
                            </p>
                            <p className="text-5xl font-bold text-slate-800">
                              {formatInr(selectedFee?.totalPayable || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">Payment Confirmed</p>
                            <p className="text-xs text-green-700">
                              {paymentMsg}
                              {paymentTimestamp ? ` · ${paymentTimestamp}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Fee Challan
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            Your paid challan with a <span className="font-bold">PAID</span> stamp
                            is available for download.
                          </p>
                          <Button
                            className="mt-4 w-full border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            variant="outline"
                            onClick={handleGenerateFeeReceipt}
                            disabled={generatingReceipt}
                          >
                            {generatingReceipt ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Paid Challan
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {paymentMsg ? (
                          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                            <X className="h-5 w-5 shrink-0 text-red-600" />
                            {paymentMsg}
                          </div>
                        ) : null}
                        <p className="text-slate-700 pt-1">
                          Choose your preferred payment mode below and proceed with payment.
                        </p>
                        <div className="rounded-xl border bg-white">
                          <div className="rounded-t-xl bg-indigo-800 px-5 py-4 text-white">
                            <span className="font-semibold">Fee Summary</span>
                            <span className="mx-2">·</span>
                            <span>
                              Academic Year {selectedAcademicYear || cpData?.academicYear?.year}
                            </span>
                          </div>
                          <div className="px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount to Pay
                            </p>
                            <p className="text-5xl font-bold text-slate-800">
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
                              <div className="mb-2 flex items-center justify-between">
                                <Landmark className="h-5 w-5 text-slate-700" />
                                <span
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                                    paymentMode === "cash"
                                      ? "border-teal-600 bg-teal-600 text-white"
                                      : "border-slate-300 bg-white text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              </div>
                              <p className="font-bold text-slate-900">Cash Payment</p>
                              <p className="text-sm text-slate-500">
                                Pay at Federal Bank, any branch
                              </p>
                            </button>
                            <button
                              className={`rounded-xl border p-4 text-left ${
                                paymentMode === "online"
                                  ? "border-teal-600 bg-teal-50"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                              onClick={() => setPaymentMode("online")}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <CreditCard className="h-5 w-5 text-slate-700" />
                                <span
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                                    paymentMode === "online"
                                      ? "border-teal-600 bg-teal-600 text-white"
                                      : "border-slate-300 bg-white text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              </div>
                              <p className="font-bold text-slate-900">Online Payment</p>
                              <p className="text-sm text-slate-500">
                                Pay securely via Paytm gateway
                              </p>
                            </button>
                          </div>

                          {paymentMode === "cash" ? (
                            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                              <p className="mb-2 font-semibold text-amber-900">
                                📋 Instructions for Cash Payment
                              </p>
                              <ul className="list-disc space-y-1 pl-5 text-amber-900">
                                <li>
                                  Download and print your fee challan by clicking{" "}
                                  <span className="font-semibold">Generate Challan</span> below.
                                </li>
                                <li>
                                  Visit{" "}
                                  <span className="font-semibold">Federal Bank, any branch</span>,
                                  with the printed challan and cash to pay the fee in cash at the
                                  bank.
                                </li>
                                <li>
                                  After the payment, email us the scan copy of your fee paid challan
                                  to{" "}
                                  <span className="font-semibold underline">
                                    fees@institution.edu
                                  </span>
                                  .
                                </li>
                                <li>
                                  You will receive an email on your institutional email ID once the
                                  fee is updated in your online profile - this usually takes{" "}
                                  <span className="font-semibold">5-7 working days</span>.
                                </li>
                                <li>
                                  You are advised to keep the copy of your original fee paid
                                  challan, received from the bank, for future institutional
                                  purposes.
                                </li>
                              </ul>
                              <Button
                                className="mt-4 w-full bg-indigo-800 text-white hover:bg-indigo-900"
                                onClick={handleGenerateFeeReceipt}
                                disabled={generatingReceipt}
                              >
                                {generatingReceipt ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Challan...
                                  </>
                                ) : (
                                  "Generate Fee Challan"
                                )}
                              </Button>
                            </div>
                          ) : null}

                          {paymentMode === "online" ? (
                            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                              <p className="mb-2 font-semibold text-amber-900">
                                🔒 Instructions for Online Payment
                              </p>
                              <ul className="list-disc space-y-1 pl-5 text-amber-900">
                                <li>
                                  You will be redirected to the Paytm secure payment gateway.{" "}
                                  <span className="font-semibold">
                                    Do not close the window or go back
                                  </span>{" "}
                                  mid-transaction.
                                </li>
                                <li>
                                  Accepted methods: UPI, Debit/Credit Card, Net Banking, and Paytm
                                  Wallet.
                                </li>
                                <li>
                                  A payment confirmation will be sent to your institutional email
                                  ID, along with an{" "}
                                  <span className="font-semibold">e-paid copy of your challan</span>
                                  , upon successful transaction.
                                </li>
                                <li>
                                  In case of a failed transaction (if the amount is debited from
                                  your account but you do not receive an e-paid copy of your
                                  receipt), please wait for{" "}
                                  <span className="font-semibold">2-3 working days</span> before
                                  re-attempting to make the payment.
                                </li>
                                <li>
                                  For any payment issues, send an email to{" "}
                                  <span className="font-semibold underline">
                                    fees@institution.edu
                                  </span>{" "}
                                  from your institutional email ID only, with your transaction
                                  details.
                                </li>
                              </ul>
                              <Button
                                className="mt-4 w-full bg-indigo-800 text-white hover:bg-indigo-900"
                                onClick={handleProceedToPaytm}
                              >
                                Proceed to Pay
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
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
