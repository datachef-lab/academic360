import { User, Home, Heart, Phone, IdCard, Users, FilePenIcon, BookOpen, UserCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { getStudentById, fetchStudentByUid } from "@/services/student";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentContent from "@/components/student/StudentContent";
import StudentPanel from "@/components/student/StudentPanel";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import axiosInstance from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
// import { motion } from "framer-motion";
import { Tabs } from "@/components/ui/tabs";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useIsMobile } from "@/hooks/useMobile";

const studentTabs = [
  { label: "Overview", icon: <User size={16} />, endpoint: "/overview" },
  { label: "Personal", icon: <IdCard size={16} />, endpoint: "/personal-details" },
  { label: "Family", icon: <Users size={16} />, endpoint: "/family-details" },
  { label: "Health", icon: <Heart size={16} />, endpoint: "/health" },
  { label: "Emergency", icon: <Phone size={16} />, endpoint: "/emergency-contact" },
  //   { label: "History", icon: <Book size={16} />, endpoint: "/academic-history" },
  //   { label: "Identifiers", icon: <GraduationCap size={16} />, endpoint: "/academic-identifier" },
  { label: "Accommodation", icon: <Home size={16} />, endpoint: "/accommodation" },
  { label: "Academic", icon: <BookOpen size={16} />, endpoint: "/academic-details" },
  { label: "Marksheet", icon: <FilePenIcon size={16} />, endpoint: "/marksheet" },
];

export default function StudentPage() {
  useRestrictTempUsers();
  const queryClient = useQueryClient();
  const { studentId: studentIdOrUid } = useParams();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  type StudentTab = (typeof studentTabs)[number];
  const [activeTab, setActiveTab] = useState<StudentTab>(() => {
    if (location.state?.activeTab) {
      const matchingTab = studentTabs.find((tab) => tab.label === location.state.activeTab.label);
      return matchingTab ?? studentTabs[0]!;
    }
    return studentTabs[0]!;
  });

  const { data } = useQuery({
    queryKey: ["student", studentIdOrUid],
    queryFn: async () => {
      if (!studentIdOrUid) return undefined;
      // If the param looks like a UID (typically long numeric string), fetch by UID first
      const isProbablyUid = String(studentIdOrUid).length >= 8;
      if (isProbablyUid) {
        const student = await fetchStudentByUid(String(studentIdOrUid));
        return student;
      }
      const student = await getStudentById(Number(studentIdOrUid));
      return student;
    },
  });

  // Fetch linked user meta for status flags
  const { data: userData } = useQuery({
    queryKey: ["user-meta", data?.userId],
    enabled: Boolean(data?.userId),
    queryFn: async () => {
      const res = await axiosInstance.get("/api/users/query", { params: { id: String(data?.userId) } });
      return res.data.payload as {
        id: number;
        isActive: boolean;
        isSuspended: boolean;
        suspendedReason?: string | null;
        suspendedTillDate?: string | null;
      };
    },
  });

  // Helper function to convert timestamp from database (Asia/Kolkata) to datetime-local format
  const convertISOToDatetimeLocal = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return "";
    try {
      // If it's already in PostgreSQL format (YYYY-MM-DD HH:mm:ss), treat it as IST
      if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateValue)) {
        // Format: YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm
        const [datePart, timePart] = dateValue.split(" ");
        if (datePart && timePart) {
          const [hours, minutes] = timePart.split(":");
          return `${datePart}T${hours}:${minutes || "00"}`;
        }
      }

      let date: Date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        // Parse the date string - if it has timezone info, use it; otherwise assume Asia/Kolkata
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) return "";

      // Convert to Asia/Kolkata timezone (IST = UTC+5:30)
      // Use Intl.DateTimeFormat to get IST time components
      const istDateStr = date.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // Parse the formatted string (format: MM/DD/YYYY, HH:mm)
      const [datePart, timePart] = istDateStr.split(", ");
      if (!datePart || !timePart) return "";

      const [month, day, year] = datePart.split("/").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      if (!year || !month || !day || hours === undefined || minutes === undefined) return "";

      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  // Initialize status option state based on actual data
  const getInitialStatus = () => {
    if (userData?.isSuspended) return "SUSPENDED";
    if (data?.hasCancelledAdmission) return "CANCELLED_ADMISSION";
    if (data?.takenTransferCertificate) return "TC";
    if (data?.alumni && data?.active) return "GRADUATED_WITH_SUPP";
    if (data?.alumni && !data?.active) return "COMPLETED_LEFT";
    if (!data?.active && (data?.leavingDate || data?.leavingReason)) return "DROPPED_OUT";
    if (data?.active) return "REGULAR";
    return "DROPPED_OUT";
  };

  const [statusOption, setStatusOption] = useState<string>(getInitialStatus());

  // Sync status when userData or data changes
  useEffect(() => {
    if (!data && !userData) return;
    const newStatus = getInitialStatus();
    setStatusOption(newStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.isSuspended, data?.active, data?.hasCancelledAdmission, data?.takenTransferCertificate, data?.alumni]);

  // Show/hide fields based on initial status on load
  useEffect(() => {
    if (!statusOption || !data) return;

    const tcBox = document.getElementById("tc-extra");
    const cancelBox = document.getElementById("cancel-extra");
    const leavingBox = document.getElementById("leaving-extra");
    const suspendBox = document.getElementById("suspend-extra");

    // Show/hide based on status
    if (tcBox) tcBox.classList.toggle("hidden", statusOption !== "TC");
    if (cancelBox) cancelBox.classList.toggle("hidden", statusOption !== "CANCELLED_ADMISSION");
    if (suspendBox) suspendBox.classList.toggle("hidden", statusOption !== "SUSPENDED");

    const showLeaving = statusOption === "DROPPED_OUT" || statusOption === "COMPLETED_LEFT";
    if (leavingBox) {
      leavingBox.classList.toggle("hidden", !showLeaving);
    }
  }, [statusOption, data]);

  // Render student info panel (used in both Sheet and Desktop)
  const renderStudentInfoPanel = (isMobile: boolean) => {
    return (
      <>
        <div className="w-full bg-gradient-to-br from-purple-600 to-violet-500 rounded-t-2xl lg:rounded-t-2xl lg:rounded-tr-none p-3 sm:p-4 flex flex-col items-center">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white shadow mb-2">
            <AvatarImage
              className="object-cover"
              src={`https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${data?.uid}.jpg`}
              alt={(() => {
                const parts = [
                  data?.personalDetails?.firstName,
                  data?.personalDetails?.middleName,
                  data?.personalDetails?.lastName,
                ].filter(Boolean);
                return parts.length ? parts.join(" ") : "Student";
              })()}
            />
            <AvatarFallback className="text-lg sm:text-2xl font-bold bg-purple-100 text-purple-600">
              {(() => {
                const first = data?.personalDetails?.firstName || "?";
                return first.charAt(0);
              })()}
            </AvatarFallback>
          </Avatar>
          <div className="text-base sm:text-lg font-bold text-white mb-1 text-center w-full truncate">
            {(() => {
              const parts = [data?.name].filter(Boolean);
              return parts.length ? parts.join(" ") : "Student";
            })()}
          </div>
          <div className="flex flex-wrap gap-2 mt-1 mb-2 justify-center">
            <Badge
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                userData?.isSuspended
                  ? "bg-amber-500/90 hover:bg-amber-600 text-white"
                  : data?.active
                    ? "bg-emerald-500/90 hover:bg-emerald-600 text-white"
                    : "bg-red-500/90 hover:bg-red-500 text-white"
              }`}
            >
              {userData?.isSuspended ? "Suspended" : data?.active ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/20 rounded-full text-white border-white/40 font-medium text-xs"
            >
              UID: {data?.uid}
            </Badge>
          </div>
        </div>
        <div className="w-full bg-white rounded-b-2xl lg:rounded-b-2xl lg:rounded-bl-none shadow p-3 sm:p-4 flex flex-col items-center flex-1 overflow-y-auto">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-2 w-full text-xs sm:text-sm text-gray-700">
            <div className="font-semibold text-gray-500">UID:</div>
            <div>{data?.uid ?? "-"}</div>
            <div className="font-semibold text-gray-500">Roll No.:</div>
            <div>{"-"}</div>
            <div className="font-semibold text-gray-500">Reg. No.:</div>
            <div>{"-"}</div>
            <div className="font-semibold text-gray-500">Program Course:</div>
            <div>{data?.programCourse?.name || "-"}</div>
            <div className="font-semibold text-gray-500">Section:</div>
            <div>{data?.currentPromotion?.section?.name || "-"}</div>
            <div className="font-semibold text-gray-500">Shift:</div>
            <div>{data?.currentPromotion?.shift?.name || "-"}</div>
            <div className="font-semibold text-gray-500">Email:</div>
            <div>{data?.personalEmail || "-"}</div>
          </div>
          {/* User status controls */}
          <div className="w-full mt-3 sm:mt-4 border-t pt-3 space-y-2 sm:space-y-3 pb-20 sm:pb-24">
            {/* Student status dropdown */}
            <div className="space-y-1">
              <Label htmlFor="statusOption" className="text-xs sm:text-sm">
                Student Status
              </Label>
              <Select
                value={statusOption}
                onValueChange={(val) => {
                  setStatusOption(val);
                  const tcBox = document.getElementById("tc-extra");
                  const cancelBox = document.getElementById("cancel-extra");
                  const leavingBox = document.getElementById("leaving-extra");
                  const suspendBox = document.getElementById("suspend-extra");
                  const leavingDateInput = document.getElementById("leavingDate") as HTMLInputElement;
                  const cancelAtInput = document.getElementById("cancelAt") as HTMLInputElement;
                  const suspendedTillInput = document.getElementById("suspendedTill") as HTMLInputElement;
                  const leavingReasonEl = document.getElementById("leavingReason") as HTMLTextAreaElement;
                  const cancelReasonEl = document.getElementById("cancelReason") as HTMLTextAreaElement;
                  const tcReasonEl = document.getElementById("tcReason") as HTMLTextAreaElement;
                  const suspendedReasonEl = document.getElementById("suspendedReason") as HTMLTextAreaElement;

                  if (tcBox) tcBox.classList.toggle("hidden", val !== "TC");
                  if (cancelBox) cancelBox.classList.toggle("hidden", val !== "CANCELLED_ADMISSION");
                  if (suspendBox) suspendBox.classList.toggle("hidden", val !== "SUSPENDED");

                  // Handle leaving date fields
                  const showLeaving = val === "DROPPED_OUT" || val === "COMPLETED_LEFT";
                  if (leavingBox) {
                    leavingBox.classList.toggle("hidden", !showLeaving);
                  }

                  // Auto-set leaving date if showing and field is empty
                  if (showLeaving && leavingDateInput && !leavingDateInput.value) {
                    const now = new Date();
                    // Format as YYYY-MM-DDTHH:mm for datetime-local input
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const day = String(now.getDate()).padStart(2, "0");
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    leavingDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                  }

                  // Auto-set cancelled at
                  if (val === "CANCELLED_ADMISSION" && cancelAtInput && !cancelAtInput.value) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const day = String(now.getDate()).padStart(2, "0");
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    cancelAtInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                  }

                  // Auto-set suspended till
                  if (val === "SUSPENDED" && suspendedTillInput && !suspendedTillInput.value) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const day = String(now.getDate()).padStart(2, "0");
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    suspendedTillInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                  }

                  // Default reasons if empty when section becomes visible
                  if (showLeaving && leavingReasonEl && !leavingReasonEl.value) {
                    leavingReasonEl.value =
                      val === "DROPPED_OUT" ? "Left without completing the course" : "Completed program and left";
                  }
                  if (val === "CANCELLED_ADMISSION" && cancelReasonEl && !cancelReasonEl.value) {
                    cancelReasonEl.value = "Admission cancelled by administration";
                  }
                  if (val === "TC" && tcReasonEl && !tcReasonEl.value) {
                    tcReasonEl.value = "Transfer Certificate issued";
                  }
                  if (val === "SUSPENDED" && suspendedReasonEl && !suspendedReasonEl.value) {
                    suspendedReasonEl.value = "Suspended due to disciplinary reasons";
                  }
                }}
              >
                <SelectTrigger id="statusOption">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular (still studying)</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="DROPPED_OUT">Dropped Out (Left without completing)</SelectItem>
                  <SelectItem value="COMPLETED_LEFT">Completed & Left (Fully Graduated)</SelectItem>
                  <SelectItem value="GRADUATED_WITH_SUPP">Graduated but has supplementary papers</SelectItem>
                  <SelectItem value="TC">Taken Transfer Certificate (TC)</SelectItem>
                  <SelectItem value="CANCELLED_ADMISSION">Cancelled Admission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Suspended fields (shown when Suspended is selected in dropdown) */}
            <div id="suspend-extra" className={`space-y-2 ${userData?.isSuspended ? "" : "hidden"}`}>
              <div className="space-y-1">
                <Label htmlFor="suspendedReason" className="text-xs sm:text-sm">
                  Suspended Reason
                </Label>
                <Textarea
                  id="suspendedReason"
                  defaultValue={userData?.suspendedReason ?? ""}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="suspendedTill" className="text-xs sm:text-sm">
                  Suspended Till (IST)
                </Label>
                <Input
                  id="suspendedTill"
                  type="datetime-local"
                  defaultValue={convertISOToDatetimeLocal(userData?.suspendedTillDate)}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Leaving info (only for Dropped Out / Completed & Left) */}
            <div
              id="leaving-extra"
              className={`space-y-2 ${
                statusOption === "DROPPED_OUT" || statusOption === "COMPLETED_LEFT" ? "" : "hidden"
              }`}
            >
              <div className="space-y-1">
                <Label htmlFor="leavingDate" className="text-xs sm:text-sm">
                  Leaving Date (IST)
                </Label>
                <Input
                  id="leavingDate"
                  type="datetime-local"
                  defaultValue={convertISOToDatetimeLocal(data?.leavingDate)}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="leavingReason" className="text-xs sm:text-sm">
                  Leaving Reason
                </Label>
                <Textarea id="leavingReason" defaultValue={data?.leavingReason ?? ""} className="text-xs sm:text-sm" />
              </div>
            </div>

            {/* TC fields */}
            <div id="tc-extra" className={`space-y-2 ${statusOption === "TC" ? "" : "hidden"}`}>
              <div className="space-y-1">
                <Label htmlFor="tcReason" className="text-xs sm:text-sm">
                  TC Reason
                </Label>
                <Textarea
                  id="tcReason"
                  placeholder="Reason for Transfer Certificate"
                  defaultValue={data?.takenTransferCertificate ? (data?.leavingReason ?? "") : ""}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Cancelled Admission fields */}
            <div id="cancel-extra" className={`space-y-2 ${statusOption === "CANCELLED_ADMISSION" ? "" : "hidden"}`}>
              <div className="space-y-1">
                <Label htmlFor="cancelReason" className="text-xs sm:text-sm">
                  Cancelled Admission Reason
                </Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Reason"
                  defaultValue={data?.cancelledAdmissionReason ?? ""}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cancelAt" className="text-xs sm:text-sm">
                  Cancelled At (IST)
                </Label>
                <Input
                  id="cancelAt"
                  type="datetime-local"
                  defaultValue={convertISOToDatetimeLocal(data?.cancelledAdmissionAt)}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Fixed Save Button at Bottom of Screen */}
        <div
          className={`${isMobile ? "sticky" : "sticky lg:fixed"} bottom-0 right-0 w-full lg:w-[20%] bg-white border-t border-gray-200 shadow-lg z-10`}
        >
          <div className="p-3 sm:p-4">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={async () => {
                const userId = Number(data?.userId);
                const studentId = Number(data?.id);
                const suspendedReason = (document.getElementById("suspendedReason") as HTMLInputElement)?.value || null;
                const suspendedTillRaw = (document.getElementById("suspendedTill") as HTMLInputElement)?.value || "";
                const leavingDateRaw = (document.getElementById("leavingDate") as HTMLInputElement)?.value || "";
                const leavingReason = (document.getElementById("leavingReason") as HTMLInputElement)?.value || null;
                const cancelReason = (document.getElementById("cancelReason") as HTMLInputElement)?.value || null;
                const cancelAtRaw = (document.getElementById("cancelAt") as HTMLInputElement)?.value || "";

                // Helper function to convert datetime-local to timestamp string for Asia/Kolkata storage
                // This sends the timestamp as-is (treating it as IST) so DB stores it without UTC conversion
                const convertDatetimeLocalToIST = (datetimeLocal: string): string => {
                  if (!datetimeLocal) return "";
                  // datetime-local format: YYYY-MM-DDTHH:mm
                  // Treat this as already being in Asia/Kolkata timezone
                  // Format it as YYYY-MM-DD HH:mm:ss for PostgreSQL to store as-is
                  const parts = datetimeLocal.split("T");
                  if (parts.length !== 2) return "";
                  const [datePart, timePart] = parts;
                  if (!datePart || !timePart) return "";

                  const dateParts = datePart.split("-").map(Number);
                  const timeParts = timePart.split(":").map(Number);
                  if (dateParts.length !== 3 || timeParts.length < 2) return "";

                  const [year, month, day] = dateParts;
                  const [hours, minutes] = timeParts;

                  if (
                    year === undefined ||
                    month === undefined ||
                    day === undefined ||
                    hours === undefined ||
                    minutes === undefined
                  ) {
                    return "";
                  }

                  // Format as YYYY-MM-DD HH:mm:ss (PostgreSQL timestamp format)
                  // This will be stored as-is in the database without timezone conversion
                  const monthStr = String(month).padStart(2, "0");
                  const dayStr = String(day).padStart(2, "0");
                  const hoursStr = String(hours).padStart(2, "0");
                  const minutesStr = String(minutes).padStart(2, "0");

                  return `${year}-${monthStr}-${dayStr} ${hoursStr}:${minutesStr}:00`;
                };

                try {
                  // Determine active status based on statusOption (matching student.service.ts logic)
                  let isActive: boolean;
                  switch (statusOption) {
                    case "REGULAR":
                    case "GRADUATED_WITH_SUPP":
                    case "SUSPENDED":
                      isActive = true;
                      break;
                    case "DROPPED_OUT":
                    case "COMPLETED_LEFT":
                    case "TC":
                    case "CANCELLED_ADMISSION":
                      isActive = false;
                      break;
                    default:
                      isActive = userData?.isActive ?? data?.active ?? true;
                  }

                  // Update user table with suspended status and active status
                  const isSuspended = statusOption === "SUSPENDED";
                  await axiosInstance.put(`/api/users/${userId}`, {
                    isActive,
                    isSuspended,
                    suspendedReason: isSuspended ? suspendedReason : null,
                    suspendedTillDate:
                      isSuspended && suspendedTillRaw ? convertDatetimeLocalToIST(suspendedTillRaw) : null,
                  });

                  // Update student table with status
                  const studentPayload: Record<string, unknown> = { statusOption };

                  // Set fields based on status, and explicitly clear fields not used by this status
                  if (statusOption === "DROPPED_OUT" || statusOption === "COMPLETED_LEFT") {
                    studentPayload.leavingDate = leavingDateRaw ? convertDatetimeLocalToIST(leavingDateRaw) : null;
                    studentPayload.leavingReason = leavingReason;
                    // Clear other status-specific fields
                    studentPayload.takenTransferCertificate = false;
                    studentPayload.hasCancelledAdmission = false;
                    studentPayload.cancelledAdmissionReason = null;
                    studentPayload.cancelledAdmissionAt = null;
                  } else if (statusOption === "TC") {
                    studentPayload.takenTransferCertificate = true;
                    studentPayload.leavingReason =
                      (document.getElementById("tcReason") as HTMLInputElement)?.value || null;
                    // Clear other status-specific fields
                    studentPayload.leavingDate = null;
                    studentPayload.hasCancelledAdmission = false;
                    studentPayload.cancelledAdmissionReason = null;
                    studentPayload.cancelledAdmissionAt = null;
                  } else if (statusOption === "CANCELLED_ADMISSION") {
                    studentPayload.hasCancelledAdmission = true;
                    studentPayload.cancelledAdmissionReason = cancelReason;
                    // For cancelled at, use current IST time if not provided
                    if (cancelAtRaw) {
                      studentPayload.cancelledAdmissionAt = convertDatetimeLocalToIST(cancelAtRaw);
                    } else {
                      // Get current IST time
                      const now = new Date();
                      const istTime = now.toLocaleString("en-US", {
                        timeZone: "Asia/Kolkata",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      });
                      // Format: MM/DD/YYYY, HH:mm:ss -> YYYY-MM-DD HH:mm:ss
                      const parts = istTime.split(", ");
                      if (parts.length !== 2) {
                        // Fallback to current time if parsing fails
                        const now = new Date();
                        const fallbackIST = now.toLocaleString("en-US", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        });
                        const [fbDatePart, fbTimePart] = fallbackIST.split(", ");
                        const [fbMonth, fbDay, fbYear] = fbDatePart?.split("/") || [];
                        if (fbYear && fbMonth && fbDay && fbTimePart) {
                          studentPayload.cancelledAdmissionAt = `${fbYear}-${fbMonth.padStart(2, "0")}-${fbDay.padStart(2, "0")} ${fbTimePart}`;
                        }
                      } else {
                        const [datePart, timePart] = parts;
                        const dateParts = datePart?.split("/") || [];
                        const [month, day, year] = dateParts;
                        if (year && month && day && timePart) {
                          studentPayload.cancelledAdmissionAt = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`;
                        }
                      }
                    }
                    // Clear other status-specific fields
                    studentPayload.leavingDate = null;
                    studentPayload.leavingReason = null;
                    studentPayload.takenTransferCertificate = false;
                  } else {
                    // For REGULAR, GRADUATED_WITH_SUPP, SUSPENDED - clear all status-specific fields
                    studentPayload.leavingDate = null;
                    studentPayload.leavingReason = null;
                    studentPayload.takenTransferCertificate = false;
                    studentPayload.hasCancelledAdmission = false;
                    studentPayload.cancelledAdmissionReason = null;
                    studentPayload.cancelledAdmissionAt = null;
                  }

                  await axiosInstance.put(`/api/students/${studentId}/status`, studentPayload);

                  // Invalidate queries to refresh the UI
                  await queryClient.invalidateQueries({ queryKey: ["student", studentIdOrUid] });
                  if (data?.userId) {
                    await queryClient.invalidateQueries({ queryKey: ["user-meta", data.userId] });
                  }

                  toast.success("Status saved");
                } catch {
                  toast.error("Failed to save status");
                }
                if (isMobile) {
                  setIsMobileSheetOpen(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="w-full flex flex-col lg:flex-row min-h-screen lg:h-full lg:overflow-hidden">
        <Tabs defaultValue={activeTab?.label ?? ""} className="w-full lg:w-[80%] flex flex-col">
          <div className="flex-shrink-0 px-2 sm:px-4 pt-2 sm:pt-4">
            <StudentPanel studentTabs={studentTabs} activeTab={activeTab!} setActiveTab={setActiveTab} />
          </div>

          <div className="flex-1 lg:col-span-9 min-h-0 lg:h-[calc(100vh-2rem)] px-2 sm:px-4 overflow-y-auto">
            <div className="space-y-4 sm:space-y-6 pb-6 drop-shadow-md">
              <div className="bg-white/10 rounded-2xl">
                <StudentContent
                  activeTab={activeTab!}
                  studentId={Number(data?.id ?? 0)}
                  userId={Number(data?.userId ?? 0)}
                  personalEmail={data?.personalEmail ?? null}
                />
              </div>
            </div>
          </div>
        </Tabs>

        {/* Mobile Sheet Button */}
        {isMobile && (
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-lg"
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:max-w-md p-0 overflow-y-auto">
                <div className="h-full flex flex-col">{renderStudentInfoPanel(true)}</div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Right Panel - Desktop */}
        <div className="hidden lg:flex lg:w-[20%] lg:h-full flex-col items-center justify-start relative overflow-hidden border-l border-gray-200">
          {renderStudentInfoPanel(false)}
        </div>
      </div>
    </>
  );
}
