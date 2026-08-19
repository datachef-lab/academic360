"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranding } from "@/features/settings/hooks/use-branding";
import { getTicketByRef } from "@/services/service-requests.service";
import type { TicketPublic } from "@/services/service-requests.service";

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  DRAFT: { label: "Draft", color: "text-gray-500 bg-gray-100", icon: Clock },
  SUBMITTED: { label: "Submitted", color: "text-blue-600 bg-blue-50", icon: Clock },
  ROUTED: { label: "Routed to Department", color: "text-indigo-600 bg-indigo-50", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "text-yellow-700 bg-yellow-50", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  PENDING_SLOT_BOOKING: {
    label: "Pending Slot Booking",
    color: "text-orange-700 bg-orange-50",
    icon: Clock,
  },
  SLOT_BOOKED: { label: "Visit Scheduled", color: "text-teal-700 bg-teal-50", icon: CheckCircle2 },
  CHECKED_IN: { label: "Checked In", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  FULFILLED: { label: "Fulfilled", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "text-gray-600 bg-gray-100", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "text-red-700 bg-red-50", icon: XCircle },
  EXPIRED: { label: "Expired", color: "text-gray-500 bg-gray-100", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "text-gray-500 bg-gray-100", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "text-gray-600 bg-gray-100",
    icon: Clock,
  };
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function TrackRequestContent() {
  const { collegeName, abbreviation, logoUrl } = useBranding();
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") ?? "";

  const [refInput, setRefInput] = useState(initialRef);
  const [ticket, setTicket] = useState<TicketPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (ref?: string) => {
    const query = (ref ?? refInput).trim().toUpperCase();
    if (!query) {
      setError("Please enter a reference ID.");
      return;
    }
    setError("");
    setLoading(true);
    setTicket(null);
    try {
      const res = await getTicketByRef(query);
      if (res.httpStatusCode !== 200) throw new Error(res.message || "Not found");
      setTicket(res.payload);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Request not found";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if ref is in URL
  useEffect(() => {
    if (initialRef) {
      void handleSearch(initialRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col items-center justify-start px-4 py-10">
      {/* Branding */}
      <div className="mb-6 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            {(abbreviation || collegeName || "S").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          {abbreviation && (
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
              {abbreviation}
            </p>
          )}
          <h1 className="text-lg font-bold text-white leading-tight">Track Service Request</h1>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 md:p-10 space-y-6">
        <div>
          <p className="text-xs mb-4">
            <Link href="/services" className="text-indigo-600 hover:underline">
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              Back to Services
            </Link>
          </p>
          <h2 className="text-xl font-bold text-gray-900">Track Your Request</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your reference ID (e.g. SR-2025-000001) to check the status.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="refId" className="sr-only">
              Reference ID
            </Label>
            <Input
              id="refId"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value.toUpperCase())}
              placeholder="SR-YYYY-NNNNNN"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="uppercase tracking-widest font-mono"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 rounded-full border-b-2 border-indigo-600 animate-spin" />
          </div>
        )}

        {ticket && (
          <div className="space-y-4">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Reference ID</p>
                  <p className="font-mono font-bold text-indigo-700 text-lg">
                    {ticket.referenceId}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              <div className="border-t border-indigo-100 pt-3 grid grid-cols-2 gap-3 text-sm">
                {ticket.serviceType && (
                  <div>
                    <p className="text-xs text-gray-400">Service</p>
                    <p className="font-medium text-gray-800">{ticket.serviceType.name}</p>
                  </div>
                )}
                {ticket.department && (
                  <div>
                    <p className="text-xs text-gray-400">Department</p>
                    <p className="font-medium text-gray-800">{ticket.department.name}</p>
                  </div>
                )}
                {ticket.slaDueAt && (
                  <div>
                    <p className="text-xs text-gray-400">SLA Due</p>
                    <p className="font-medium text-gray-800">
                      {new Date(ticket.slaDueAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="font-medium text-gray-800">
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {ticket.requestorType && (
                  <div>
                    <p className="text-xs text-gray-400">Requestor Type</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {ticket.requestorType.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status timeline hint */}
            <div className="text-xs text-gray-400 text-center">
              Status updates are sent to your registered WhatsApp and email.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-b-2 border-white animate-spin" />
        </div>
      }
    >
      <TrackRequestContent />
    </Suspense>
  );
}
