import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/api";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/features/auth/providers/auth-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserStatusMappingRow {
  id: number;
  sessionId: number;
  userId: number;
  studentId: number | null;
  promotionId: number | null;
  suspendedReason: string | null;
  suspendedTillDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  userStatusMaster: UserStatusMasterRow;
  session?: { id: number; name?: string; academicYearId?: number } | null;
  academicYear?: { id: number; year?: string; name?: string } | null;
  class?: { id: number; name?: string; type?: string } | null;
}

interface UserStatusMasterRow {
  id: number;
  status: string;
  tag: string;
  description: string;
  enrollmentStatus: string;
  domains: { domain: string }[];
  frequencies: { frequency: string }[];
  levels: { level: string }[];
}

interface PromotionRow {
  id: number;
  studentId: number;
  sessionId: number;
  classId: number;
  session?: { id: number; name?: string; academicYearId?: number } | null;
  academicYear?: { id: number; year?: string; name?: string } | null;
  class?: { id: number; name?: string; type?: string } | null;
}

interface OverviewTabProps {
  studentId?: number;
  userId?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OverviewTab({ studentId, userId }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { availableAcademicYears } = useAcademicYear();
  const [filterAcademicYearId, setFilterAcademicYearId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Fetch user-status-mappings ──
  const {
    data: mappings,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserStatusMappingRow[]>({
    queryKey: ["user-status-mappings", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await axiosInstance.get(`/api/user-statuses/student/${studentId}`);
      return res.data?.payload ?? [];
    },
    enabled: !!studentId && studentId > 0,
  });

  // ── Fetch user-status-masters ──
  const { data: masters } = useQuery<UserStatusMasterRow[]>({
    queryKey: ["user-status-masters"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/user-statuses/masters");
      return res.data?.payload ?? [];
    },
  });

  // ── Fetch promotions for this student ──
  const { data: promotions } = useQuery<PromotionRow[]>({
    queryKey: ["student-promotions", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await axiosInstance.get(`/api/user-statuses/student/${studentId}/promotions`);
      return res.data?.payload ?? [];
    },
    enabled: !!studentId && studentId > 0,
  });

  // ── Filter mappings by academic year ──
  const filteredMappings = useMemo(() => {
    if (!mappings) return [];
    if (filterAcademicYearId === "all") return mappings;
    return mappings.filter((m) => String(m.academicYear?.id) === filterAcademicYearId);
  }, [mappings, filterAcademicYearId]);

  // ── Delete ──
  const handleDelete = async (mappingId: number) => {
    try {
      await axiosInstance.delete(`/api/user-statuses/${mappingId}`);
      toast.success("Status mapping deleted");
      refetch();
    } catch {
      toast.error("Failed to delete status mapping");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Fee Details</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
      </div>

      {/* User Status History — no Card wrapper */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold mb-3">User Status History</h3>

        {/* Filter bar + Add button — above table */}
        <div className="flex items-center justify-between mb-3 gap-4">
          {/* Left: Academic Year Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Academic Year:</Label>
            <Select value={filterAcademicYearId} onValueChange={setFilterAcademicYearId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableAcademicYears.map((ay) => (
                  <SelectItem key={ay.id} value={String(ay.id)}>
                    {ay.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right: Add Button */}
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Status
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading status history...</span>
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500 py-4">Failed to load status history.</p>
        ) : !mappings || mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No status records found.</p>
        ) : (
          <div className="rounded-md border border-gray-200 overflow-hidden shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead
                    style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                    className="w-16 text-xs font-semibold text-gray-600"
                  >
                    Sr. No.
                  </TableHead>
                  <TableHead
                    style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Status
                  </TableHead>
                  <TableHead
                    style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Tag
                  </TableHead>
                  <TableHead
                    style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Academic Year
                  </TableHead>
                  <TableHead
                    style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Semester
                  </TableHead>
                  <TableHead
                    style={{ padding: "12px 8px" }}
                    className="w-24 text-xs font-semibold text-gray-600 text-center"
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping, index) => (
                  <TableRow key={mapping.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }} className="text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                      {mapping.userStatusMaster.status === "ACTIVE" ? (
                        <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                      <Badge variant="outline" className={`text-xs ${getTagBadgeStyle(mapping.userStatusMaster.tag)}`}>
                        {mapping.userStatusMaster.tag}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                      {mapping.academicYear?.year || mapping.academicYear?.name ? (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                          {mapping.academicYear.year || mapping.academicYear.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                      {mapping.class?.name ? (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                          {mapping.class.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: "12px 8px" }} className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Status Dialog */}
      <AddStatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={studentId}
        userId={userId}
        byUserId={authUser?.id}
        masters={masters ?? []}
        promotions={promotions ?? []}
        existingMappings={mappings ?? []}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["user-status-mappings", studentId] });
        }}
      />
    </div>
  );
}

// ─── Add Status Dialog ───────────────────────────────────────────────────────

interface AddStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: number;
  userId?: number;
  byUserId?: number;
  masters: UserStatusMasterRow[];
  promotions: PromotionRow[];
  existingMappings: UserStatusMappingRow[];
  onSuccess: () => void;
}

function AddStatusDialog({
  open,
  onOpenChange,
  studentId,
  userId,
  byUserId,
  masters,
  promotions,
  existingMappings,
  onSuccess,
}: AddStatusDialogProps) {
  const [selectedMasterId, setSelectedMasterId] = useState<string>("");
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [suspendedTillDate, setSuspendedTillDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Only show masters with domain STUDENT
  const studentMasters = useMemo(() => {
    return masters.filter((m) => m.domains.some((d) => d.domain === "STUDENT"));
  }, [masters]);

  const selectedMaster = useMemo(() => {
    return studentMasters.find((m) => String(m.id) === selectedMasterId) ?? null;
  }, [studentMasters, selectedMasterId]);

  const selectedPromotion = useMemo(() => {
    return promotions.find((p) => String(p.id) === selectedPromotionId) ?? null;
  }, [promotions, selectedPromotionId]);

  const isSuspended = selectedMaster?.tag?.toLowerCase().includes("suspended") ?? false;

  // ── Client-side frequency validation ──
  const validateFrequency = (): string | null => {
    if (!selectedMaster) return "Please select a status.";
    if (!selectedPromotion) return "Please select a batch.";

    // Suspended must have a till-date
    if (isSuspended && !suspendedTillDate) {
      return "Suspended till date is required when assigning a Suspended status.";
    }

    const frequencies = selectedMaster.frequencies.map((f) => f.frequency);

    // ONLY_ONCE: check if this master already exists for this user at all
    if (frequencies.includes("ONLY_ONCE")) {
      const exists = existingMappings.some((m) => m.userStatusMaster.id === selectedMaster.id);
      if (exists) {
        return `"${selectedMaster.tag}" can only be assigned once. It already exists for this student.`;
      }
    }

    // PER_ACADEMIC_YEAR: check if same master + same academic year already exists
    if (frequencies.includes("PER_ACADEMIC_YEAR") && selectedPromotion?.academicYear?.id) {
      const exists = existingMappings.some(
        (m) => m.userStatusMaster.id === selectedMaster.id && m.academicYear?.id === selectedPromotion.academicYear?.id,
      );
      if (exists) {
        return `"${selectedMaster.tag}" already exists for academic year ${selectedPromotion.academicYear?.year || ""}.`;
      }
    }

    // PER_SEMESTER: check if same master + same class (via promotion) already exists
    if (frequencies.includes("PER_SEMESTER") && selectedPromotion?.class?.id) {
      const exists = existingMappings.some(
        (m) => m.userStatusMaster.id === selectedMaster.id && m.class?.id === selectedPromotion.class?.id,
      );
      if (exists) {
        return `"${selectedMaster.tag}" already exists for semester ${selectedPromotion.class?.name || ""}.`;
      }
    }

    // Check terminal status coexistence
    const terminalTags = ["Alumni", "Taken Transfer Certificate (TC)", "Cancelled Admission"];
    const hasTerminal = existingMappings.some((m) => terminalTags.includes(m.userStatusMaster.tag));
    if (hasTerminal && terminalTags.includes(selectedMaster.tag)) {
      return "A terminal status (Alumni / TC / Cancelled Admission) already exists. No further terminal statuses can be added.";
    }

    return null;
  };

  const handleMasterChange = (val: string) => {
    setSelectedMasterId(val);
    setValidationError(null);
    // Clear suspended date when switching away from suspended
    const master = studentMasters.find((m) => String(m.id) === val);
    if (!master?.tag?.toLowerCase().includes("suspended")) {
      setSuspendedTillDate("");
    }
  };

  const handlePromotionChange = (val: string) => {
    setSelectedPromotionId(val);
    setValidationError(null);
  };

  const handleSubmit = async () => {
    const error = validateFrequency();
    if (error) {
      setValidationError(error);
      return;
    }

    if (!userId || !studentId || !byUserId || !selectedMaster || !selectedPromotion) {
      toast.error("Missing required information");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/api/user-statuses", {
        userId,
        studentId,
        sessionId: selectedPromotion.sessionId,
        promotionId: selectedPromotion.id,
        byUserId,
        remarks: remarks || null,
        suspendedTillDate: isSuspended && suspendedTillDate ? new Date(suspendedTillDate).toISOString() : null,
        suspendedReason: isSuspended ? remarks || null : null,
        userStatusMaster: selectedMaster,
      });

      toast.success("Status mapping created");
      onSuccess();
      resetAndClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create status mapping";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedMasterId("");
    setSelectedPromotionId("");
    setRemarks("");
    setSuspendedTillDate("");
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAndClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Add User Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Batch (linked to session + academic year + class) */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-xs text-right text-gray-500">Batch</Label>
            <div className="col-span-3">
              <Select value={selectedPromotionId} onValueChange={handlePromotionChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {promotions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.academicYear?.year || "N/A"} | {p.class?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected batch info badges */}
          {selectedPromotion && (
            <div className="grid grid-cols-4 items-center gap-3">
              <div />
              <div className="col-span-3 flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                  {selectedPromotion.academicYear?.year || "-"}
                </Badge>
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                  {selectedPromotion.class?.name || "-"}
                </Badge>
              </div>
            </div>
          )}

          {/* User Status Master */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-xs text-right text-gray-500">Status</Label>
            <div className="col-span-3">
              <Select value={selectedMasterId} onValueChange={handleMasterChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select status tag" />
                </SelectTrigger>
                <SelectContent>
                  {studentMasters.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${getMasterDotColor(m.tag)}`} />
                        <span>{m.tag}</span>
                        <span className="text-gray-400 text-[10px]">({m.enrollmentStatus})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description — always reserve space to prevent layout shift */}
          <div className="grid grid-cols-4 items-start gap-3" style={{ minHeight: selectedMaster ? undefined : 0 }}>
            <div />
            <div className="col-span-3">
              {selectedMaster ? (
                <div className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 rounded-md p-2 border">
                  {selectedMaster.description}
                </div>
              ) : null}
            </div>
          </div>

          {/* Suspended Till Date — only shown when Suspended is selected */}
          {isSuspended && (
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-xs text-right text-gray-500">
                Suspended Till <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={suspendedTillDate}
                  onChange={(e) => setSuspendedTillDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="grid grid-cols-4 items-start gap-3">
            <Label className="text-xs text-right text-gray-500 pt-2">
              {isSuspended ? (
                <>
                  Reason <span className="text-red-500">*</span>
                </>
              ) : (
                "Remarks"
              )}
            </Label>
            <div className="col-span-3">
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder={isSuspended ? "Reason for suspension..." : "Optional remarks..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{validationError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={resetAndClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            onClick={handleSubmit}
            disabled={submitting || !selectedMasterId || !selectedPromotionId}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Add Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTagBadgeStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("regular")) return "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100";
  if (lower.includes("suspended")) return "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100";
  if (lower.includes("dropped")) return "border-red-400 text-red-700 bg-red-50 hover:bg-red-100";
  if (lower.includes("alumni")) return "border-cyan-400 text-cyan-700 bg-cyan-50 hover:bg-cyan-100";
  if (lower.includes("transfer") || lower.includes("tc"))
    return "border-violet-400 text-violet-700 bg-violet-50 hover:bg-violet-100";
  if (lower.includes("cancel")) return "border-rose-400 text-rose-700 bg-rose-50 hover:bg-rose-100";
  if (lower.includes("casual")) return "border-teal-400 text-teal-700 bg-teal-50 hover:bg-teal-100";
  return "border-gray-400 text-gray-600 bg-gray-50 hover:bg-gray-100";
}

/** Colored dot for each tag in the status dropdown */
function getMasterDotColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("regular")) return "bg-green-500";
  if (lower.includes("suspended")) return "bg-amber-500";
  if (lower.includes("dropped")) return "bg-red-500";
  if (lower.includes("alumni")) return "bg-cyan-500";
  if (lower.includes("transfer") || lower.includes("tc")) return "bg-violet-500";
  if (lower.includes("cancel")) return "bg-rose-500";
  if (lower.includes("casual")) return "bg-teal-500";
  return "bg-gray-400";
}
