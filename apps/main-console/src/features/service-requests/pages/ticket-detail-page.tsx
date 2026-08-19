import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getTicketDetail,
  getTicketEvents,
  getIdProofUrl,
  verifyIdProof,
  startReview,
  approveTicket,
  rejectTicket,
  setFulfilment,
  bookTicketSlot,
  cancelBooking,
  rescheduleBooking,
  getSlots,
  getPass,
  issueBypass,
  type Ticket,
  type TicketEvent,
  type SlotAvailability,
  type GatePass,
} from "../services/service-requests.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  QrCode,
  Shield,
  ExternalLink,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  ROUTED: "bg-indigo-100 text-indigo-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  PENDING_SLOT_BOOKING: "bg-orange-100 text-orange-700",
  SLOT_BOOKED: "bg-teal-100 text-teal-700",
  CHECKED_IN: "bg-cyan-100 text-cyan-700",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // ID proof
  const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Slot booking dialog
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [slotDate, setSlotDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Gate pass
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [loadingPass, setLoadingPass] = useState(false);

  // Bypass dialog
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [bypassReason, setBypassReason] = useState("");

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [t, evts] = await Promise.all([
        getTicketDetail(ticketId),
        getTicketEvents(ticketId),
      ]);
      setTicket(t);
      setEvents(evts);
    } catch {
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const loadIdProof = async () => {
    if (!ticket?.alumniIntakeId) return;
    setLoadingProof(true);
    try {
      const url = await getIdProofUrl(ticket.alumniIntakeId);
      setIdProofUrl(url);
    } catch {
      toast.error("Failed to load ID proof URL");
    } finally {
      setLoadingProof(false);
    }
  };

  const handleVerifyIdProof = async () => {
    if (!ticket?.alumniIntakeId) return;
    setActing(true);
    try {
      await verifyIdProof(ticket.alumniIntakeId);
      toast.success("ID proof marked as verified");
      await loadTicket();
    } catch {
      toast.error("Failed to verify ID proof");
    } finally {
      setActing(false);
    }
  };

  const handleStartReview = async () => {
    setActing(true);
    try {
      await startReview(ticketId);
      toast.success("Review started");
      await loadTicket();
    } catch {
      toast.error("Failed to start review");
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await approveTicket(ticketId);
      toast.success("Ticket approved");
      await loadTicket();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Failed to approve";
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setActing(true);
    try {
      await rejectTicket(ticketId, rejectReason);
      toast.success("Ticket rejected");
      setShowRejectDialog(false);
      setRejectReason("");
      await loadTicket();
    } catch {
      toast.error("Failed to reject ticket");
    } finally {
      setActing(false);
    }
  };

  const handleFulfilmentDecision = async (requiresPhysicalPresence: boolean) => {
    setActing(true);
    try {
      await setFulfilment(ticketId, { requiresPhysicalPresence });
      toast.success(
        requiresPhysicalPresence
          ? "Physical visit required — slot booking needed"
          : "Ticket fulfilled without physical visit",
      );
      await loadTicket();
    } catch {
      toast.error("Failed to set fulfilment");
    } finally {
      setActing(false);
    }
  };

  const loadSlots = async () => {
    if (!ticket?.departmentId) return;
    setLoadingSlots(true);
    try {
      const data = await getSlots(ticket.departmentId, slotDate);
      setSlots(data);
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (showSlotDialog && ticket?.departmentId) {
      void loadSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSlotDialog, slotDate, ticket?.departmentId]);

  const handleBookSlot = async () => {
    if (!selectedSlotId) {
      toast.error("Please select a slot");
      return;
    }
    setActing(true);
    try {
      if (isRescheduling) {
        await rescheduleBooking(ticketId, selectedSlotId);
        toast.success("Slot rescheduled");
      } else {
        await bookTicketSlot(ticketId, selectedSlotId);
        toast.success("Slot booked and gate pass issued");
      }
      setShowSlotDialog(false);
      setSelectedSlotId(null);
      await loadTicket();
    } catch {
      toast.error(isRescheduling ? "Failed to reschedule" : "Failed to book slot");
    } finally {
      setActing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm("Cancel this booking and revoke the gate pass?")) return;
    setActing(true);
    try {
      await cancelBooking(ticketId);
      toast.success("Booking cancelled");
      await loadTicket();
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setActing(false);
    }
  };

  const loadGatePass = async () => {
    setLoadingPass(true);
    try {
      const pass = await getPass(ticketId);
      setGatePass(pass);
    } catch {
      toast.error("No active gate pass found");
    } finally {
      setLoadingPass(false);
    }
  };

  const handleIssueBypass = async () => {
    if (!bypassReason.trim()) {
      toast.error("Please enter a bypass reason");
      return;
    }
    setActing(true);
    try {
      await issueBypass(ticketId, bypassReason);
      toast.success("Bypass pass issued");
      setShowBypassDialog(false);
      setBypassReason("");
      await loadTicket();
    } catch {
      toast.error("Failed to issue bypass");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center text-muted-foreground">Ticket not found.</div>
    );
  }

  const intake = ticket.alumniIntake;
  const isAlumni = ticket.requestorType === "ALUMNI";
  const st = ticket.status;

  return (
    <div className="p-4 flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:bg-slate-100 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-lg font-semibold font-mono text-violet-700">{ticket.referenceId}</h1>
          <Badge
            className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[st] ?? "bg-gray-100 text-gray-700"}`}
          >
            {st.replace(/_/g, " ")}
          </Badge>
          {ticket.serviceType && (
            <span className="text-sm text-slate-500">{ticket.serviceType.name}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={loadTicket}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid: left details, right actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Requestor info */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Requestor
            </h2>
            {isAlumni && intake ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Dt>Name</Dt>
                <Dd>{intake.fullName}</Dd>
                <Dt>Year of Passing</Dt>
                <Dd>{intake.yearOfPassing}</Dd>
                <Dt>Course / Stream</Dt>
                <Dd>{intake.courseStream}</Dd>
                <Dt>Univ Reg No</Dt>
                <Dd>{intake.universityRegNo}</Dd>
                <Dt>College Roll</Dt>
                <Dd>{intake.collegeRollNo}</Dd>
                <Dt>Mobile</Dt>
                <Dd>{intake.mobileWhatsapp}</Dd>
                <Dt>Email</Dt>
                <Dd>{intake.email}</Dd>
                <Dt>Contact Verified</Dt>
                <Dd>
                  {intake.contactVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-500">No</span>
                  )}
                </Dd>
                <Dt>ID Proof Type</Dt>
                <Dd>{intake.idProofType}</Dd>
                <Dt>ID Proof Verified</Dt>
                <Dd>
                  {intake.idProofVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-500">No</span>
                  )}
                </Dd>
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Dt>Type</Dt>
                <Dd>Current Student (User ID {ticket.studentUserId ?? "—"})</Dd>
                <Dt>Email</Dt>
                <Dd>{ticket.contactEmail ?? "—"}</Dd>
                <Dt>Phone</Dt>
                <Dd>{ticket.contactPhone ?? "—"}</Dd>
              </dl>
            )}
          </section>

          {/* Ticket info */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Ticket Info
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Dt>Service Type</Dt>
              <Dd>{ticket.serviceType?.name ?? `#${ticket.serviceTypeId}`}</Dd>
              <Dt>SLA Due</Dt>
              <Dd>
                {ticket.slaDueAt ? format(parseISO(ticket.slaDueAt), "dd MMM yyyy HH:mm") : "—"}
              </Dd>
              <Dt>Physical Visit</Dt>
              <Dd>
                {ticket.requiresPhysicalPresence === null || ticket.requiresPhysicalPresence === undefined
                  ? "Not decided"
                  : ticket.requiresPhysicalPresence
                    ? "Required"
                    : "Not required"}
              </Dd>
              <Dt>Routed At</Dt>
              <Dd>{ticket.routedAt ? format(parseISO(ticket.routedAt), "dd MMM yyyy HH:mm") : "—"}</Dd>
              <Dt>Approved At</Dt>
              <Dd>
                {ticket.approvedAt ? format(parseISO(ticket.approvedAt), "dd MMM yyyy HH:mm") : "—"}
              </Dd>
              {ticket.rejectionReason && (
                <>
                  <Dt>Rejection Reason</Dt>
                  <Dd className="text-red-600">{ticket.rejectionReason}</Dd>
                </>
              )}
            </dl>
          </section>

          {/* ID Proof (alumni only) */}
          {isAlumni && intake && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  ID Proof
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadIdProof}
                    disabled={loadingProof}
                  >
                    {loadingProof ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-1" />
                    )}
                    View ID Proof
                  </Button>
                  {!intake.idProofVerified && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleVerifyIdProof}
                      disabled={acting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mark Verified
                    </Button>
                  )}
                </div>
              </div>
              {idProofUrl && (
                <a
                  href={idProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 underline text-sm break-all"
                >
                  Open ID proof in new tab
                </a>
              )}
              {!intake.idProofVerified && (
                <p className="text-xs text-amber-600 mt-2">
                  ID proof not yet verified. Approval requires ID proof verification.
                </p>
              )}
            </section>
          )}

          {/* Gate pass */}
          {(st === "SLOT_BOOKED" || st === "CHECKED_IN") && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Gate Pass
                </h2>
                <Button variant="outline" size="sm" onClick={loadGatePass} disabled={loadingPass}>
                  {loadingPass ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-1" />
                  )}
                  Load Gate Pass
                </Button>
              </div>
              {gatePass && (
                <div className="flex flex-col gap-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Dt>Status</Dt>
                    <Dd>{gatePass.status}</Dd>
                    <Dt>Valid From</Dt>
                    <Dd>{format(parseISO(gatePass.validFrom), "dd MMM yyyy HH:mm")}</Dd>
                    <Dt>Valid Until</Dt>
                    <Dd>{format(parseISO(gatePass.validUntil), "dd MMM yyyy HH:mm")}</Dd>
                    <Dt>Bypass</Dt>
                    <Dd>{gatePass.isBypass ? "Yes" : "No"}</Dd>
                    {gatePass.checkedInAt && (
                      <>
                        <Dt>Checked In At</Dt>
                        <Dd>{format(parseISO(gatePass.checkedInAt), "dd MMM yyyy HH:mm")}</Dd>
                      </>
                    )}
                  </dl>
                  {gatePass.qrDataUrl && (
                    <img
                      src={gatePass.qrDataUrl}
                      alt="Gate pass QR code"
                      className="w-36 h-36 border border-slate-200 rounded"
                    />
                  )}
                </div>
              )}
            </section>
          )}

          {/* Audit trail */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Audit Trail
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {events.map((ev) => (
                  <li key={ev.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-violet-400 border-2 border-white" />
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(ev.createdAt), "dd MMM yyyy HH:mm")}
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {ev.eventType.replace(/_/g, " ")}
                      {ev.fromStatus && ev.toStatus && (
                        <span className="text-slate-500 font-normal">
                          {" "}
                          — {ev.fromStatus} → {ev.toStatus}
                        </span>
                      )}
                    </p>
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {JSON.stringify(ev.metadata)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Actions column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Actions
            </h2>
            <div className="flex flex-col gap-2">
              {st === "ROUTED" && (
                <Button
                  onClick={handleStartReview}
                  disabled={acting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Review
                </Button>
              )}

              {st === "UNDER_REVIEW" && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={acting || (isAlumni && !intake?.idProofVerified)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Approve
                  </Button>
                  {isAlumni && !intake?.idProofVerified && (
                    <p className="text-xs text-amber-600 text-center">
                      Verify ID proof before approving
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={acting}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {st === "APPROVED" && (
                <>
                  <p className="text-sm text-slate-600 mb-1">Fulfilment decision:</p>
                  <Button
                    onClick={() => handleFulfilmentDecision(false)}
                    disabled={acting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Fulfil (No physical visit)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFulfilmentDecision(true)}
                    disabled={acting}
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Requires Physical Visit
                  </Button>
                </>
              )}

              {st === "PENDING_SLOT_BOOKING" && (
                <Button
                  onClick={() => {
                    setIsRescheduling(false);
                    setShowSlotDialog(true);
                  }}
                  disabled={acting}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Slot
                </Button>
              )}

              {st === "SLOT_BOOKED" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRescheduling(true);
                      setShowSlotDialog(true);
                    }}
                    disabled={acting}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelBooking}
                    disabled={acting}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancel Booking
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBypassDialog(true)}
                    disabled={acting}
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Issue Bypass Pass
                  </Button>
                </>
              )}

              {st === "CHECKED_IN" && (
                <Button
                  variant="outline"
                  onClick={() => setShowBypassDialog(true)}
                  disabled={acting}
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Issue Bypass Pass
                </Button>
              )}

              {["CLOSED", "FULFILLED", "REJECTED", "EXPIRED", "CANCELLED"].includes(st) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  This ticket is in a terminal state.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Ticket</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={acting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slot booking dialog */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRescheduling ? "Reschedule Slot" : "Book a Slot"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="slot-date">Date</Label>
              <Input
                id="slot-date"
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-44"
              />
              <Button variant="outline" size="sm" onClick={loadSlots} disabled={loadingSlots}>
                {loadingSlots ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
            {loadingSlots ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No slots available for this date.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {slots.map((slot) => {
                  const full = slot.available <= 0;
                  return (
                    <button
                      key={slot.slotInstanceId}
                      disabled={full}
                      onClick={() => setSelectedSlotId(slot.slotInstanceId)}
                      className={`flex justify-between items-center px-4 py-2 rounded-md border text-sm transition-colors ${
                        selectedSlotId === slot.slotInstanceId
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : full
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50"
                      }`}
                    >
                      <span>
                        {format(parseISO(slot.startAt), "HH:mm")} —{" "}
                        {format(parseISO(slot.endAt), "HH:mm")}
                      </span>
                      <span>
                        {slot.available} / {slot.capacity} available
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBookSlot}
                disabled={acting || !selectedSlotId}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isRescheduling ? "Reschedule" : "Book"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bypass dialog */}
      <Dialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Bypass Gate Pass</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor="bypass-reason">Reason for Bypass</Label>
            <Textarea
              id="bypass-reason"
              placeholder="Enter reason for bypass…"
              value={bypassReason}
              onChange={(e) => setBypassReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBypassDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleIssueBypass}
                disabled={acting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Issue Bypass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Small helpers for definition list
function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-slate-500 text-xs font-medium uppercase tracking-wide">{children}</dt>;
}

function Dd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dd className={`text-slate-800 ${className}`}>{children}</dd>;
}
