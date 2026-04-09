"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  orderTableFieldsTypeFirst,
  sortCpCertificateMasters,
  usesInternshipWorkRowLayout,
} from "@/lib/career-progression-form-utils";
import { axiosInstance, toSentenceCase } from "@/lib/utils";
import { useStudent } from "@/providers/student-provider";
import { useFeeSocket } from "@/providers/fee-socket-provider";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  ExternalLinkIcon,
  Landmark,
  Loader2,
  Plus,
  School,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

type ApiResponse<T> = { payload: T; message?: string };

export type FeeMapping = {
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
    ? "min-w-[92px] h-9 px-4 rounded-xl bg-green-100 hover:bg-green-100 text-green-800 border border-green-200"
    : "min-w-[92px] h-9 px-4 rounded-xl bg-yellow-100 hover:bg-yellow-100 text-yellow-800 border border-yellow-200";

const isInternshipOnlySection = (name: string) => {
  const n = name.trim().toLowerCase();
  return n.includes("internship") && !n.includes("work experience");
};

const buildEmptyRowDraft = (master: CertificateMaster): RowDraft => {
  const tableFields = master.fields
    .filter((f) => !f.isQuestion)
    .sort((a, b) => a.sequence - b.sequence);
  return {
    certificateMasterId: Number(master.id) || 0,
    fields: tableFields
      .filter((f) => f.id != null)
      .map((f) => ({
        certificateFieldMasterId: Number(f.id),
        value: "",
      })),
  };
};

const buildRowDraftFromEditingValues = (
  master: CertificateMaster,
  editingValues: Record<number, string>,
  certificateMasterId: number,
): RowDraft => ({
  certificateMasterId: Number(master.id) || certificateMasterId || 0,
  fields: master.fields
    .filter((f) => !f.isQuestion)
    .sort((a, b) => a.sequence - b.sequence)
    .filter((f) => f.id != null)
    .map((f) => {
      const fid = Number(f.id);
      return {
        certificateFieldMasterId: fid,
        value: editingValues[fid] ?? "",
      };
    }),
});

export default function EnrollmentFeesPage() {
  const { student } = useStudent();
  const { feeMappingsVersion, cpFormVersion, invalidateCpForm } = useFeeSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mappings, setMappings] = useState<FeeMapping[]>([]);
  const [hasExistingCpForm, setHasExistingCpForm] = useState<boolean | null>(null);

  const [cpOpen, setCpOpen] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
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
  const [openedFromQuery, setOpenedFromQuery] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [paymentTimestamp, setPaymentTimestamp] = useState<string>("");
  const handledPaymentRedirectRef = useRef(false);

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
  }, [student?.id, feeMappingsVersion]);

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
  }, [student?.id, cpFormVersion]);

  useEffect(() => {
    if (handledPaymentRedirectRef.current) return;
    if (!student?.id) return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;
    handledPaymentRedirectRef.current = true;

    const respMsg = params.get("respMsg");
    const ctxParam = params.get("ctx");

    const feeCtx = ctxParam ? decodeFeeCtx(ctxParam) : null;
    if (feeCtx) setSelectedFee(feeCtx);

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
        const { data: mapData } = await axiosInstance.get<ApiResponse<FeeMapping[]>>(
          `/api/v1/fees/student-mappings/student/${student.id}`,
        );
        const freshMappings = Array.isArray(mapData?.payload) ? mapData.payload : [];
        setMappings(freshMappings);

        if (feeCtx) {
          const mapping = freshMappings.find((m) => m.id === feeCtx.feeStudentMappingId);
          const className = mapping?.feeStructure?.class?.name || "";
          setSelectedClassName(className);
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
  }, [student?.id]);

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

  const appendEmptyRow = (master: CertificateMaster, idx: number) => {
    const key = getMasterKey(master, idx);
    setRowsByMaster((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), buildEmptyRowDraft(master)],
    }));
  };

  const updateRowCell = (
    master: CertificateMaster,
    masterKey: string,
    rowIdx: number,
    fieldId: number,
    value: string,
  ) => {
    setRowsByMaster((prev) => {
      const current = prev[masterKey] || [];
      const row = current[rowIdx];
      if (!row) return prev;
      const tableFields = master.fields
        .filter((f) => !f.isQuestion)
        .sort((a, b) => a.sequence - b.sequence);
      const values: Record<number, string> = {};
      tableFields.forEach((f) => {
        if (f.id == null) return;
        const fid = Number(f.id);
        values[fid] = row.fields.find((rf) => rf.certificateFieldMasterId === fid)?.value ?? "";
      });
      values[fieldId] = value;
      const newRow = buildRowDraftFromEditingValues(master, values, Number(master.id) || 0);
      const next = [...current];
      next[rowIdx] = newRow;
      return { ...prev, [masterKey]: next };
    });
  };

  const openCareerProgression = async (fee: {
    id: number;
    feeStructureId: number;
    total: number;
    isPaid?: boolean;
    academicYear?: string;
  }) => {
    setSelectedClassName(
      mappings.find((m) => m.feeStructureId === fee.feeStructureId)?.feeStructure?.class?.name ||
        null,
    );
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
      if (data?.payload?.hasExistingForms) {
        setStage("payment");
      } else if (data?.payload) {
        const sorted = sortCpCertificateMasters(data.payload.certificateMasters);
        const initialRows: Record<string, RowDraft[]> = {};
        sorted.forEach((master, idx) => {
          const hasTableFields = master.fields.some((f) => !f.isQuestion);
          if (!isInternshipOnlySection(master.name) && hasTableFields) {
            initialRows[getMasterKey(master, idx)] = [buildEmptyRowDraft(master)];
          }
        });
        setRowsByMaster(initialRows);
      }
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
      const requiredTableFields = isInternshipOnlySection(master.name)
        ? []
        : master.fields.filter((f) => !f.isQuestion && f.isRequired);
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
        const tableFields = isInternshipOnlySection(master.name)
          ? []
          : master.fields.filter((f) => !f.isQuestion);

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

          const merged = [...qMapped, ...mappedRowFields];
          if (merged.length === 0) return;

          certificates.push({
            certificateMasterId: Number(master.id),
            fields: merged,
          });
        });
      });

      await axiosInstance.post(
        `/api/academics/career-progression-forms/student/${student.id}/current/submit`,
        { certificates },
      );

      setHasExistingCpForm(true);
      setStage("submitted");
      invalidateCpForm();
    } catch (e) {
      console.error(e);
      setCpError("Failed to submit career progression form");
    } finally {
      setSavingCp(false);
    }
  };

  const handleGenerateFeeReceipt = async () => {
    if (!selectedFee || !student?.id) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    try {
      setGeneratingReceipt(true);
      const postRes = await fetch(`${base}/api/v1/fees/receipts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeStructureId: selectedFee.feeStructureId,
          studentId: student.id,
        }),
      });
      if (!postRes.ok) {
        setPaymentMsg("Failed to generate fee challan. Please try again.");
        return;
      }
      const postJson = (await postRes.json()) as {
        payload?: { url?: string };
      };
      const pathWithQuery = postJson.payload?.url;
      if (!pathWithQuery) {
        setPaymentMsg("Failed to generate fee challan. Please try again.");
        return;
      }
      const origin = base.replace(/\/$/, "");
      const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
      window.open(`${origin}${path}`, "_blank", "noopener,noreferrer");
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
            <h1 className="text-2xl font-bold md:text-4xl">Enrolment & Fees</h1>
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
              className="h-full max-w-[360px] overflow-hidden border bg-white shadow-lg transition-all hover:shadow-xl"
            >
              <div className="relative h-full">
                <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-indigo-500/[0.03]" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1 text-[24px] font-bold leading-none text-slate-900">
                        Fees for {toSentenceCase(fee.className)}
                      </CardTitle>
                      <p className="text-sm">Academic Year {fee.academicYear}</p>
                    </div>
                    <Badge
                      className={`inline-flex shrink-0 items-center justify-center self-start text-sm font-semibold leading-none ${statusBadgeClass(fee.isPaid)}`}
                    >
                      {fee.isPaid ? "PAID" : "PENDING"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3 pt-0 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[34px] font-bold leading-none text-blue-700">
                      {formatInr(fee.total)}
                    </p>
                  </div>
                  <div className="flex pt-4 justify-center items-center gap-2 text-xs text-slate-600">
                    <Button
                      onClick={() =>
                        openCareerProgression({
                          id: fee.id,
                          feeStructureId: fee.feeStructureId,
                          total: fee.total,
                          isPaid: fee.isPaid,
                          academicYear: fee.academicYear,
                        })
                      }
                      className="bg-indigo-700 w-full hover:bg-indigo-800"
                    >
                      <span>{fee.isPaid ? "View Details" : "Click here to proceed"}</span>
                      <ExternalLinkIcon />
                    </Button>
                  </div>
                  {/* {hasExistingCpForm === false ? (
                    <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
                      Please fill up the career-progression form before proceeding with payment.
                    </p>
                  ) : null} */}
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
              : "h-[90vh] w-[92vw] max-w-7xl"
          }`}
        >
          <div className="flex h-full w-full min-h-0">
            <div className="flex h-full min-h-0 w-full flex-col">
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
                            {selectedAcademicYear || cpData?.academicYear?.year ? (
                              <>
                                <span className="mx-2">·</span>
                                <span>
                                  Academic Year {selectedAcademicYear || cpData?.academicYear?.year}
                                </span>
                                <span className="mx-2">·</span>
                                <span>{toSentenceCase(selectedClassName || "")}</span>
                              </>
                            ) : null}
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
                            <p className="text-xs text-green-700">{paymentMsg}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Fee Challan
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            Click below to download your paid copy of the fee challan.
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
                            <span className="font-semibold">
                              Fee Summary (Fees for {toSentenceCase(selectedClassName || "")})
                            </span>
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
                                Pay securely via Payment gateway
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
                                  <span className="font-semibold">Generate Fee Challan</span> below.
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
                                    feeupdate@thebges.edu.in
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
                                  You will be redirected to the secure payment gateway.{" "}
                                  <span className="font-semibold">
                                    Do not close the window or go back
                                  </span>{" "}
                                  mid-transaction.
                                </li>
                                <li>
                                  Accepted methods: UPI, Debit/Credit Card, Net Banking, and Wallet.
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
                                  For any payment issues,{" "}
                                  <a
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSfh0tY1CgvWFNJ3SAyJRwAu8C5KkOPdREc7nYW-WqGAhp7GVQ/viewform"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold underline"
                                  >
                                    Click here
                                  </a>{" "}
                                  to fill the google form (accessible from your institutional email
                                  ID only).
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
                  <div className="w-full space-y-5">
                    <div className="rounded-xl bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 p-4">
                      <p className="font-semibold text-indigo-900">
                        Academic Year: {cpData.academicYear.year}
                      </p>
                      <p className="text-xs text-indigo-700">
                        Fill all required fields to continue.
                      </p>
                    </div>

                    {sortCpCertificateMasters(cpData.certificateMasters).map((cm, idx) => {
                      const masterId = Number(cm.id);
                      const masterKey = getMasterKey(cm, idx);
                      const sortedFields = cm.fields
                        .slice()
                        .sort((a, b) => a.sequence - b.sequence);
                      const questionFields = sortedFields.filter((f) => f.isQuestion);
                      const tableFields = orderTableFieldsTypeFirst(
                        sortedFields.filter((f) => !f.isQuestion),
                      );
                      const rows = rowsByMaster[masterKey] || [];
                      const isInternshipOnly = isInternshipOnlySection(cm.name);
                      const showTable = !isInternshipOnly && tableFields.length > 0;
                      const isInternshipWorkLayout = usesInternshipWorkRowLayout(cm.name);
                      return (
                        <div
                          key={`${cm.name}-${idx}`}
                          className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-100 via-white to-slate-100 px-5 py-4">
                            <div>
                              <p className="text-lg font-semibold tracking-tight text-slate-900">
                                {String.fromCharCode(65 + idx)}. {cm.name}
                              </p>
                              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                {cm.description}
                              </p>
                            </div>
                            {!isInternshipWorkLayout && showTable ? (
                              <Button
                                size="sm"
                                className="shrink-0 bg-violet-600 text-sm text-white hover:bg-violet-700"
                                onClick={() => appendEmptyRow(cm, idx)}
                              >
                                <Plus className="mr-1 h-4 w-4" /> Add Row
                              </Button>
                            ) : null}
                          </div>

                          <div className="bg-white px-5 pb-5 pt-4">
                            {questionFields.length > 0 ? (
                              <div className="mb-5 space-y-4 rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                                {questionFields.map((qf) => {
                                  const qfId = Number(qf.id);
                                  return (
                                    <div
                                      key={`${masterId}-${qfId}`}
                                      className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                                    >
                                      <label className="text-base font-semibold leading-snug text-slate-800">
                                        {qf.name}
                                        {qf.isRequired || qf.isQuestion ? (
                                          <span className="ml-1 text-red-600">*</span>
                                        ) : null}
                                      </label>
                                      {qf.type === "SELECT" ? (
                                        <Select
                                          value={questionByField[qfId] || ""}
                                          onValueChange={(value) =>
                                            setQuestionByField((prev) => ({
                                              ...prev,
                                              [qfId]: value,
                                            }))
                                          }
                                        >
                                          <SelectTrigger className="h-11 w-full max-w-[260px] bg-white text-base md:justify-self-end">
                                            <SelectValue placeholder="Select option" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {qf.options.map((opt) => (
                                              <SelectItem
                                                key={`${qfId}-${opt.id}-${opt.name}`}
                                                value={opt.name}
                                              >
                                                {opt.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <input
                                          className="h-11 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-base outline-none"
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

                            {isInternshipWorkLayout && showTable ? (
                              <div className="mb-4 flex justify-end">
                                <Button
                                  size="sm"
                                  className="bg-violet-600 text-sm text-white hover:bg-violet-700"
                                  onClick={() => appendEmptyRow(cm, idx)}
                                >
                                  <Plus className="mr-1 h-4 w-4" /> Add Row
                                </Button>
                              </div>
                            ) : null}

                            {showTable ? (
                              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                <table className="w-full min-w-[680px] table-fixed border-collapse text-sm">
                                  <thead className="bg-slate-100/90 text-slate-800">
                                    <tr>
                                      {tableFields.map((f) => (
                                        <th
                                          key={`${masterId}-${f.id}`}
                                          className="border border-slate-200 px-3 py-3 text-left text-sm font-semibold whitespace-normal break-words"
                                        >
                                          {f.name.toUpperCase()}
                                          {f.isRequired ? (
                                            <span className="ml-1 text-red-600">*</span>
                                          ) : null}
                                        </th>
                                      ))}
                                      <th className="w-[120px] border border-slate-200 px-3 py-3 text-left text-sm font-semibold whitespace-normal break-words">
                                        ACTION
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.length === 0 ? (
                                      <tr>
                                        <td
                                          className="border border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                                          colSpan={tableFields.length + 1}
                                        >
                                          No rows yet. Use "Add Row" to add one.
                                        </td>
                                      </tr>
                                    ) : (
                                      rows.map((row, rowIdx) => (
                                        <tr key={`${masterId}-row-${rowIdx}`}>
                                          {tableFields.map((f) => {
                                            const fieldId = Number(f.id);
                                            const cellValue =
                                              row.fields.find(
                                                (rf) => rf.certificateFieldMasterId === fieldId,
                                              )?.value ?? "";
                                            return (
                                              <td
                                                key={`${masterId}-${rowIdx}-${fieldId}`}
                                                className="border border-slate-200 p-2 align-top whitespace-normal break-words"
                                              >
                                                {f.type === "SELECT" ? (
                                                  <Select
                                                    value={cellValue}
                                                    onValueChange={(nextValue) =>
                                                      updateRowCell(
                                                        cm,
                                                        masterKey,
                                                        rowIdx,
                                                        fieldId,
                                                        nextValue,
                                                      )
                                                    }
                                                  >
                                                    <SelectTrigger className="h-10 w-full text-sm">
                                                      <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {f.options.map((opt) => (
                                                        <SelectItem
                                                          key={`${fieldId}-${opt.id}`}
                                                          value={opt.name}
                                                        >
                                                          {opt.name}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                ) : (
                                                  <input
                                                    type="text"
                                                    inputMode={
                                                      f.type === "NUMBER" ? "numeric" : undefined
                                                    }
                                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                                                    value={cellValue}
                                                    onChange={(e) =>
                                                      updateRowCell(
                                                        cm,
                                                        masterKey,
                                                        rowIdx,
                                                        fieldId,
                                                        f.type === "NUMBER"
                                                          ? e.target.value.replace(/[^\d]/g, "")
                                                          : e.target.value,
                                                      )
                                                    }
                                                  />
                                                )}
                                              </td>
                                            );
                                          })}
                                          <td className="border border-slate-200 p-2 align-top whitespace-normal break-words">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-9 w-9 border-slate-300 p-0 text-rose-700 hover:bg-rose-50"
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
                            ) : null}
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
