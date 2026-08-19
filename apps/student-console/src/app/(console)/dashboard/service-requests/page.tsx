"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useStudent } from "@/providers/student-provider";
import {
  fetchServiceTypes,
  submitServiceRequest,
  getMyTickets,
} from "@/services/service-requests.service";
import type { ServiceType, TicketPublic } from "@/services/service-requests.service";
import { axiosInstance } from "@/lib/utils";
import { ApiResponse } from "@/types/api-response";

// ─── Types for draft ticket creation ────────────────────────────────────────

interface CreateDraftResult {
  ticketId: number;
  referenceId: string;
}

// ─── Status badge (mirrors public track page) ────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  DRAFT: { label: "Draft", color: "text-gray-500 bg-gray-100", icon: Clock },
  SUBMITTED: { label: "Submitted", color: "text-blue-600 bg-blue-50", icon: Clock },
  ROUTED: { label: "Routed", color: "text-indigo-600 bg-indigo-50", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "text-yellow-700 bg-yellow-50", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  PENDING_SLOT_BOOKING: { label: "Pending Slot Booking", color: "text-orange-700 bg-orange-50", icon: Clock },
  SLOT_BOOKED: { label: "Visit Scheduled", color: "text-teal-700 bg-teal-50", icon: CheckCircle2 },
  CHECKED_IN: { label: "Checked In", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  FULFILLED: { label: "Fulfilled", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "text-gray-600 bg-gray-100", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "text-red-700 bg-red-50", icon: XCircle },
  EXPIRED: { label: "Expired", color: "text-gray-500 bg-gray-100", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "text-gray-500 bg-gray-100", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "text-gray-600 bg-gray-100", icon: Clock };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type View = "list" | "new" | "done";

export default function StudentServiceRequestsPage() {
  const { user } = useAuth();
  const { student } = useStudent();

  const [view, setView] = useState<View>("list");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [tickets, setTickets] = useState<TicketPublic[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");

  // New request form state
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [requiresPhysical, setRequiresPhysical] = useState<boolean | null>(null);
  const [submittedRef, setSubmittedRef] = useState("");

  const selectedService = serviceTypes.find((s) => s.id === serviceTypeId);

  useEffect(() => {
    if (selectedService) setRequiresPhysical(selectedService.requiresPhysicalPresenceDefault);
  }, [selectedService]);

  // Load service types
  useEffect(() => {
    fetchServiceTypes().then(setServiceTypes).catch(console.error);
  }, []);

  // Load my tickets
  const loadTickets = () => {
    setLoadingTickets(true);
    getMyTickets()
      .then((res) => {
        // res.payload may be an array or paginated object
        const list = Array.isArray(res.payload)
          ? res.payload
          : (res.payload as unknown as { content?: TicketPublic[] })?.content ?? [];
        setTickets(list);
      })
      .catch(console.error)
      .finally(() => setLoadingTickets(false));
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Identity from session
  const studentName = user?.name ?? "";
  const studentEmail = user?.email ?? "";

  // ── Create draft + submit for student ────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTypeId) {
      setError("Please select a service.");
      return;
    }
    setError("");
    setLoadingSubmit(true);
    try {
      // Step 1: Create a draft ticket for this student
      const draftRes = await axiosInstance.post<ApiResponse<CreateDraftResult>>(
        "/api/service-requests/student/draft",
        { serviceTypeId, details: {} },
      );
      if (draftRes.data.httpStatusCode !== 200 && draftRes.data.httpStatusCode !== 201) {
        throw new Error(draftRes.data.message || "Failed to create draft");
      }
      const { ticketId } = draftRes.data.payload;

      // Step 2: Submit (session JWT used automatically via axiosInstance)
      const submitRes = await submitServiceRequest({
        ticketId,
        requiresPhysicalPresence: requiresPhysical ?? undefined,
      });
      if (submitRes.httpStatusCode !== 200 && submitRes.httpStatusCode !== 201) {
        throw new Error(submitRes.message || "Submission failed");
      }
      setSubmittedRef(submitRes.payload.referenceId);
      setView("done");
      loadTickets();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Submission failed";
      setError(msg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ─── List view ────────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Service Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Request institutional documents and services.
            </p>
          </div>
          <Button
            onClick={() => { setView("new"); setError(""); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> New Request
          </Button>
        </div>

        {loadingTickets ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-b-2 border-indigo-600 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center py-16 gap-3">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No service requests yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setView("new"); setError(""); }}
            >
              Raise your first request
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-indigo-700">
                      {t.referenceId}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  {t.serviceType && (
                    <p className="text-sm font-medium text-gray-800 truncate">{t.serviceType.name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {t.department && ` · ${t.department.name}`}
                  </p>
                </div>
                {t.slaDueAt && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">SLA due</p>
                    <p className="text-xs font-medium text-gray-600">
                      {new Date(t.slaDueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── New request view ─────────────────────────────────────────────────────

  if (view === "new") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-indigo-600 hover:underline mb-3 flex items-center gap-1"
          >
            <ArrowRight className="h-3 w-3 rotate-180" /> Back to My Requests
          </button>
          <h1 className="text-xl font-bold text-gray-900">New Service Request</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your identity is prefilled from your session.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Identity preview */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-2 text-sm">
          <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-2">
            Your Identity
          </p>
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-800">{studentName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{studentEmail || "—"}</span>
          </div>
          {(student as { uid?: string })?.uid && (
            <div className="flex justify-between">
              <span className="text-gray-500">UID</span>
              <span className="font-medium text-gray-800">{(student as { uid?: string }).uid}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="serviceType">Service Required</Label>
            <Select
              value={serviceTypeId ? String(serviceTypeId) : ""}
              onValueChange={(v) => setServiceTypeId(Number(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 space-y-1">
              {selectedService.slaDays && (
                <p>Typical turnaround: <span className="font-medium text-gray-700">{selectedService.slaDays} working days</span></p>
              )}
              {selectedService.requiresIdProof && (
                <p className="text-yellow-700">This service requires ID proof verification by the department.</p>
              )}
            </div>
          )}

          {selectedService?.requiresPhysicalPresenceDefault !== undefined && (
            <div>
              <Label className="block mb-2">Campus visit required?</Label>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setRequiresPhysical(v)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                      requiresPhysical === v
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-500 hover:border-indigo-300"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loadingSubmit || !serviceTypeId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loadingSubmit ? "Submitting..." : "Submit Request"}
            {!loadingSubmit && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </div>
    );
  }

  // ─── Done view ────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-5 text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Request Submitted!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Routed to the concerned department. You'll be notified of updates.
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-8 py-5 w-full">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Reference ID</p>
          <p className="text-2xl font-mono font-bold text-indigo-700">{submittedRef}</p>
        </div>
        <Button
          onClick={() => { setView("list"); }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          View My Requests
        </Button>
      </div>
    </div>
  );
}
